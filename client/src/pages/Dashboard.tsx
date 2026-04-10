import { useState } from 'react';
import {
  IonContent, IonPage, IonRefresher, IonRefresherContent,
  IonIcon, IonSpinner, useIonViewWillEnter,
} from '@ionic/react';
import {
  timeOutline, locationOutline, navigateOutline,
  arrowForwardOutline, swapHorizontalOutline, calendarOutline,
  refreshOutline,
  documentTextOutline, arrowForward, checkboxOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { useWhatsNow } from '../hooks/useWhatsNow';
import { formatCurrency, formatINR, totalToINR } from '../components/PaymentBadge';
import PaymentBadge from '../components/PaymentBadge';
import { getTimezoneLabel, isNonDefaultTimezone } from '../services/timezone';
import WeatherCard from '../components/WeatherCard';
import './Dashboard.css';

const IDR_TO_INR_RATE = 0.0053; // ~1 IDR = 0.0053 INR (approx)
const USD_TO_INR_RATE = 87.0;

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { activities, syncing, sync, saveActivity, refresh } = useActivities();
  const { current, next, minutesUntilNext, todayActivities, isOnTrip, refresh: refreshWhatsNow } = useWhatsNow();

  // Reload data when page becomes visible (Ionic keeps pages mounted)
  useIonViewWillEnter(() => { refresh(); refreshWhatsNow(); });

  const [idrInput, setIdrInput] = useState('');
  const [convDirection, setConvDirection] = useState<'idr-inr' | 'inr-idr'>('idr-inr');

  const handleRefresh = async (event: CustomEvent) => {
    await sync();
    event.detail.complete();
  };

  const daysUntilTrip = Math.ceil(
    (new Date('2026-02-27').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Trip stats
  let totalIDR = 0, totalUSD = 0, paidCount = 0, pendingCount = 0;
  for (const act of activities) {
    if (act.amount && act.paymentStatus !== 'free') {
      if (act.currency === 'USD') totalUSD += act.amount;
      else totalIDR += act.amount;
      if (act.paymentStatus === 'paid') paidCount++;
      else pendingCount++;
    }
  }

  const converted = (() => {
    const val = parseFloat(idrInput) || 0;
    if (convDirection === 'idr-inr') return (val * IDR_TO_INR_RATE).toFixed(2);
    return Math.round(val / IDR_TO_INR_RATE).toLocaleString();
  })();

  const handleNavigate = (act: { googleMapsUrl?: string; latitude?: number; longitude?: number }) => {
    let url = act.googleMapsUrl;
    if (!url && act.latitude && act.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${act.latitude},${act.longitude}`;
    }
    if (url) window.open(url, '_system');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Hero Header */}
        <div className="dashboard-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
            <img
              src="/logo.png"
              alt="Keego"
              style={{
                width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            />
            <div style={{ flex: 1 }}>
              <h1 className="hero-title" style={{ fontSize: '1.4rem' }}>Keego's Bali Trip 🌴</h1>
              <p className="hero-subtitle">
                {syncing ? 'Syncing...' : (
                  daysUntilTrip > 0
                    ? `${daysUntilTrip} days to go!`
                    : daysUntilTrip === 0
                    ? 'Trip starts today!'
                    : 'Feb 27 – Mar 8, 2026'
                )}
              </p>
            </div>
            <button
              onClick={() => sync()}
              disabled={syncing}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: syncing ? 'default' : 'pointer', flexShrink: 0,
                transition: 'transform 0.3s',
                animation: syncing ? 'spin 1s linear infinite' : 'none',
              }}
            >
              <IonIcon icon={refreshOutline} style={{ fontSize: '20px' }} />
            </button>
          </div>
          <div className="hero-date-badge">
            <IonIcon icon={calendarOutline} />
            10 days · {activities.length} activities · {paidCount + pendingCount} payments
          </div>
        </div>

        {/* Current Activity */}
        {current && (
          <div style={{ padding: '0 16px' }}>
            <div className="section-header" style={{ padding: '16px 0 8px' }}>
              {isOnTrip ? '🔴 HAPPENING NOW' : '👀 PREVIEW'}
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #1B9C5A, #0891B2)',
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(27, 156, 90, 0.3)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%',
              }} />
              <div
                style={{ padding: '20px', position: 'relative', zIndex: 1, cursor: 'pointer' }}
                onClick={() => history.push(`/activity/${current._id}`)}
              >
                <h3 style={{ color: 'white', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.2px' }}>
                  {current.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                    <IonIcon icon={timeOutline} style={{ color: 'white' }} />
                    {current.time}{current.endTime ? ` – ${current.endTime}` : ''}
                    {isNonDefaultTimezone(current.timezone) && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: '8px' }}>
                        {getTimezoneLabel(current.timezone)}
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                    <IonIcon icon={locationOutline} style={{ color: 'white' }} />
                    {current.location}
                  </span>
                </div>
                {current.notes && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', margin: '10px 0 0', fontStyle: 'italic' }}>
                    {current.notes}
                  </p>
                )}
                {(current.googleMapsUrl || current.latitude) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNavigate(current); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px',
                      padding: '8px 18px', borderRadius: '24px', border: 'none',
                      background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                      color: 'white', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <IonIcon icon={navigateOutline} /> Navigate
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Activity */}
        {next && (
          <div style={{ padding: '0 16px' }}>
            <div className="section-header" style={{ padding: '16px 0 8px' }}>
              ⏭️ COMING UP NEXT
            </div>
            <div
              onClick={() => history.push(`/activity/${next._id}`)}
              style={{
                background: 'var(--ion-card-background, white)', borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '16px',
                borderLeft: '4px solid #F06543', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 8px', letterSpacing: '-0.2px' }}>
                    {next.title}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IonIcon icon={timeOutline} style={{ fontSize: '14px', color: '#F06543' }} />
                      {next.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IonIcon icon={locationOutline} style={{ fontSize: '14px', color: '#F06543' }} />
                      {next.location}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  {minutesUntilNext !== null && minutesUntilNext > 0 && (
                    <span style={{
                      background: '#F0654318', color: '#F06543', padding: '3px 10px', borderRadius: '20px',
                      fontSize: '0.72rem', fontWeight: 600, border: '1px solid #F0654330',
                    }}>
                      in {minutesUntilNext < 60 ? `${minutesUntilNext}m` : `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m`}
                    </span>
                  )}
                  <PaymentBadge status={next.paymentStatus} amount={next.amount} currency={next.currency} />
                </div>
              </div>
              {(next.googleMapsUrl || next.latitude) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleNavigate(next); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                    padding: '6px 14px', borderRadius: '20px', border: 'none',
                    background: '#F0654315', color: '#F06543', fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <IonIcon icon={navigateOutline} style={{ fontSize: '14px' }} /> Navigate
                </button>
              )}
            </div>
          </div>
        )}

        {!current && !next && (
          <div style={{ padding: '0 16px' }}>
            <div className="section-header" style={{ padding: '16px 0 8px' }}>TRIP STATUS</div>
            <div style={{
              background: 'var(--ion-card-background, white)', borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🌴</div>
              <h3 style={{ fontWeight: 700, margin: '0 0 4px' }}>
                {daysUntilTrip > 0 ? 'Trip hasn\'t started yet!' : 'Free time!'}
              </h3>
              <p style={{ color: 'var(--ion-color-medium)', margin: 0, fontSize: '0.88rem' }}>
                {daysUntilTrip > 0
                  ? `${daysUntilTrip} days until your Bali adventure begins`
                  : 'No activities scheduled right now. Enjoy!'}
              </p>
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        {todayActivities.length > 0 && (
          <div style={{ padding: '0 16px' }}>
            <div className="section-header" style={{ padding: '16px 0 8px' }}>
              📋 TODAY'S SCHEDULE
            </div>
            {todayActivities.map(act => {
              const isCurrent = current && act._id === current._id;
              return (
                <div
                  key={act._id}
                  onClick={() => history.push(`/activity/${act._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', marginBottom: '6px', cursor: 'pointer',
                    background: isCurrent ? 'linear-gradient(135deg, #1B9C5A10, #0891B210)' : 'var(--ion-card-background, white)',
                    borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                    borderLeft: isCurrent ? '4px solid #1B9C5A' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.85rem', color: isCurrent ? '#1B9C5A' : 'var(--ion-text-color)' }}>
                        {act.time}
                        {isNonDefaultTimezone(act.timezone) && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#D97706', marginLeft: '3px' }}>
                            {getTimezoneLabel(act.timezone)}
                          </span>
                        )}
                      </strong>
                      <span style={{
                        fontSize: '0.88rem', fontWeight: 500,
                      }}>{act.title}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <PaymentBadge status={act.paymentStatus} amount={act.amount} currency={act.currency} />
                    <IonIcon icon={arrowForwardOutline} style={{ color: 'var(--ion-color-medium)', fontSize: '14px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Weather */}
        <WeatherCard />

        {/* Travel Docs Quick Access */}
        <div style={{ padding: '0 16px' }}>
          <div
            onClick={() => history.push('/travel-docs')}
            style={{
              background: 'linear-gradient(135deg, #1E293B, #334155)', borderRadius: '16px',
              padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: '16px',
            }}
          >
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <IonIcon icon={documentTextOutline} style={{ fontSize: '22px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Travel Documents</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', marginTop: '2px' }}>
                Passport, insurance, emergency contacts
              </div>
            </div>
            <IonIcon icon={arrowForward} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px' }} />
          </div>
        </div>

        {/* Packing Checklist Quick Access */}
        <div style={{ padding: '0 16px' }}>
          <div
            onClick={() => history.push('/packing-list')}
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)', borderRadius: '16px',
              padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: '0 4px 16px rgba(124,58,237,0.2)', marginTop: '10px',
            }}
          >
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <IonIcon icon={checkboxOutline} style={{ fontSize: '22px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Packing Checklist</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', marginTop: '2px' }}>
                Don't forget anything!
              </div>
            </div>
            <IonIcon icon={arrowForward} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px' }} />
          </div>
        </div>

        {/* IDR to INR Converter */}
        <div style={{ padding: '0 16px' }}>
          <div className="section-header" style={{ padding: '16px 0 8px' }}>
            💱 CURRENCY CONVERTER
          </div>
          <div style={{
            background: 'var(--ion-card-background, white)', borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '16px', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Input */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px',
                  color: 'var(--ion-color-medium)', marginBottom: '4px', textTransform: 'uppercase',
                }}>
                  {convDirection === 'idr-inr' ? 'IDR (Rupiah)' : 'INR (Rupee)'}
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={idrInput}
                  onChange={(e) => setIdrInput(e.target.value)}
                  placeholder={convDirection === 'idr-inr' ? '100000' : '500'}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '12px',
                    border: '2px solid var(--ion-color-medium-tint, #ddd)',
                    fontSize: '1.1rem', fontWeight: 700, fontFamily: 'inherit',
                    background: 'var(--ion-background-color, #F1F5F0)',
                    color: 'var(--ion-text-color)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1B9C5A'; }}
                  onBlur={(e) => { e.target.style.borderColor = ''; }}
                />
              </div>

              {/* Swap button */}
              <button
                onClick={() => { setConvDirection(d => d === 'idr-inr' ? 'inr-idr' : 'idr-inr'); setIdrInput(''); }}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1B9C5A, #10B981)',
                  border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, marginTop: '16px',
                  boxShadow: '0 2px 8px rgba(27,156,90,0.3)',
                }}
              >
                <IonIcon icon={swapHorizontalOutline} style={{ fontSize: '18px' }} />
              </button>

              {/* Output */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px',
                  color: 'var(--ion-color-medium)', marginBottom: '4px', textTransform: 'uppercase',
                }}>
                  {convDirection === 'idr-inr' ? 'INR (Rupee)' : 'IDR (Rupiah)'}
                </div>
                <div style={{
                  padding: '10px 12px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1B9C5A10, #0891B210)',
                  border: '2px solid #1B9C5A30',
                  fontSize: '1.1rem', fontWeight: 700,
                  color: '#1B9C5A',
                  minHeight: '24px',
                }}>
                  {idrInput ? (convDirection === 'idr-inr' ? `₹${converted}` : `Rp ${converted}`) : '—'}
                </div>
              </div>
            </div>

            <p style={{
              margin: '10px 0 0', fontSize: '0.72rem', color: 'var(--ion-color-medium)',
              textAlign: 'center',
            }}>
              {convDirection === 'idr-inr'
                ? `1 IDR ≈ ₹${IDR_TO_INR_RATE} · 100k IDR ≈ ₹${(100000 * IDR_TO_INR_RATE).toFixed(0)}`
                : `₹1 ≈ ${Math.round(1 / IDR_TO_INR_RATE).toLocaleString()} IDR`}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ padding: '0 16px' }}>
          <div className="section-header" style={{ padding: '16px 0 8px' }}>
            📊 TRIP BUDGET
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1, background: 'linear-gradient(135deg, #1E293B, #334155)', borderRadius: '16px',
              padding: '14px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}>
              <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.5)' }}>TOTAL</p>
              <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 800, color: 'white' }}>{formatCurrency(totalIDR, 'IDR')}</p>
              {totalUSD > 0 && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>+ ${totalUSD}</p>}
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>≈ {formatINR(totalToINR(totalIDR, totalUSD))}</p>
            </div>
            <div
              onClick={() => history.push('/tabs/pending')}
              style={{
                flex: 1, background: 'linear-gradient(135deg, #D97706, #F59E0B)', borderRadius: '16px',
                padding: '14px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', cursor: 'pointer',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>PENDING</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{pendingCount}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>payments left</p>
            </div>
            <div style={{
              flex: 1, background: 'linear-gradient(135deg, #059669, #10B981)', borderRadius: '16px',
              padding: '14px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}>
              <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.7)' }}>PAID</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{paidCount}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>paid</p>
            </div>
          </div>
        </div>

        <div style={{ height: '20px' }} />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
