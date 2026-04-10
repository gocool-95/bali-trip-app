import { useState, useEffect, useCallback, useRef } from 'react';
import { type LocalActivity } from '../services/db';
import { getAllLocalActivities, ensureLocalData } from '../services/sync';
import { activityToUTC, activityEndToUTC } from '../services/timezone';

export interface WhatsNowResult {
  current: LocalActivity | null;
  next: LocalActivity | null;
  minutesUntilNext: number | null;
  todayActivities: LocalActivity[];
  isOnTrip: boolean;
  refresh: () => Promise<void>;
}

function getTripDate(): { dayNumber: number; dateStr: string } | null {
  // Day 1 starts in IST (departure from India), so use the earlier timezone
  const tripStart = new Date('2026-02-27T00:00:00+05:30'); // IST — Day 1 starts in India
  const tripEnd = new Date('2026-03-08T23:59:59+08:00');   // WITA — Day 10 ends in Bali
  const now = new Date();

  if (now < tripStart || now > tripEnd) return null;

  const diffMs = now.getTime() - tripStart.getTime();
  const dayNumber = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;

  return { dayNumber: Math.min(dayNumber, 10), dateStr: '' };
}

export function useWhatsNow(): WhatsNowResult {
  const [state, setState] = useState<Omit<WhatsNowResult, 'refresh'>>({
    current: null,
    next: null,
    minutesUntilNext: null,
    todayActivities: [],
    isOnTrip: false,
  });

  const update = useCallback(async () => {
    await ensureLocalData();
    const all = await getAllLocalActivities();
    const tripDay = getTripDate();

    if (!tripDay) {
      // Not on trip — show day 0 (pre-trip) if any, otherwise day 1 for preview
      const day0 = all.filter(a => Number(a.dayNumber) === 0);
      const day1 = all.filter(a => Number(a.dayNumber) === 1);
      const preview = day0.length > 0 ? day0 : day1;
      setState({
        current: null,
        next: preview[0] || null,
        minutesUntilNext: null,
        todayActivities: preview,
        isOnTrip: false,
      });
      return;
    }

    const todayActivities = all.filter(a => a.dayNumber === tripDay.dayNumber);
    const now = new Date();
    let current: LocalActivity | null = null;
    let next: LocalActivity | null = null;

    for (let i = 0; i < todayActivities.length; i++) {
      const act = todayActivities[i];
      const startUTC = activityToUTC(act);
      const endUTC = activityEndToUTC(act);

      if (now >= startUTC && now <= endUTC) {
        current = act;
        next = todayActivities[i + 1] || null;
        break;
      } else if (now < startUTC) {
        next = act;
        break;
      } else {
        current = act;
      }
    }

    let minutesUntilNext: number | null = null;
    if (next) {
      const nextStartUTC = activityToUTC(next);
      minutesUntilNext = Math.round((nextStartUTC.getTime() - now.getTime()) / 60000);
    }

    setState({ current, next, minutesUntilNext, todayActivities, isOnTrip: true });
  }, []);

  useEffect(() => {
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [update]);

  return { ...state, refresh: update };
}
