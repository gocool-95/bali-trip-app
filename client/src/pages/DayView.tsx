import {
  IonContent, IonPage,
  IonRefresher, IonRefresherContent, IonSpinner, IonFab, IonFabButton, IonIcon,
  useIonViewWillEnter,
} from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import ActivityCard from '../components/ActivityCard';

const dayConfig = [
  { title: 'Pre-Trip',            emoji: '🧳',  gradient: 'linear-gradient(135deg, #1E293B, #475569)' },
  { title: 'Arrival Day',         emoji: '✈️',  gradient: 'linear-gradient(135deg, #F06543, #F59E0B)' },
  { title: 'Nusa Penida',         emoji: '🏝️', gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)' },
  { title: 'Gili Trawangan',      emoji: '⛵',  gradient: 'linear-gradient(135deg, #0284C7, #0891B2)' },
  { title: 'Gili Trawangan',      emoji: '🤿',  gradient: 'linear-gradient(135deg, #1B9C5A, #10B981)' },
  { title: 'Ubud & Lovina',       emoji: '🌋',  gradient: 'linear-gradient(135deg, #92400E, #D97706)' },
  { title: 'Lovina',              emoji: '🐬',  gradient: 'linear-gradient(135deg, #059669, #0891B2)' },
  { title: 'Mt Batur & ATV',      emoji: '🌄',  gradient: 'linear-gradient(135deg, #DC2626, #F06543)' },
  { title: 'Canggu',              emoji: '🏖️', gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)' },
  { title: 'Uluwatu & Beaches',   emoji: '🏄',  gradient: 'linear-gradient(135deg, #7C3AED, #A855F7)' },
  { title: 'Departure',           emoji: '👋',  gradient: 'linear-gradient(135deg, #64748B, #94A3B8)' },
];

const DayView: React.FC = () => {
  const { dayNumber } = useParams<{ dayNumber: string }>();
  const dayNum = parseInt(dayNumber, 10);
  const history = useHistory();
  const { activities, loading, sync, saveActivity, refresh } = useActivities(dayNum);
  const config = dayConfig[dayNum] || dayConfig[1];

  // Reload data when page becomes visible (Ionic keeps pages mounted)
  useIonViewWillEnter(() => { refresh(); });

  const baseDate = new Date('2026-02-27');
  baseDate.setDate(baseDate.getDate() + dayNum - 1);
  const dateStr = baseDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const handleRefresh = async (event: CustomEvent) => {
    await sync();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Day Hero Header */}
        <div style={{
          background: config.gradient,
          padding: '28px 20px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-20px', width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              borderRadius: '20px', padding: '4px 14px', fontSize: '0.75rem', fontWeight: 700,
              color: 'white', letterSpacing: '1px', marginBottom: '8px',
            }}>
              DAY {dayNum} OF 10
            </div>
            <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', letterSpacing: '-0.5px' }}>
              {config.emoji} {config.title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '0.85rem' }}>
              {dateStr} · {activities.length} activities
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ion-color-medium)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌴</div>
            <h3 style={{ fontWeight: 700 }}>No activities yet</h3>
            <p>Tap + to add your first one!</p>
          </div>
        ) : (
          <div style={{ padding: '12px 16px 20px' }}>
            {activities.map((activity, idx) => (
              <div key={activity._id} style={{ display: 'flex', gap: '12px' }}>
                {/* Timeline connector */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', flexShrink: 0,
                  paddingTop: '18px',
                }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: config.gradient, boxShadow: `0 0 0 3px var(--ion-background-color, #F1F5F0)`,
                    flexShrink: 0,
                  }} />
                  {idx < activities.length - 1 && (
                    <div style={{
                      width: '2px', flex: 1, background: 'var(--ion-color-medium)',
                      opacity: 0.2, marginTop: '4px',
                    }} />
                  )}
                </div>

                {/* Card */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActivityCard
                    activity={activity}
                    onClick={() => history.push(`/activity/${activity._id}`)}
                    onLongPress={() => history.push(`/activity/${activity._id}?edit=true`)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
          <IonFabButton color="secondary" onClick={() => history.push(`/activity/new?day=${dayNum}`)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default DayView;
