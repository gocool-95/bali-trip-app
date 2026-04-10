import {
  IonContent, IonPage, IonIcon,
} from '@ionic/react';
import { timeOutline, locationOutline, navigateOutline, arrowForwardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useWhatsNow } from '../hooks/useWhatsNow';
import PaymentBadge from '../components/PaymentBadge';

const WhatsNow: React.FC = () => {
  const { current, next, minutesUntilNext, todayActivities, isOnTrip } = useWhatsNow();
  const history = useHistory();

  const handleNav = (act: { googleMapsUrl?: string; latitude?: number; longitude?: number }) => {
    let url = act.googleMapsUrl;
    if (!url && act.latitude && act.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${act.latitude},${act.longitude}`;
    }
    if (url) window.open(url, '_system');
  };

  return (
    <IonPage>
      <IonContent>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #F06543 0%, #F59E0B 100%)',
          padding: '28px 20px 28px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', borderRadius: '50%',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {!isOnTrip && (
              <div style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                borderRadius: '20px', padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700,
                color: 'white', letterSpacing: '0.5px', marginBottom: '8px',
              }}>
                PREVIEW MODE
              </div>
            )}
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, margin: '0', letterSpacing: '-0.5px' }}>
              ⏱️ What's Now
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '0.85rem' }}>
              {isOnTrip ? 'Your live trip companion' : 'Trip starts Feb 27 — showing Day 1 preview'}
            </p>
          </div>
        </div>

        {/* Current Activity */}
        {current && (
          <div style={{
            background: 'linear-gradient(135deg, #1B9C5A, #0891B2)',
            margin: '16px', borderRadius: '20px', overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(27, 156, 90, 0.3)',
          }}>
            <div style={{
              position: 'relative', padding: '22px 20px',
            }}>
              <div style={{
                position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', borderRadius: '50%',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {isOnTrip ? '🔴 Happening Now' : '🌟 First Activity'}
                </p>
                <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 700, margin: '8px 0 12px', letterSpacing: '-0.3px' }}>
                  {current.title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '0.88rem' }}>
                    <IonIcon icon={timeOutline} style={{ color: 'white', fontSize: '16px' }} />
                    {current.time}{current.endTime ? ` – ${current.endTime}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.9)', fontSize: '0.88rem' }}>
                    <IonIcon icon={locationOutline} style={{ color: 'white', fontSize: '16px' }} />
                    {current.location}
                  </span>
                </div>
                {current.notes && (
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', margin: '10px 0 0', fontStyle: 'italic' }}>
                    {current.notes}
                  </p>
                )}
                {(current.googleMapsUrl || current.latitude) && (
                  <button onClick={() => handleNav(current)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '14px',
                    padding: '8px 18px', borderRadius: '24px', border: 'none',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                    color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <IonIcon icon={navigateOutline} /> Navigate
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Activity */}
        {next && (
          <div style={{
            margin: '0 16px 16px', padding: '18px 18px',
            background: 'var(--ion-card-background, white)', borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #F06543',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, color: '#F06543' }}>
                Coming Up Next
              </span>
              {minutesUntilNext !== null && minutesUntilNext > 0 && (
                <span style={{
                  background: '#F0654318', color: '#F06543', padding: '3px 10px', borderRadius: '20px',
                  fontSize: '0.72rem', fontWeight: 600, border: '1px solid #F0654330',
                }}>
                  in {minutesUntilNext < 60 ? `${minutesUntilNext}m` : `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m`}
                </span>
              )}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '4px 0 8px', letterSpacing: '-0.2px' }}>{next.title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IonIcon icon={timeOutline} style={{ fontSize: '14px' }} /> {next.time}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IonIcon icon={locationOutline} style={{ fontSize: '14px' }} /> {next.location}
              </span>
            </div>
            {(next.googleMapsUrl || next.latitude) && (
              <button onClick={() => handleNav(next)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px',
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                background: '#F0654315', color: '#F06543', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <IonIcon icon={navigateOutline} style={{ fontSize: '14px' }} /> Navigate
              </button>
            )}
          </div>
        )}

        {/* Today's Schedule */}
        {todayActivities.length > 0 && (
          <div style={{ padding: '0 16px 20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ion-color-medium)', padding: '8px 0 10px' }}>
              Today's Schedule
            </div>
            {todayActivities.map(act => {
              const isCurrent = current && act._id === current._id;
              return (
                <div
                  key={act._id}
                  onClick={() => history.push(`/activity/${act._id}`)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', marginBottom: '6px', cursor: 'pointer',
                    background: isCurrent ? 'linear-gradient(135deg, #1B9C5A10, #0891B210)' : 'var(--ion-card-background, white)',
                    borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                    borderLeft: isCurrent ? '4px solid #1B9C5A' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.85rem', color: isCurrent ? '#1B9C5A' : 'var(--ion-text-color)' }}>{act.time}</strong>
                      <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{act.title}</span>
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

        {!current && !next && todayActivities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ion-color-medium)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌴</div>
            <h2 style={{ fontWeight: 700 }}>No activities right now</h2>
            <p>Enjoy some free time!</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default WhatsNow;
