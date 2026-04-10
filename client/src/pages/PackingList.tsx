import { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon,
} from '@ionic/react';
import {
  addOutline, trashOutline, checkmarkCircle, ellipseOutline, closeOutline,
} from 'ionicons/icons';
import db from '../services/db';

interface CheckItem {
  id: string;
  category: string;
  text: string;
  checked: boolean;
}

const META_KEY = 'packing_list';

const defaultItems: Omit<CheckItem, 'id'>[] = [
  // Documents
  { category: 'documents', text: 'Passport (+ photocopy)', checked: false },
  { category: 'documents', text: 'Visa on Arrival cash (USD)', checked: false },
  { category: 'documents', text: 'Flight tickets (printed/saved)', checked: false },
  { category: 'documents', text: 'Hotel booking confirmations', checked: false },
  { category: 'documents', text: 'Travel insurance documents', checked: false },
  { category: 'documents', text: 'International driving permit', checked: false },
  // Money
  { category: 'money', text: 'INR cash for airport', checked: false },
  { category: 'money', text: 'USD cash for Visa on Arrival', checked: false },
  { category: 'money', text: 'Forex card / travel card', checked: false },
  { category: 'money', text: 'Debit/Credit cards (notify bank)', checked: false },
  // Electronics
  { category: 'electronics', text: 'Phone charger + cable', checked: false },
  { category: 'electronics', text: 'Power bank', checked: false },
  { category: 'electronics', text: 'Universal adapter (Type C/F for Bali)', checked: false },
  { category: 'electronics', text: 'Camera + memory card', checked: false },
  { category: 'electronics', text: 'Earphones/headphones', checked: false },
  // Clothing
  { category: 'clothing', text: 'Light clothes (tropical weather)', checked: false },
  { category: 'clothing', text: 'Swimwear', checked: false },
  { category: 'clothing', text: 'Sarong (for temple visits)', checked: false },
  { category: 'clothing', text: 'Rain jacket / light poncho', checked: false },
  { category: 'clothing', text: 'Comfortable walking shoes', checked: false },
  { category: 'clothing', text: 'Flip flops / sandals', checked: false },
  { category: 'clothing', text: 'Sunglasses', checked: false },
  { category: 'clothing', text: 'Hat / cap', checked: false },
  // Health & Hygiene
  { category: 'health', text: 'Sunscreen (SPF 50+)', checked: false },
  { category: 'health', text: 'Mosquito repellent', checked: false },
  { category: 'health', text: 'Basic medicines (paracetamol, ORS, etc)', checked: false },
  { category: 'health', text: 'Motion sickness tablets', checked: false },
  { category: 'health', text: 'Band-aids / first aid', checked: false },
  { category: 'health', text: 'Hand sanitizer', checked: false },
  { category: 'health', text: 'Toiletries', checked: false },
  // Misc
  { category: 'misc', text: 'Dry bag (for water activities)', checked: false },
  { category: 'misc', text: 'Day backpack', checked: false },
  { category: 'misc', text: 'Reusable water bottle', checked: false },
  { category: 'misc', text: 'Snacks for flight', checked: false },
  { category: 'misc', text: 'Neck pillow', checked: false },
];

const categoryConfig: Record<string, { label: string; emoji: string; color: string }> = {
  documents:   { label: 'Documents',       emoji: '📄', color: '#1B9C5A' },
  money:       { label: 'Money & Cards',   emoji: '💳', color: '#D97706' },
  electronics: { label: 'Electronics',     emoji: '🔌', color: '#0891B2' },
  clothing:    { label: 'Clothing',        emoji: '👕', color: '#7C3AED' },
  health:      { label: 'Health & Hygiene', emoji: '💊', color: '#059669' },
  misc:        { label: 'Miscellaneous',   emoji: '🎒', color: '#64748B' },
};

const categoryOrder = ['documents', 'money', 'electronics', 'clothing', 'health', 'misc'];

const PackingList: React.FC = () => {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const meta = await db.meta.get(META_KEY);
    if (meta) {
      try {
        setItems(JSON.parse(meta.value as string));
      } catch {
        await initDefaults();
      }
    } else {
      await initDefaults();
    }
    setLoading(false);
  };

  const initDefaults = async () => {
    const items = defaultItems.map((item, i) => ({
      ...item,
      id: `pack_${i}`,
    }));
    setItems(items);
    await db.meta.put({ key: META_KEY, value: JSON.stringify(items) });
  };

  const saveItems = async (newItems: CheckItem[]) => {
    setItems(newItems);
    await db.meta.put({ key: META_KEY, value: JSON.stringify(newItems) });
  };

  const toggleItem = (id: string) => {
    saveItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const addItem = (category: string) => {
    if (!newText.trim()) return;
    const newItem: CheckItem = {
      id: `pack_${Date.now()}`,
      category,
      text: newText.trim(),
      checked: false,
    };
    saveItems([...items, newItem]);
    setNewText('');
    setAddingTo(null);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
  };

  const totalItems = items.length;
  const checkedItems = items.filter(i => i.checked).length;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  if (loading) return null;

  return (
    <IonPage>
      <IonContent>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #EC4899 100%)',
          padding: '28px 20px 28px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              🎒 Packing Checklist
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '6px 0 0', fontSize: '0.82rem' }}>
              {checkedItems}/{totalItems} items packed
            </p>
            {/* Progress bar */}
            <div style={{
              marginTop: '14px', height: '8px', borderRadius: '4px',
              background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                background: 'rgba(255,255,255,0.9)',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '6px 0 0', fontSize: '0.72rem', textAlign: 'right' }}>
              {progress}% ready
            </p>
          </div>
        </div>

        {/* Categories */}
        <div style={{ padding: '8px 0 24px' }}>
          {categoryOrder.map(catKey => {
            const cat = categoryConfig[catKey];
            const catItems = items.filter(i => i.category === catKey);
            const catChecked = catItems.filter(i => i.checked).length;

            return (
              <div key={catKey} style={{ padding: '0 16px', marginBottom: '4px' }}>
                {/* Category Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0 6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                      {cat.emoji} {cat.label}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600, color: catChecked === catItems.length && catItems.length > 0 ? '#10B981' : 'var(--ion-color-medium)',
                      background: catChecked === catItems.length && catItems.length > 0 ? '#10B98118' : 'transparent',
                      padding: '1px 8px', borderRadius: '10px',
                    }}>
                      {catChecked}/{catItems.length}
                    </span>
                  </div>
                  <button
                    onClick={() => { setAddingTo(addingTo === catKey ? null : catKey); setNewText(''); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '4px 10px', borderRadius: '14px', border: 'none',
                      background: `${cat.color}15`, color: cat.color,
                      fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <IonIcon icon={addingTo === catKey ? closeOutline : addOutline} style={{ fontSize: '13px' }} />
                    {addingTo === catKey ? 'Cancel' : 'Add'}
                  </button>
                </div>

                {/* Add input */}
                {addingTo === catKey && (
                  <div style={{
                    display: 'flex', gap: '8px', marginBottom: '8px',
                  }}>
                    <input
                      placeholder="Add item..."
                      value={newText}
                      onChange={e => setNewText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addItem(catKey)}
                      autoFocus
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: '12px',
                        border: `1.5px solid ${cat.color}40`, fontSize: '0.85rem', fontFamily: 'inherit',
                        background: 'var(--ion-card-background, #1E293B)', color: 'var(--ion-text-color)',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => addItem(catKey)}
                      disabled={!newText.trim()}
                      style={{
                        padding: '10px 16px', borderRadius: '12px', border: 'none',
                        background: newText.trim() ? cat.color : '#475569',
                        color: 'white', fontSize: '0.82rem', fontWeight: 700,
                        cursor: newText.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Items */}
                {catItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 14px', marginBottom: '4px', borderRadius: '12px',
                      background: 'var(--ion-card-background, #1E293B)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      opacity: item.checked ? 0.55 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        display: 'flex', flexShrink: 0,
                      }}
                    >
                      <IonIcon
                        icon={item.checked ? checkmarkCircle : ellipseOutline}
                        style={{
                          fontSize: '22px',
                          color: item.checked ? '#10B981' : 'var(--ion-color-medium-tint, #555)',
                          transition: 'color 0.2s',
                        }}
                      />
                    </button>
                    <span style={{
                      flex: 1, fontSize: '0.88rem', fontWeight: 500,
                      textDecoration: item.checked ? 'line-through' : 'none',
                    }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                        color: 'var(--ion-color-medium)', flexShrink: 0, display: 'flex',
                      }}
                    >
                      <IonIcon icon={trashOutline} style={{ fontSize: '15px' }} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PackingList;
