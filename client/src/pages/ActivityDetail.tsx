import { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage,
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonIcon, IonSegment, IonSegmentButton, IonList, IonListHeader,
  IonSpinner, IonAlert,
} from '@ionic/react';
import {
  createOutline, trashOutline, saveOutline, closeOutline,
  timeOutline, locationOutline, carOutline, navigateOutline,
  documentOutline, cashOutline, attachOutline, addOutline,
  cameraOutline, imagesOutline,
} from 'ionicons/icons';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import db, { type LocalActivity } from '../services/db';
import { saveActivityLocally, deleteActivityLocally, ensureLocalData } from '../services/sync';
import TicketViewer from '../components/TicketViewer';
import PaymentBadge, { formatCurrency, formatINR, toINR } from '../components/PaymentBadge';
import { uploadTicket } from '../services/api';
import { priorityConfig } from './PendingItems';
import { getTimezoneLabel, isNonDefaultTimezone, TIMEZONE_IST, TIMEZONE_BALI } from '../services/timezone';

const categoryConfig: Record<string, { color: string; gradient: string; emoji: string; label: string }> = {
  sightseeing: { color: '#1B9C5A', gradient: 'linear-gradient(135deg, #1B9C5A, #10B981)', emoji: '🏛️', label: 'Sightseeing' },
  food:        { color: '#F06543', gradient: 'linear-gradient(135deg, #F06543, #F59E0B)', emoji: '🍽️', label: 'Food & Drink' },
  transport:   { color: '#64748B', gradient: 'linear-gradient(135deg, #64748B, #94A3B8)', emoji: '🚗', label: 'Transport' },
  adventure:   { color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #F06543)', emoji: '🏄', label: 'Adventure' },
  relaxation:  { color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #A855F7)', emoji: '🧘', label: 'Relaxation' },
  shopping:    { color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', emoji: '🛍️', label: 'Shopping' },
};

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const location = useLocation();
  const isNew = id === 'new';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const params = new URLSearchParams(location.search);
  const defaultDay = parseInt(params.get('day') || '1', 10);
  const startInEdit = isNew || params.get('edit') === 'true';

  const [activity, setActivity] = useState<LocalActivity>({
    _id: `local_${Date.now()}`,
    dayNumber: defaultDay,
    date: (() => {
      const d = new Date('2026-02-27');
      d.setDate(d.getDate() + defaultDay - 1);
      return d.toISOString().split('T')[0];
    })(),
    time: '09:00',
    title: '',
    location: '',
    category: 'sightseeing',
    transport: 'Private car',
    order: 99,
    updatedAt: Date.now(),
  });

  const [loading, setLoading] = useState(!isNew);
  const [editing, setEditing] = useState(startInEdit);
  const [segment, setSegment] = useState('details');
  const [showDelete, setShowDelete] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isNew) {
      ensureLocalData().then(async () => {
        const act = await db.activities.get(id);
        if (act) setActivity(act);
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const updateField = (field: keyof LocalActivity, value: any) => {
    setActivity(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'dayNumber') {
        const d = new Date('2026-02-27');
        d.setDate(d.getDate() + (value as number) - 1);
        updated.date = d.toISOString().split('T')[0];
      }
      return updated;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    await saveActivityLocally(activity, isNew);
    setDirty(false);
    if (isNew) {
      history.goBack();
    } else {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteActivityLocally(activity._id);
    history.goBack();
  };

  const handleCancelEdit = () => {
    // Reload original data
    if (!isNew) {
      db.activities.get(id).then(act => { if (act) setActivity(act); });
    }
    setDirty(false);
    setEditing(false);
  };

  const handleTicketUpload = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!activity._id.startsWith('local_')) {
      try {
        const updated = await uploadTicket(activity._id, file);
        const withImages = { ...activity, ticketImages: updated.ticketImages };
        setActivity(withImages);
        if (!editing) await saveActivityLocally(withImages, false);
        return;
      } catch { /* fallback */ }
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const images = [...(activity.ticketImages || []), reader.result as string];
      if (editing) {
        updateField('ticketImages', images);
      } else {
        const withImages = { ...activity, ticketImages: images };
        setActivity(withImages);
        await saveActivityLocally(withImages, false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleNavigate = () => {
    let url = activity.googleMapsUrl;
    if (!url && activity.latitude && activity.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`;
    }
    if (url) window.open(url, '_system');
  };

  if (loading) {
    return (
      <IonPage><IonContent>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><IonSpinner /></div>
      </IonContent></IonPage>
    );
  }

  const cat = categoryConfig[activity.category] || categoryConfig.sightseeing;

  // ==================== VIEW MODE ====================
  if (!editing) {
    return (
      <IonPage>
        <IonContent>
          {/* Hero */}
          <div style={{
            background: cat.gradient, padding: '28px 20px 28px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                  borderRadius: '20px', padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700,
                  color: 'white', letterSpacing: '0.5px',
                }}>
                  {cat.emoji} {cat.label} · Day {activity.dayNumber}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                    border: 'none', borderRadius: '20px', padding: '6px 14px',
                    color: 'white', fontSize: '0.82rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <IonIcon icon={createOutline} style={{ fontSize: '16px' }} /> Edit
                </button>
              </div>
              <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, margin: '4px 0', letterSpacing: '-0.5px' }}>
                {activity.title}
              </h1>
              <div style={{ marginTop: '4px' }}>
                <PaymentBadge status={activity.paymentStatus} amount={activity.amount} currency={activity.currency} />
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div style={{ padding: '16px' }}>
            {/* Time & Location */}
            <div style={{
              background: 'var(--ion-card-background, white)', borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '16px', marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IonIcon icon={timeOutline} style={{ fontSize: '18px', color: cat.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {activity.time}{activity.endTime ? ` – ${activity.endTime}` : ''}
                      {isNonDefaultTimezone(activity.timezone) && (
                        <span style={{
                          marginLeft: '8px', fontSize: '0.72rem', fontWeight: 700,
                          background: '#F5920B18', color: '#D97706', padding: '2px 8px', borderRadius: '8px',
                        }}>
                          {getTimezoneLabel(activity.timezone)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IonIcon icon={locationOutline} style={{ fontSize: '18px', color: cat.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{activity.location}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IonIcon icon={carOutline} style={{ fontSize: '18px', color: cat.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transport</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{activity.transport}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {activity.notes && (
              <div style={{
                background: 'var(--ion-card-background, white)', borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '16px', marginBottom: '12px',
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Notes</div>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--ion-text-color)' }}>
                  {activity.notes}
                </p>
              </div>
            )}

            {/* Navigate Button */}
            {(activity.googleMapsUrl || activity.latitude) && (
              <button onClick={handleNavigate} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '14px', borderRadius: '16px', border: 'none',
                background: cat.gradient, color: 'white', fontSize: '0.95rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px',
                boxShadow: `0 4px 16px ${cat.color}40`,
              }}>
                <IonIcon icon={navigateOutline} style={{ fontSize: '20px' }} />
                Open in Google Maps
              </button>
            )}

            {/* Photos & Attachments */}
            <div style={{
              background: 'var(--ion-card-background, white)', borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '16px', marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IonIcon icon={imagesOutline} style={{ fontSize: '18px', color: cat.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Photos & Attachments</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ion-text-color)' }}>
                      {(activity.ticketImages?.length || 0)} file{(activity.ticketImages?.length || 0) !== 1 ? 's' : ''}
                      {activity.bookingRef ? ` · Ref: ${activity.bookingRef}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px', borderRadius: '12px', border: 'none',
                    background: cat.gradient, color: 'white',
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 2px 8px ${cat.color}30`,
                  }}
                >
                  <IonIcon icon={cameraOutline} style={{ fontSize: '18px' }} /> Take Photo
                </button>
                <button
                  onClick={handleTicketUpload}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px', borderRadius: '12px', border: 'none',
                    background: `${cat.color}15`, color: cat.color,
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <IonIcon icon={attachOutline} style={{ fontSize: '16px' }} /> Add File
                </button>
              </div>

              {/* Photo grid */}
              {activity.ticketImages && activity.ticketImages.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px',
                  marginBottom: '8px',
                }}>
                  {activity.ticketImages.map((img, i) => (
                    <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '1', position: 'relative' }}>
                      {img.startsWith('data:application/pdf') || (!img.startsWith('data:') && img.endsWith('.pdf')) ? (
                        <div style={{
                          width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.68rem', color: 'var(--ion-color-medium)',
                        }}>
                          📄
                          <span style={{ marginTop: '4px' }}>PDF #{i + 1}</span>
                        </div>
                      ) : (
                        <img
                          src={img.startsWith('data:') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}`}
                          alt={`Photo ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(activity.bookingRef || activity.confirmationNumber) && (
                <TicketViewer
                  ticketImages={[]}
                  bookingRef={activity.bookingRef}
                  confirmationNumber={activity.confirmationNumber}
                />
              )}
              {!activity.bookingRef && !activity.confirmationNumber && (!activity.ticketImages || activity.ticketImages.length === 0) && (
                <div style={{ textAlign: 'center', padding: '8px 0 4px', color: 'var(--ion-color-medium)', fontSize: '0.82rem' }}>
                  Capture memories! Take a photo or attach tickets & receipts.
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onFileSelected} />
            <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFileSelected} />

            {/* Payment */}
            {activity.amount && activity.paymentStatus !== 'free' && (
              <div style={{
                background: 'var(--ion-card-background, white)', borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '16px', marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IonIcon icon={cashOutline} style={{ fontSize: '18px', color: cat.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment</span>
                      {activity.priority && priorityConfig[activity.priority] && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          background: priorityConfig[activity.priority].bg, color: priorityConfig[activity.priority].color,
                          padding: '1px 8px', borderRadius: '10px', fontSize: '0.62rem', fontWeight: 700,
                          border: `1px solid ${priorityConfig[activity.priority].color}25`,
                        }}>
                          {priorityConfig[activity.priority].emoji} {priorityConfig[activity.priority].label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {formatCurrency(activity.amount, activity.currency)}
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ion-color-medium)', marginLeft: '8px' }}>
                        ≈ {formatINR(toINR(activity.amount, activity.currency))}
                      </span>
                    </div>
                  </div>
                  <PaymentBadge status={activity.paymentStatus} />
                </div>
              </div>
            )}

            {/* Hint */}
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--ion-color-medium)', padding: '8px 0 20px' }}>
              Long-press on the card or tap Edit to modify
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ==================== EDIT MODE ====================
  return (
    <IonPage>
      <IonContent>
        {/* Edit toolbar */}
        <div style={{
          background: 'var(--ion-color-primary, #1B9C5A)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={isNew ? () => history.goBack() : handleCancelEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', color: 'white',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              padding: '4px 0',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: '20px' }} /> {isNew ? 'Back' : 'Cancel'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isNew && (
              <button
                onClick={() => setShowDelete(true)}
                style={{
                  background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '20px',
                  padding: '6px 12px', color: 'white', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600,
                }}
              >
                <IonIcon icon={trashOutline} style={{ fontSize: '16px' }} />
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '20px',
                padding: '6px 14px', color: 'white', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700,
              }}
            >
              <IonIcon icon={saveOutline} style={{ fontSize: '16px' }} /> Save
            </button>
          </div>
        </div>
        {/* Edit mode banner */}
        <div style={{
          background: 'linear-gradient(135deg, #F59E0B15, #F0654315)',
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.82rem', fontWeight: 600, color: '#D97706',
        }}>
          <IonIcon icon={createOutline} /> Editing: {isNew ? 'New Activity' : activity.title}
        </div>

        <IonSegment value={segment} onIonChange={e => setSegment(e.detail.value as string)}>
          <IonSegmentButton value="details">Details</IonSegmentButton>
          <IonSegmentButton value="tickets">Tickets</IonSegmentButton>
          <IonSegmentButton value="payment">Payment</IonSegmentButton>
        </IonSegment>

        {segment === 'details' && (
          <IonList>
            <IonItem>
              <IonInput label="Title" labelPlacement="stacked" value={activity.title}
                onIonInput={e => updateField('title', e.detail.value)} placeholder="Activity name" />
            </IonItem>
            <IonItem>
              <IonInput label="Date" labelPlacement="stacked" type="date"
                value={activity.date}
                min="2026-02-26" max="2026-03-08"
                onIonInput={e => {
                  const val = e.detail.value as string;
                  if (val) {
                    const picked = new Date(val + 'T00:00:00');
                    const tripStart = new Date('2026-02-27T00:00:00');
                    const dayNum = Math.round((picked.getTime() - tripStart.getTime()) / 86400000) + 1;
                    if (dayNum >= 0 && dayNum <= 10) {
                      setActivity(prev => ({ ...prev, date: val, dayNumber: dayNum }));
                      setDirty(true);
                    }
                  }
                }}
              />
            </IonItem>
            <IonItem>
              <IonInput label="Start Time" labelPlacement="stacked" type="time" value={activity.time}
                onIonInput={e => updateField('time', e.detail.value)} />
            </IonItem>
            <IonItem>
              <IonInput label="End Time" labelPlacement="stacked" type="time" value={activity.endTime || ''}
                onIonInput={e => updateField('endTime', e.detail.value)} />
            </IonItem>
            <IonItem>
              <IonSelect label="Timezone" labelPlacement="stacked" value={activity.timezone || TIMEZONE_BALI}
                onIonChange={e => updateField('timezone', e.detail.value)}>
                <IonSelectOption value={TIMEZONE_BALI}>Bali (WITA, UTC+8)</IonSelectOption>
                <IonSelectOption value={TIMEZONE_IST}>India (IST, UTC+5:30)</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonInput label="Location" labelPlacement="stacked" value={activity.location}
                onIonInput={e => updateField('location', e.detail.value)} placeholder="Where is this?" />
            </IonItem>
            <IonItem>
              <IonSelect label="Category" labelPlacement="stacked" value={activity.category}
                onIonChange={e => updateField('category', e.detail.value)}>
                <IonSelectOption value="sightseeing">Sightseeing</IonSelectOption>
                <IonSelectOption value="food">Food & Drink</IonSelectOption>
                <IonSelectOption value="transport">Transport</IonSelectOption>
                <IonSelectOption value="adventure">Adventure</IonSelectOption>
                <IonSelectOption value="relaxation">Relaxation</IonSelectOption>
                <IonSelectOption value="shopping">Shopping</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonInput label="Transport" labelPlacement="stacked" value={activity.transport}
                onIonInput={e => updateField('transport', e.detail.value)} placeholder="How to get there" />
            </IonItem>
            <IonItem>
              <IonInput label="Sort Order" labelPlacement="stacked" type="number" value={activity.order}
                onIonInput={e => updateField('order', parseInt(e.detail.value || '99', 10))} />
            </IonItem>
            <IonItem>
              <IonTextarea label="Notes" labelPlacement="stacked" value={activity.notes || ''}
                onIonInput={e => updateField('notes', e.detail.value)} placeholder="Tips, reminders..." rows={3} />
            </IonItem>
            <IonItem>
              <IonInput label="Google Maps URL" labelPlacement="stacked" value={activity.googleMapsUrl || ''}
                onIonInput={e => updateField('googleMapsUrl', e.detail.value)} placeholder="https://maps.google.com/..." />
            </IonItem>
          </IonList>
        )}

        {segment === 'tickets' && (
          <>
            <input type="file" ref={fileInputRef} accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onFileSelected} />
            <div style={{ padding: '16px 0' }}>
              <IonList>
                <IonItem>
                  <IonInput label="Booking Reference" labelPlacement="stacked" value={activity.bookingRef || ''}
                    onIonInput={e => updateField('bookingRef', e.detail.value)} placeholder="e.g. BK-12345" />
                </IonItem>
                <IonItem>
                  <IonInput label="Confirmation Number" labelPlacement="stacked" value={activity.confirmationNumber || ''}
                    onIonInput={e => updateField('confirmationNumber', e.detail.value)} placeholder="e.g. CONF-98765" />
                </IonItem>
              </IonList>
              <TicketViewer
                ticketImages={activity.ticketImages}
                bookingRef={activity.bookingRef}
                confirmationNumber={activity.confirmationNumber}
                onAddTicket={handleTicketUpload}
              />
            </div>
          </>
        )}

        {segment === 'payment' && (
          <IonList>
            <IonItem>
              <IonInput label="Amount" labelPlacement="stacked" type="number" value={activity.amount || ''}
                onIonInput={e => updateField('amount', parseFloat(e.detail.value || '0'))} placeholder="0" />
            </IonItem>
            <IonItem>
              <IonSelect label="Currency" labelPlacement="stacked" value={activity.currency || 'IDR'}
                onIonChange={e => updateField('currency', e.detail.value)}>
                <IonSelectOption value="IDR">IDR (Indonesian Rupiah)</IonSelectOption>
                <IonSelectOption value="USD">USD (US Dollar)</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonSelect label="Payment Status" labelPlacement="stacked" value={activity.paymentStatus || 'free'}
                onIonChange={e => updateField('paymentStatus', e.detail.value)}>
                <IonSelectOption value="free">Free</IonSelectOption>
                <IonSelectOption value="pending">Pending</IonSelectOption>
                <IonSelectOption value="paid">Paid</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonSelect label="Priority" labelPlacement="stacked" value={activity.priority || ''}
                onIonChange={e => updateField('priority', e.detail.value)}>
                <IonSelectOption value="">No Priority</IonSelectOption>
                <IonSelectOption value="must-pay">Must Pay</IonSelectOption>
                <IonSelectOption value="book-ahead">Book Ahead</IonSelectOption>
                <IonSelectOption value="pay-there">Pay There</IonSelectOption>
                <IonSelectOption value="optional">Optional</IonSelectOption>
              </IonSelect>
            </IonItem>
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <PaymentBadge status={activity.paymentStatus} amount={activity.amount} currency={activity.currency} />
              {activity.priority && priorityConfig[activity.priority] && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: priorityConfig[activity.priority].bg, color: priorityConfig[activity.priority].color,
                    padding: '4px 14px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700,
                    border: `1px solid ${priorityConfig[activity.priority].color}30`,
                  }}>
                    {priorityConfig[activity.priority].emoji} {priorityConfig[activity.priority].label}
                  </span>
                </div>
              )}
            </div>
          </IonList>
        )}

        {dirty && (
          <div style={{ padding: '16px' }}>
            <button onClick={handleSave} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '14px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, #1B9C5A, #10B981)', color: 'white',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(27, 156, 90, 0.3)',
            }}>
              <IonIcon icon={saveOutline} style={{ fontSize: '18px' }} /> Save Changes
            </button>
          </div>
        )}

        <IonAlert
          isOpen={showDelete}
          onDidDismiss={() => setShowDelete(false)}
          header="Delete Activity"
          message="Are you sure you want to delete this activity?"
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: handleDelete },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ActivityDetail;
