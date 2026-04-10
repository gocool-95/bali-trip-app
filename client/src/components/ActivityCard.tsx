import { useRef, useCallback } from 'react';
import { IonIcon } from '@ionic/react';
import {
  timeOutline, locationOutline, carOutline, walkOutline,
  bicycleOutline, boatOutline, airplaneOutline, navigateOutline,
} from 'ionicons/icons';
import PaymentBadge from './PaymentBadge';

import { type LocalActivity } from '../services/db';
import { getTimezoneLabel, isNonDefaultTimezone } from '../services/timezone';

const categoryConfig: Record<string, { color: string; gradient: string; emoji: string }> = {
  sightseeing: { color: '#1B9C5A', gradient: 'linear-gradient(135deg, #1B9C5A, #10B981)', emoji: '🏛️' },
  food:        { color: '#F06543', gradient: 'linear-gradient(135deg, #F06543, #F59E0B)', emoji: '🍽️' },
  transport:   { color: '#64748B', gradient: 'linear-gradient(135deg, #64748B, #94A3B8)', emoji: '🚗' },
  adventure:   { color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #F06543)', emoji: '🏄' },
  relaxation:  { color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #A855F7)', emoji: '🧘' },
  shopping:    { color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', emoji: '🛍️' },
};

function getTransportIcon(transport: string) {
  const t = transport.toLowerCase();
  if (t.includes('walk')) return walkOutline;
  if (t.includes('scooter') || t.includes('bicycle')) return bicycleOutline;
  if (t.includes('boat') || t.includes('speed')) return boatOutline;
  if (t.includes('flight') || t.includes('air')) return airplaneOutline;
  return carOutline;
}

interface ActivityCardProps {
  activity: LocalActivity;
  onClick?: () => void;
  onLongPress?: () => void;
  highlight?: boolean;
}

const LONG_PRESS_MS = 500;

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onClick, onLongPress, highlight }) => {
  const cat = categoryConfig[activity.category] || categoryConfig.sightseeing;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const handleNav = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    let url = activity.googleMapsUrl;
    if (!url && activity.latitude && activity.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`;
    }
    if (url) window.open(url, '_system');
  };

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      if (onLongPress) {
        // Haptic feedback via vibration if available
        if (navigator.vibrate) navigator.vibrate(30);
        onLongPress();
      }
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    clearTimer();
    if (longPressedRef.current) {
      e.preventDefault(); // Don't fire click after long press
      return;
    }
  }, [clearTimer]);

  const handleClick = useCallback(() => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    onClick?.();
  }, [onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Prevent browser context menu, trigger long press instead
    e.preventDefault();
    onLongPress?.();
  }, [onLongPress]);

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={clearTimer}
      onContextMenu={handleContextMenu}
      style={{
        background: 'var(--ion-card-background, white)',
        borderRadius: '16px',
        margin: '10px 0',
        boxShadow: highlight
          ? `0 0 0 2px ${cat.color}, 0 8px 24px rgba(0,0,0,0.12)`
          : '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        position: 'relative',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Category color strip */}
      <div style={{ height: '4px', background: cat.gradient }} />

      <div style={{ padding: '14px 16px 12px' }}>
        {/* Top row: emoji+title and payment badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.2px', lineHeight: 1.3,
            }}>
              <span style={{ marginRight: '6px' }}>{cat.emoji}</span>
              {activity.title}
            </div>
          </div>
          <PaymentBadge
            status={activity.paymentStatus}
            amount={activity.amount}
            currency={activity.currency}
          />
        </div>

        {/* Meta row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '10px',
          fontSize: '0.82rem',
          color: 'var(--ion-color-medium)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IonIcon icon={timeOutline} style={{ fontSize: '14px', color: cat.color }} />
            <strong style={{ color: 'var(--ion-text-color)' }}>{activity.time}</strong>
            {activity.endTime && <span> – {activity.endTime}</span>}
            {isNonDefaultTimezone(activity.timezone) && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, background: '#F5920B18', color: '#D97706',
                padding: '1px 6px', borderRadius: '6px', marginLeft: '2px',
              }}>
                {getTimezoneLabel(activity.timezone)}
              </span>
            )}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IonIcon icon={locationOutline} style={{ fontSize: '14px', color: cat.color }} />
            <span style={{
              maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {activity.location}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IonIcon icon={getTransportIcon(activity.transport)} style={{ fontSize: '14px' }} />
            {activity.transport}
          </span>
        </div>

        {/* Notes */}
        {activity.notes && (
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--ion-color-medium)',
            margin: '8px 0 0',
            lineHeight: 1.4,
            fontStyle: 'italic',
          }}>
            {activity.notes}
          </p>
        )}

        {/* Navigate button */}
        {(activity.googleMapsUrl || activity.latitude) && (
          <button
            onClick={handleNav}
            onTouchEnd={(e) => { e.stopPropagation(); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '10px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: `${cat.color}15`,
              color: cat.color,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            <IonIcon icon={navigateOutline} style={{ fontSize: '14px' }} />
            Navigate
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
