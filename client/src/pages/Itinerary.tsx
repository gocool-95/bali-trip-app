import { useState } from 'react';
import {
  IonContent, IonPage, IonRefresher, IonRefresherContent,
  IonFab, IonFabButton, IonIcon, IonSpinner,
  useIonViewWillEnter,
} from '@ionic/react';
import { addOutline, searchOutline, closeCircleOutline, timeOutline, locationOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useActivities, useDaySummaries } from '../hooks/useActivities';
import { formatCurrency, formatINR, totalToINR } from '../components/PaymentBadge';
import PaymentBadge from '../components/PaymentBadge';
import './Itinerary.css';

const phaseColors = [
  'linear-gradient(135deg, #1E293B, #475569)', // Day 0 - Pre-Trip
  'linear-gradient(135deg, #F06543, #F59E0B)', // Day 1 - Arrival
  'linear-gradient(135deg, #0891B2, #06B6D4)', // Day 2 - Nusa Penida
  'linear-gradient(135deg, #0284C7, #0891B2)', // Day 3 - Gili T
  'linear-gradient(135deg, #1B9C5A, #10B981)', // Day 4 - Gili T
  'linear-gradient(135deg, #92400E, #D97706)', // Day 5 - Ubud & Lovina
  'linear-gradient(135deg, #059669, #0891B2)', // Day 6 - Lovina
  'linear-gradient(135deg, #DC2626, #F06543)', // Day 7 - Mt Batur
  'linear-gradient(135deg, #0891B2, #06B6D4)', // Day 8 - Canggu
  'linear-gradient(135deg, #7C3AED, #A855F7)', // Day 9 - Uluwatu
  'linear-gradient(135deg, #64748B, #94A3B8)', // Day 10 - Departure
];

const phaseSolid = [
  '#475569', '#F06543', '#0891B2', '#0284C7', '#1B9C5A', '#D97706',
  '#059669', '#DC2626', '#0891B2', '#7C3AED', '#64748B',
];

const dayEmojis = ['🧳', '✈️', '🏝️', '⛵', '🤿', '🌋', '🐬', '🌄', '🏖️', '🏄', '👋'];

const dayTitles = [
  'Pre-Trip', 'Arrival Day', 'Nusa Penida', 'Gili Trawangan',
  'Gili Trawangan', 'Ubud & Lovina', 'Lovina',
  'Mt Batur & ATV', 'Canggu', 'Uluwatu & Beaches', 'Departure',
];

const Itinerary: React.FC = () => {
  const history = useHistory();
  const { daySummaries, loading, syncing, sync, refresh } = useDaySummaries();
  const { activities } = useActivities();
  const [searchQuery, setSearchQuery] = useState('');

  // Reload data when page becomes visible (Ionic keeps pages mounted)
  useIonViewWillEnter(() => { refresh(); });

  const handleRefresh = async (event: CustomEvent) => {
    await sync();
    event.detail.complete();
  };

  const searchResults = searchQuery.trim().length >= 2
    ? activities.filter(a => {
        const q = searchQuery.toLowerCase();
        return a.title.toLowerCase().includes(q)
          || a.location.toLowerCase().includes(q)
          || (a.notes || '').toLowerCase().includes(q)
          || a.category.toLowerCase().includes(q);
      })
    : [];

  return (
    <IonPage>
      <IonContent fullscreen className="dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Section Header */}
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Your 10-Day Itinerary</span>
          {syncing && <IonSpinner name="dots" style={{ width: '16px', height: '16px' }} />}
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--ion-card-background, #1E293B)', borderRadius: '14px',
            padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <IonIcon icon={searchOutline} style={{ fontSize: '18px', color: 'var(--ion-color-medium)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search activities, places, restaurants..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: '0.88rem', fontFamily: 'inherit', color: 'var(--ion-text-color)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              >
                <IonIcon icon={closeCircleOutline} style={{ fontSize: '18px', color: 'var(--ion-color-medium)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.trim().length >= 2 && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ion-color-medium)', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </div>
            {searchResults.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '24px', color: 'var(--ion-color-medium)',
                background: 'var(--ion-card-background, #1E293B)', borderRadius: '14px',
              }}>
                No activities found for "{searchQuery}"
              </div>
            ) : searchResults.map(act => (
              <div
                key={act._id}
                onClick={() => history.push(`/activity/${act._id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', marginBottom: '6px', borderRadius: '14px',
                  background: 'var(--ion-card-background, #1E293B)',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer',
                  borderLeft: `3px solid ${phaseSolid[act.dayNumber] || '#64748B'}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{act.title}</div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginTop: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <IonIcon icon={timeOutline} style={{ fontSize: '12px' }} />
                      Day {act.dayNumber} · {act.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <IonIcon icon={locationOutline} style={{ fontSize: '12px' }} />
                      {act.location}
                    </span>
                  </div>
                </div>
                <PaymentBadge status={act.paymentStatus} amount={act.amount} currency={act.currency} />
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : (
          <div style={{ padding: '0 4px 20px' }}>
            {daySummaries.map((day, idx) => (
              <div
                key={day.dayNumber}
                className="day-card"
                onClick={() => history.push(`/day/${day.dayNumber}`)}
                style={{ cursor: 'pointer', margin: '10px 12px', padding: '0', background: 'var(--ion-card-background, white)', borderRadius: '20px', boxShadow: 'var(--bali-card-shadow)', position: 'relative', overflow: 'hidden' }}
              >
                {/* Top gradient bar */}
                <div className="day-card-gradient" style={{ background: phaseColors[day.dayNumber] || phaseColors[0], height: '5px' }} />

                <div style={{ padding: '16px 18px 14px' }}>
                  {/* Header row */}
                  <div className="day-card-header">
                    <span className="day-number-badge" style={{ background: phaseSolid[day.dayNumber] || phaseSolid[0] }}>
                      {day.dayNumber === 0 ? 'PRE-TRIP' : `DAY ${day.dayNumber}`}
                    </span>
                    <span className="day-date">{day.date}</span>
                  </div>

                  {/* Title */}
                  <div className="day-title">
                    <span className="day-emoji">{dayEmojis[day.dayNumber]}</span>
                    {day.title}
                  </div>

                  {/* Footer */}
                  <div className="day-footer">
                    <span className="day-activity-count">
                      {day.activityCount} activities
                    </span>
                    <span className="day-spend" style={{ textAlign: 'right' }}>
                      {day.totalIDR > 0 || day.totalUSD > 0 ? (
                        <>
                          <span>
                            {day.totalIDR > 0 ? formatCurrency(day.totalIDR, 'IDR') : ''}
                            {day.totalIDR > 0 && day.totalUSD > 0 ? ' + ' : ''}
                            {day.totalUSD > 0 ? formatCurrency(day.totalUSD, 'USD') : ''}
                          </span>
                          <br />
                          <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                            ≈ {formatINR(totalToINR(day.totalIDR, day.totalUSD))}
                          </span>
                        </>
                      ) : 'Free day!'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
          <IonFabButton color="secondary" onClick={() => history.push('/activity/new')}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Itinerary;
