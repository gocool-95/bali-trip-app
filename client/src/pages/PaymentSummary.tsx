import { useState, useRef, useCallback } from 'react';
import {
  IonContent, IonPage, IonSpinner, IonActionSheet, IonAlert, IonIcon,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  arrowUndoOutline, createOutline, documentAttachOutline, closeOutline,
  checkmarkCircleOutline, imageOutline, banOutline, flagOutline,
} from 'ionicons/icons';
import { useActivities } from '../hooks/useActivities';
import { formatCurrency, formatINR, totalToINR, toINR } from '../components/PaymentBadge';
import { uploadTicket } from '../services/api';
import type { LocalActivity } from '../services/db';
import { priorityConfig } from './PendingItems';

const dayTitles = [
  'Pre-Trip', 'Arrival Day', 'Nusa Penida', 'Gili Trawangan',
  'Gili Trawangan', 'Ubud & Lovina', 'Lovina',
  'Mt Batur & ATV', 'Canggu', 'Uluwatu & Beaches', 'Departure',
];

const dayEmojis = ['🧳', '✈️', '🏝️', '⛵', '🤿', '🌋', '🐬', '🌄', '🏖️', '🏄', '👋'];

const LONG_PRESS_MS = 500;

const PaymentSummary: React.FC = () => {
  const { activities, loading, saveActivity, refresh } = useActivities();
  const [selectedAct, setSelectedAct] = useState<LocalActivity | null>(null);

  // Reload data when page becomes visible (Ionic keeps pages mounted)
  useIonViewWillEnter(() => { refresh(); });
  const [showActions, setShowActions] = useState(false);
  const [showAmountEdit, setShowAmountEdit] = useState(false);
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [showPrioritySheet, setShowPrioritySheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Long-press tracking
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleTouchStart = useCallback((act: LocalActivity) => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setSelectedAct(act);
      setShowActions(true);
      // Haptic feedback if available
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

  const markAsPaid = async (act: LocalActivity) => {
    await saveActivity({ ...act, paymentStatus: 'paid' });
  };

  const markAsUnpaid = async () => {
    if (!selectedAct) return;
    await saveActivity({ ...selectedAct, paymentStatus: 'pending' });
    setSelectedAct(null);
  };

  const handleAmountChange = async (newAmount: string) => {
    if (!selectedAct) return;
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt < 0) return;
    await saveActivity({ ...selectedAct, amount: amt });
    setSelectedAct(null);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAct) return;

    // Try server upload first
    if (!selectedAct._id.startsWith('local_')) {
      try {
        const updated = await uploadTicket(selectedAct._id, file);
        await saveActivity({ ...selectedAct, ticketImages: updated.ticketImages });
        setSelectedAct(null);
        return;
      } catch { /* fallback to local */ }
    }

    // Local base64 fallback
    const reader = new FileReader();
    reader.onload = async () => {
      const images = [...(selectedAct.ticketImages || []), reader.result as string];
      await saveActivity({ ...selectedAct, ticketImages: images });
      setSelectedAct(null);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  let totalIDR = 0, totalUSD = 0;
  let paidIDR = 0, paidUSD = 0;
  let pendingIDR = 0, pendingUSD = 0;

  for (const act of activities) {
    if (!act.amount || act.paymentStatus === 'free') continue;
    if (act.currency === 'USD') {
      totalUSD += act.amount;
      if (act.paymentStatus === 'paid') paidUSD += act.amount;
      else pendingUSD += act.amount;
    } else {
      totalIDR += act.amount;
      if (act.paymentStatus === 'paid') paidIDR += act.amount;
      else pendingIDR += act.amount;
    }
  }

  const dayGroups: Record<number, LocalActivity[]> = {};
  for (const act of activities) {
    if (!act.amount || act.paymentStatus === 'free') continue;
    if (!dayGroups[act.dayNumber]) dayGroups[act.dayNumber] = [];
    dayGroups[act.dayNumber].push(act);
  }

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
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={onFileSelected}
        />

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1B9C5A 0%, #10B981 50%, #0891B2 100%)',
          padding: '28px 20px 28px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
              TRIP BUDGET
            </p>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, margin: '0', letterSpacing: '-0.5px' }}>
              💰 Payments
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: '6px 0 0', fontSize: '0.78rem' }}>
              Long-press any item to edit
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: '10px', padding: '16px', overflowX: 'auto' }}>
          {[
            { label: 'TOTAL',   idr: totalIDR,   usd: totalUSD,   gradient: 'linear-gradient(135deg, #1E293B, #334155)', textColor: 'white', labelColor: 'rgba(255,255,255,0.6)' },
            { label: 'PAID',    idr: paidIDR,    usd: paidUSD,    gradient: 'linear-gradient(135deg, #059669, #10B981)', textColor: 'white', labelColor: 'rgba(255,255,255,0.7)' },
            { label: 'PENDING', idr: pendingIDR, usd: pendingUSD, gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', textColor: 'white', labelColor: 'rgba(255,255,255,0.7)' },
          ].map(card => (
            <div key={card.label} style={{
              flex: '1 0 130px', background: card.gradient, borderRadius: '16px', padding: '16px 14px',
              textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}>
              <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', color: card.labelColor }}>{card.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: '1.15rem', fontWeight: 800, color: card.textColor }}>{formatCurrency(card.idr, 'IDR')}</p>
              {card.usd > 0 && <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: card.labelColor }}>+ ${card.usd}</p>}
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: card.labelColor, opacity: 0.8 }}>≈ {formatINR(totalToINR(card.idr, card.usd))}</p>
            </div>
          ))}
        </div>

        {/* Day Breakdowns */}
        {Object.keys(dayGroups).map(Number).sort((a, b) => a - b).map(dayNum => {
          const dayActs = dayGroups[dayNum];
          let dayIDR = 0, dayUSD = 0;
          for (const a of dayActs) { if (a.currency === 'USD') dayUSD += a.amount!; else dayIDR += a.amount!; }

          return (
            <div key={dayNum} style={{ padding: '0 16px', marginBottom: '8px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0 8px',
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {dayEmojis[dayNum]} Day {dayNum} · {dayTitles[dayNum]}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ion-color-primary)', textAlign: 'right' }}>
                  <span>{dayIDR > 0 && formatCurrency(dayIDR, 'IDR')}{dayUSD > 0 && ` + $${dayUSD}`}</span>
                  <br />
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>≈ {formatINR(totalToINR(dayIDR, dayUSD))}</span>
                </span>
              </div>
              {dayActs.map(act => (
                <div
                  key={act._id}
                  onTouchStart={() => handleTouchStart(act)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onContextMenu={(e) => handleContextMenu(e, act)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', marginBottom: '6px',
                    background: 'var(--ion-card-background, white)', borderRadius: '14px',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                    cursor: 'pointer', userSelect: 'none',
                    WebkitUserSelect: 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{act.title}</span>
                      {act.priority && priorityConfig[act.priority] && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          background: priorityConfig[act.priority].bg, color: priorityConfig[act.priority].color,
                          padding: '1px 8px', borderRadius: '10px', fontSize: '0.62rem', fontWeight: 700,
                          border: `1px solid ${priorityConfig[act.priority].color}25`,
                          whiteSpace: 'nowrap',
                        }}>
                          {priorityConfig[act.priority].emoji} {priorityConfig[act.priority].label}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginTop: '3px' }}>
                      <span>{formatCurrency(act.amount!, act.currency)} · {formatINR(toINR(act.amount!, act.currency))}</span>
                      {act.ticketImages && act.ticketImages.length > 0 && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setSelectedAct(act); setShowProofViewer(true); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            background: '#0891B215', color: '#0891B2', padding: '1px 8px', borderRadius: '12px',
                            fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          <IonIcon icon={imageOutline} style={{ fontSize: '12px' }} />
                          {act.ticketImages.length} proof{act.ticketImages.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {act.paymentStatus === 'pending' ? (
                    <button onClick={(e) => { e.stopPropagation(); markAsPaid(act); }} style={{
                      background: 'linear-gradient(135deg, #059669, #10B981)', color: 'white',
                      border: 'none', borderRadius: '20px', padding: '6px 14px', fontSize: '0.75rem',
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}>
                      Mark Paid
                    </button>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: '#10B98118', color: '#059669', padding: '4px 12px', borderRadius: '20px',
                      fontSize: '0.72rem', fontWeight: 600, border: '1px solid #10B98130',
                    }}>
                      <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '13px' }} />
                      Paid
                    </span>
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {Object.keys(dayGroups).length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ion-color-medium)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💸</div>
            <h3 style={{ fontWeight: 700 }}>No payments tracked yet</h3>
            <p>Add amounts to activities to track spending</p>
          </div>
        )}

        {/* Long-press Action Sheet */}
        <IonActionSheet
          isOpen={showActions}
          onDidDismiss={() => setShowActions(false)}
          header={selectedAct?.title || 'Payment Options'}
          subHeader={selectedAct ? `${formatCurrency(selectedAct.amount!, selectedAct.currency)} · ${selectedAct.paymentStatus === 'paid' ? 'Paid' : 'Pending'}` : ''}
          buttons={[
            ...(selectedAct?.paymentStatus === 'paid' ? [{
              text: 'Mark as Unpaid',
              icon: arrowUndoOutline,
              handler: () => markAsUnpaid(),
            }] : [{
              text: 'Mark as Paid',
              icon: checkmarkCircleOutline,
              handler: () => { if (selectedAct) markAsPaid(selectedAct); setSelectedAct(null); },
            }]),
            {
              text: 'Change Amount',
              icon: createOutline,
              handler: () => { setShowActions(false); setTimeout(() => setShowAmountEdit(true), 300); },
            },
            {
              text: 'Add Payment Proof',
              icon: documentAttachOutline,
              handler: () => { setShowActions(false); setTimeout(() => handleFileUpload(), 300); },
            },
            {
              text: `Set Priority${selectedAct?.priority ? ` (${priorityConfig[selectedAct.priority]?.label})` : ''}`,
              icon: flagOutline,
              handler: () => { setShowActions(false); setTimeout(() => setShowPrioritySheet(true), 300); },
            },
            ...(selectedAct?.paymentStatus !== 'free' ? [{
              text: 'No Payment Needed',
              icon: banOutline,
              handler: () => { if (selectedAct) { saveActivity({ ...selectedAct, paymentStatus: 'free' }); setSelectedAct(null); } },
            }] : []),
            ...(selectedAct?.ticketImages && selectedAct.ticketImages.length > 0 ? [{
              text: `View Proofs (${selectedAct.ticketImages.length})`,
              icon: imageOutline,
              handler: () => { setShowActions(false); setTimeout(() => setShowProofViewer(true), 300); },
            }] : []),
            {
              text: 'Cancel',
              icon: closeOutline,
              role: 'cancel' as const,
              handler: () => setSelectedAct(null),
            },
          ]}
        />

        {/* Amount Edit Alert */}
        <IonAlert
          isOpen={showAmountEdit}
          onDidDismiss={() => { setShowAmountEdit(false); setSelectedAct(null); }}
          header="Change Amount"
          subHeader={selectedAct?.title}
          inputs={[
            {
              name: 'amount',
              type: 'number',
              placeholder: 'Enter new amount',
              value: selectedAct?.amount?.toString() || '',
              min: 0,
            },
          ]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Save',
              handler: (data: { amount: string }) => {
                handleAmountChange(data.amount);
                return true;
              },
            },
          ]}
        />

        {/* Priority Action Sheet */}
        <IonActionSheet
          isOpen={showPrioritySheet}
          onDidDismiss={() => { setShowPrioritySheet(false); setSelectedAct(null); }}
          header="Set Priority"
          subHeader={selectedAct?.title}
          buttons={[
            { text: '🔴 Must Pay — Pre-trip essential', handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'must-pay' }); setSelectedAct(null); } },
            { text: '🟠 Book Ahead — Advance booking', handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'book-ahead' }); setSelectedAct(null); } },
            { text: '🔵 Pay There — Pay on arrival', handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'pay-there' }); setSelectedAct(null); } },
            { text: '⚪ Optional — Nice to have', handler: () => { if (selectedAct) saveActivity({ ...selectedAct, priority: 'optional' }); setSelectedAct(null); } },
            { text: 'Cancel', role: 'cancel' as const, handler: () => setSelectedAct(null) },
          ]}
        />

        {/* Payment Proof Viewer Modal */}
        {showProofViewer && selectedAct && (
          <div
            onClick={() => { setShowProofViewer(false); setSelectedAct(null); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '60px 16px 20px', overflowY: 'auto',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => { setShowProofViewer(false); setSelectedAct(null); }}
              style={{
                position: 'fixed', top: '16px', right: '16px', zIndex: 10000,
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: 'white', fontSize: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IonIcon icon={closeOutline} />
            </button>

            <h3 style={{ color: 'white', fontWeight: 700, margin: '0 0 4px', fontSize: '1.1rem' }}>
              {selectedAct.title}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontSize: '0.82rem' }}>
              Payment Proofs ({selectedAct.ticketImages?.length || 0})
            </p>

            {selectedAct.ticketImages?.map((img, i) => (
              <div key={i} onClick={(e) => e.stopPropagation()} style={{ marginBottom: '16px', width: '100%', maxWidth: '500px' }}>
                {img.startsWith('data:application/pdf') ? (
                  <div style={{
                    background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px',
                    textAlign: 'center', color: 'white',
                  }}>
                    <IonIcon icon={documentAttachOutline} style={{ fontSize: '48px', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>PDF Document #{i + 1}</p>
                    <a
                      href={img}
                      download={`payment-proof-${i + 1}.pdf`}
                      style={{
                        display: 'inline-block', marginTop: '10px', padding: '8px 20px',
                        borderRadius: '20px', background: 'rgba(255,255,255,0.2)',
                        color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                      }}
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <img
                    src={img.startsWith('data:') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}`}
                    alt={`Proof ${i + 1}`}
                    style={{
                      width: '100%', borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                  />
                )}
              </div>
            ))}

            <button
              onClick={(e) => { e.stopPropagation(); handleFileUpload(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '24px', border: 'none',
                background: 'linear-gradient(135deg, #1B9C5A, #10B981)', color: 'white',
                fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(27,156,90,0.3)', marginTop: '8px',
              }}
            >
              <IonIcon icon={documentAttachOutline} style={{ fontSize: '18px' }} />
              Add Another Proof
            </button>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PaymentSummary;
