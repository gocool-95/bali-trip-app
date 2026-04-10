import { useState, useRef, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner,
} from '@ionic/react';
import {
  documentTextOutline, callOutline, medkitOutline, businessOutline,
  carOutline, addOutline, trashOutline, createOutline, closeOutline,
  shieldCheckmarkOutline, airplaneOutline, personOutline, copyOutline,
} from 'ionicons/icons';
import db from '../services/db';

interface DocEntry {
  id: string;
  category: string;
  label: string;
  value: string;
  attachment?: string; // base64
}

const categories = [
  { key: 'passport', label: 'Passport & Visa', icon: documentTextOutline, color: '#1B9C5A', emoji: '🛂' },
  { key: 'insurance', label: 'Travel Insurance', icon: shieldCheckmarkOutline, color: '#0891B2', emoji: '🛡️' },
  { key: 'flights', label: 'Flight Details', icon: airplaneOutline, color: '#7C3AED', emoji: '✈️' },
  { key: 'hotels', label: 'Hotels & Stay', icon: businessOutline, color: '#D97706', emoji: '🏨' },
  { key: 'transport', label: 'Driver & Transport', icon: carOutline, color: '#DC2626', emoji: '🚗' },
  { key: 'emergency', label: 'Emergency Contacts', icon: callOutline, color: '#EF4444', emoji: '🆘' },
  { key: 'medical', label: 'Medical Info', icon: medkitOutline, color: '#059669', emoji: '💊' },
  { key: 'other', label: 'Other Documents', icon: personOutline, color: '#64748B', emoji: '📄' },
];

const META_KEY = 'travel_docs';

const TravelDocs: React.FC = () => {
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachTarget, setAttachTarget] = useState<string | null>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const meta = await db.meta.get(META_KEY);
    if (meta) {
      try {
        setDocs(JSON.parse(meta.value as string));
      } catch { setDocs([]); }
    }
    setLoading(false);
  };

  const saveDocs = async (newDocs: DocEntry[]) => {
    setDocs(newDocs);
    await db.meta.put({ key: META_KEY, value: JSON.stringify(newDocs) });
  };

  const addEntry = async (category: string) => {
    if (!newLabel.trim() || !newValue.trim()) return;
    const entry: DocEntry = {
      id: `doc_${Date.now()}`,
      category,
      label: newLabel.trim(),
      value: newValue.trim(),
    };
    await saveDocs([...docs, entry]);
    setNewLabel('');
    setNewValue('');
    setAddingTo(null);
  };

  const deleteEntry = async (id: string) => {
    await saveDocs(docs.filter(d => d.id !== id));
  };

  const updateEntry = async (id: string, label: string, value: string) => {
    await saveDocs(docs.map(d => d.id === id ? { ...d, label, value } : d));
    setEditingId(null);
  };

  const handleAttach = (docId: string) => {
    setAttachTarget(docId);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attachTarget) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await saveDocs(docs.map(d => d.id === attachTarget ? { ...d, attachment: reader.result as string } : d));
      setAttachTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (loading) {
    return (
      <IonPage><IonContent>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><IonSpinner /></div>
      </IonContent></IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent>
        <input type="file" ref={fileInputRef} accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onFileSelected} />

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)',
          padding: '28px 20px 28px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius: '50%',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              📋 Travel Documents
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: '6px 0 0', fontSize: '0.82rem' }}>
              All your important info in one place
            </p>
          </div>
        </div>

        {/* Category Sections */}
        <div style={{ padding: '8px 0 20px' }}>
          {categories.map(cat => {
            const catDocs = docs.filter(d => d.category === cat.key);
            return (
              <div key={cat.key} style={{ padding: '0 16px', marginBottom: '8px' }}>
                {/* Category Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0 6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IonIcon icon={cat.icon} style={{ fontSize: '16px', color: cat.color }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {cat.emoji} {cat.label}
                    </span>
                  </div>
                  <button
                    onClick={() => { setAddingTo(addingTo === cat.key ? null : cat.key); setNewLabel(''); setNewValue(''); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 12px', borderRadius: '16px', border: 'none',
                      background: addingTo === cat.key ? `${cat.color}30` : `${cat.color}15`,
                      color: cat.color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <IonIcon icon={addingTo === cat.key ? closeOutline : addOutline} style={{ fontSize: '14px' }} />
                    {addingTo === cat.key ? 'Cancel' : 'Add'}
                  </button>
                </div>

                {/* Add form */}
                {addingTo === cat.key && (
                  <div style={{
                    background: `${cat.color}08`, borderRadius: '14px', padding: '14px',
                    marginBottom: '8px', border: `1px dashed ${cat.color}40`,
                  }}>
                    <input
                      placeholder="Label (e.g., Passport Number)"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                        border: `1.5px solid ${cat.color}30`, fontSize: '0.88rem', fontFamily: 'inherit',
                        background: 'var(--ion-background-color, white)', color: 'var(--ion-text-color)',
                        marginBottom: '8px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <input
                      placeholder="Value (e.g., A1234567)"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                        border: `1.5px solid ${cat.color}30`, fontSize: '0.88rem', fontFamily: 'inherit',
                        background: 'var(--ion-background-color, white)', color: 'var(--ion-text-color)',
                        marginBottom: '10px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => addEntry(cat.key)}
                      disabled={!newLabel.trim() || !newValue.trim()}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '12px', border: 'none',
                        background: newLabel.trim() && newValue.trim() ? cat.color : '#94A3B8',
                        color: 'white', fontSize: '0.85rem', fontWeight: 700,
                        cursor: newLabel.trim() && newValue.trim() ? 'pointer' : 'default',
                        fontFamily: 'inherit',
                      }}
                    >
                      Save
                    </button>
                  </div>
                )}

                {/* Entries */}
                {catDocs.length === 0 && addingTo !== cat.key && (
                  <div style={{
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'var(--ion-card-background, white)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    fontSize: '0.82rem', color: 'var(--ion-color-medium)', fontStyle: 'italic',
                  }}>
                    No entries yet. Tap + Add to save info.
                  </div>
                )}

                {catDocs.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px', marginBottom: '6px', borderRadius: '14px',
                      background: 'var(--ion-card-background, white)',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                      borderLeft: `3px solid ${cat.color}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === doc.id ? (
                        <EditableEntry
                          doc={doc}
                          color={cat.color}
                          onSave={(l, v) => updateEntry(doc.id, l, v)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {doc.label}
                          </div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, marginTop: '2px', wordBreak: 'break-word' }}>
                            {doc.value}
                          </div>
                          {doc.attachment && (
                            <div style={{ marginTop: '6px' }}>
                              {doc.attachment.startsWith('data:image') ? (
                                <img src={doc.attachment} alt={doc.label} style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }} />
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: cat.color, fontWeight: 600 }}>
                                  📎 Document attached
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {editingId !== doc.id && (
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => copyToClipboard(doc.value)}
                          style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--ion-color-medium)' }}
                        >
                          <IonIcon icon={copyOutline} style={{ fontSize: '16px' }} />
                        </button>
                        <button
                          onClick={() => handleAttach(doc.id)}
                          style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--ion-color-medium)' }}
                        >
                          <IonIcon icon={documentTextOutline} style={{ fontSize: '16px' }} />
                        </button>
                        <button
                          onClick={() => setEditingId(doc.id)}
                          style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--ion-color-medium)' }}
                        >
                          <IonIcon icon={createOutline} style={{ fontSize: '16px' }} />
                        </button>
                        <button
                          onClick={() => deleteEntry(doc.id)}
                          style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: '#EF4444' }}
                        >
                          <IonIcon icon={trashOutline} style={{ fontSize: '16px' }} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Pre-filled Emergency Numbers */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #DC262615, #EF444415)', borderRadius: '16px',
            padding: '16px', border: '1px solid #EF444420',
          }}>
            <h4 style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '0.9rem', color: '#DC2626' }}>
              🆘 Quick Emergency Numbers
            </h4>
            {[
              { label: 'Bali Emergency', value: '112' },
              { label: 'Tourist Police', value: '+62 361 224111' },
              { label: 'Ambulance', value: '118' },
              { label: 'Indian Embassy Jakarta', value: '+62 21 5204150' },
              { label: 'KBRI Bali (Consulate)', value: '+62 361 751135' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: i < 4 ? '1px solid #EF444415' : 'none',
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--ion-text-color)' }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a
                    href={`tel:${item.value.replace(/\s/g, '')}`}
                    style={{
                      fontWeight: 700, fontSize: '0.85rem', color: '#DC2626', textDecoration: 'none',
                    }}
                  >
                    {item.value}
                  </a>
                  <button
                    onClick={() => copyToClipboard(item.value)}
                    style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#DC2626' }}
                  >
                    <IonIcon icon={copyOutline} style={{ fontSize: '14px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

// Inline edit component
const EditableEntry: React.FC<{
  doc: DocEntry;
  color: string;
  onSave: (label: string, value: string) => void;
  onCancel: () => void;
}> = ({ doc, color, onSave, onCancel }) => {
  const [label, setLabel] = useState(doc.label);
  const [value, setValue] = useState(doc.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        style={{
          padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${color}40`,
          fontSize: '0.82rem', fontFamily: 'inherit', background: 'var(--ion-background-color, white)',
          color: 'var(--ion-text-color)', outline: 'none',
        }}
      />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{
          padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${color}40`,
          fontSize: '0.82rem', fontFamily: 'inherit', background: 'var(--ion-background-color, white)',
          color: 'var(--ion-text-color)', outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => onSave(label, value)}
          style={{
            flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
            background: color, color: 'white', fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px', borderRadius: '10px', border: `1px solid ${color}40`,
            background: 'none', color: color, fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TravelDocs;
