import { useState, useRef, useCallback } from 'react';
import {
  IonContent, IonPage, IonRefresher, IonRefresherContent,
  IonIcon, IonSpinner, IonActionSheet, useIonViewWillEnter,
} from '@ionic/react';
import {
  timeOutline, locationOutline, navigateOutline,
  arrowForwardOutline, checkmarkCircleOutline,
  flagOutline, alertCircleOutline, calendarOutline,
  walletOutline, ellipseOutline, closeOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { formatCurrency, formatINR, toINR, totalToINR } from '../components/PaymentBadge';
import type { LocalActivity } from '../services/db';

export const priorityConfig: Record<string, { label: string; color: string; bg: string; emoji: string; order: number }> = {
  'must-pay':    { label: 'Must Pay',    color: '#DC2626', bg: '#DC262618', emoji: '🔴', order: 1 },
  'book-ahead':  { label: 'Book Ahead',  color: '#D97706', bg: '#D9770618', emoji: '🟠', order: 2 },
  'pay-there':   { label: 'Pay There',   color: '#0891B2', bg: '#0891B218', emoji: '🔵', order: 3 },
  'optional':    { label: 'Optional',    color: '#64748B', bg: '#64748B18', emoji: '⚪', order: 4 },
};

const dayTitles = [
  'Pre-Trip', 'Day 1 · Arrival', 'Day 2 · Nusa Penida', 'Day 3 · Gili T',
  'Day 4 · Gili T', 'Day 5 · Ubud & Lovina', 'Day 6 · Lovina',
  'Day 7 · Mt Batur', 'Day 8 · Canggu', 'Day 9 · Uluwatu', 'Day 10 · Departure',
];

const dayEmojis = ['🧳', '✈️', '🏝️', '⛵', '🤿', '🌋', '🐬', '🌄', '🏖️', '🏄', '👋'];

const LONG_PRESS_MS = 500;

const PendingItems: React.FC = () => {
  const history = useHistory();
  const { activities, loading, syncing, sync, saveActivity, refresh } = useActivities();
  const [selectedAct, setSelectedAct] = useState<LocalActivity | null>(null);

  // Reload data when page becomes visible (Ionic keeps pages mounted)
  useIonViewWillEnter(() => { refresh(); });
  const [showActions, setShowActions] = useState(false);

  // Long-press tracking
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = useCallback((act: LocalActivity) => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setSelectedAct(act);
      setShowActions(true);
      if (navigator.vibrate) navigator.vibrate(30);
    }, LONG_PRESS_MS);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, act: LocalActivity) => {
    e.preventDefault();
    setSelectedAct(act);
    setShowActions(true);
  }, []);

  const handleRefresh = async (event: CustomEvent) => {
    await sync();
    event.detail.complete();
  };

  const pendingActivities = activities
    .filter(a => a.amount && a.amount > 0 && a.paymentStatus === 'pending')
    .sort((a, b) => {
      const aPri = priorityConfig[a.priority || '']?.order ?? 99;
      const bPri = priorityConfig[b.priority || '']?.order ?? 99;
      if (aPri !== bPri) return aPri - bPri;
      return a.dayNumber - b.dayNumber;
    });

  const markAsPaid = async (e: React.MouseEvent, act: LocalActivity) => {
    e.stopPropagation();
    await saveActivity({ ...act, paymentStatus: 'paid' });
  };

  const handleNavigate = (e: React.MouseEvent, act: LocalActivity) => {
    e.stopPropagation();
    let url = act.googleMapsUrl;
    if (!url && act.latitude && act.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${act.latitude},${act.longitude}`;
    }
    if (url) window.open(url, '_system');
  };

  // Group by day
  const dayGroups: Record<number, LocalActivity[]> = {};
  for (const act of pendingActivities) {
    if (!dayGroups[act.dayNumber]) dayGroups[act.dayNumber] = [];
    dayGroups[act.dayNumber].push(act);
  }
  const sortedDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

  // Totals
  let totalPendingIDR = 0, totalPendingUSD = 0;
  for (const act of pendingActivities) {
    if (act.currency === 'USD') totalPendingUSD += act.amount!;
    else totalPendingIDR += act.amount!;
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #F06543 100%)',
          padding: '28px 20px 28px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                  Pending Items
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '0.85rem' }}>
                  {pendingActivities.length} item{pendingActivities.length !== 1 ? 's' : ''} to take care of
                </p>
              </div>
              {syncing && <IonSpinner name="dots" style={{ color: 'white' }} />}
            </div>
          </div>
        </div>

        {/* Summary pill */}
        {pendingActivities.length > 0 && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{
              display: 'flex', gap: '10px',
            }}>
              <div style={{
                flex: 1, background: 'linear-gradient(135deg, #D97706, #F59E0B)', borderRadius: '16px',
                padding: '14px', textAlign: 'center', boxShadow: '0 4px 16px rgba(217,119,6,0.2)',
              }}>
                <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>PENDING IDR</p>
                <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                  {totalPendingIDR > 0 ? formatCurrency(totalPendingIDR, 'IDR') : '—'}
                </p>
                {totalPendingIDR > 0 && <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>≈ {formatINR(toINR(totalPendingIDR, 'IDR'))}</p>}
              </div>
              {totalPendingUSD > 0 && (
                <div style={{
                  flex: 1, background: 'linear-gradient(135deg, #F06543, #FB923C)', borderRadius: '16px',
                  padding: '14px', textAlign: 'center', boxShadow: '0 4px 16px rgba(240,101,67,0.2)',
                }}>
                  <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>PENDING USD</p>
                  <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                    ${totalPendingUSD}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>≈ {formatINR(toINR(totalPendingUSD, 'USD'))}</p>
                </div>
              )}
              <div style={{
                flex: 1, background: 'linear-gradient(135deg, #1E293B, #334155)', borderRadius: '16px',
                padding: '14px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}>
                <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.5)' }}>TOTAL INR</p>
                <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                  {formatINR(totalToINR(totalPendingIDR, totalPendingUSD))}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <IonSpinner />
          </div>
        ) : pendingActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ion-color-medium)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
            <h3 style={{ fontWeight: 700, margin: '0 0 4px' }}>All caught up!</h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>No pending payments. Everything is paid for.</p>
          </div>
        ) : (
          <div style={{ padding: '4px 0 20px' }}>
            {sortedDays.map(dayNum => (
              <div key={dayNum}>
                <div style={{
                  padding: '14px 20px 6px',
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1.5px',
                  textTransform: 'uppercase', color: 'var(--ion-color-medium)',
                }}>
                  {dayEmojis[dayNum]} {dayTitles[dayNum]}
                </div>

                {dayGroups[dayNum].map(act => {
                  const pri = priorityConfig[act.priority || ''];
                  const borderColor = pri?.color || '#D97706';
                  return (
                  <div
                    key={act._id}
                    onClick={() => { if (!didLongPress.current) history.push(`/activity/${act._id}`); }}
                    onTouchStart={() => handleTouchStart(act)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onContextMenu={(e) => handleContextMenu(e, act)}
                    style={{
                      margin: '0 16px 8px', padding: '14px 16px',
                      background: 'var(--ion-card-background, white)', borderRadius: '16px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      borderLeft: `4px solid ${borderColor}`, cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      userSelect: 'none', WebkitUserSelect: 'none',
                    }}
                  >
                    {/* Title row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, letterSpacing: '-0.2px' }}>
                          {act.title}
                        </h4>
                        {pri && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: pri.bg, color: pri.color, padding: '2px 10px', borderRadius: '12px',
                            fontSize: '0.68rem', fontWeight: 700, marginTop: '4px',
                            border: `1px solid ${pri.color}30`,
                          }}>
                            {pri.emoji} {pri.label}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        <span style={{
                          background: '#D9770618', color: '#D97706', padding: '3px 10px', borderRadius: '20px',
                          fontSize: '0.78rem', fontWeight: 700, border: '1px solid #D9770630', whiteSpace: 'nowrap',
                        }}>
                          {formatCurrency(act.amount!, act.currency)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)', fontWeight: 500 }}>
                          ≈ {formatINR(toINR(act.amount!, act.currency))}
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: '14px' }} />
                        {act.time}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={locationOutline} style={{ fontSize: '14px' }} />
                        {act.location}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={(e) => markAsPaid(e, act)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '7px 16px', borderRadius: '20px', border: 'none',
                          background: 'linear-gradient(135deg, #059669, #10B981)', color: 'white',
                          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                        }}
                      >
                        <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '15px' }} /> Mark Paid
                      </button>
                      {(act.googleMapsUrl || act.latitude) && (
                        <button
                          onClick={(e) => handleNavigate(e, act)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', borderRadius: '20px', border: 'none',
                            background: '#0891B215', color: '#0891B2',
                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <IonIcon icon={navigateOutline} style={{ fontSize: '14px' }} /> Navigate
                        </button>
                      )}
                      <div style={{ flex: 1 }} />
                      <IonIcon icon={arrowForwardOutline} style={{ color: 'var(--ion-color-medium)', fontSize: '16px', alignSelf: 'center' }} />
                    </div>
                  </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        {/* Long-press Action Sheet */}
        <IonActionSheet
          isOpen={showActions}
          onDidDismiss={() => setShowActions(false)}
          header={selectedAct?.title || 'Set Priority'}
          subHeader={selectedAct ? `${formatCurrency(selectedAct.amount!, selectedAct.currency)} · ${selectedAct.priority ? priorityConfig[selectedAct.priority]?.label : 'No priority set'}` : ''}
          buttons={[
            {
              text: '🔴 Must Pay — Pre-trip essential',
              icon: alertCircleOutline,
              handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'must-pay' }); setSelectedAct(null); },
            },
            {
              text: '🟠 Book Ahead — Advance booking',
              icon: calendarOutline,
              handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'book-ahead' }); setSelectedAct(null); },
            },
            {
              text: '🔵 Pay There — Pay on arrival',
              icon: walletOutline,
              handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'pay-there' }); setSelectedAct(null); },
            },
            {
              text: '⚪ Optional — Nice to have',
              icon: ellipseOutline,
              handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'optional' }); setSelectedAct(null); },
            },
            {
              text: 'Cancel',
              icon: closeOutline,
              role: 'cancel' as const,
              handler: () => setSelectedAct(null),
            },
          ]}
        />

        {pendingActivities.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--ion-color-medium)', padding: '4px 0 20px' }}>
            Long-press any item to set priority
          </p>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PendingItems;
