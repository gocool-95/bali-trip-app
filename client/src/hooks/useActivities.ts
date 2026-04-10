import { useState, useEffect, useCallback } from 'react';
import { type LocalActivity } from '../services/db';
import {
  ensureLocalData,
  syncFromServer,
  getAllLocalActivities,
  getLocalDayActivities,
  saveActivityLocally,
  deleteActivityLocally,
} from '../services/sync';

export function useActivities(dayNumber?: number) {
  const [activities, setActivities] = useState<LocalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadActivities = useCallback(async () => {
    await ensureLocalData();
    const data = dayNumber !== undefined
      ? await getLocalDayActivities(dayNumber)
      : await getAllLocalActivities();
    setActivities(data);
    setLoading(false);
  }, [dayNumber]);

  const sync = useCallback(async () => {
    setSyncing(true);
    const success = await syncFromServer();
    if (success) {
      await loadActivities();
    }
    setSyncing(false);
    return success;
  }, [loadActivities]);

  useEffect(() => {
    loadActivities().then(() => {
      // Try background sync after loading local data
      sync();
    });
  }, [loadActivities, sync]);

  const saveActivity = useCallback(async (activity: LocalActivity, isNew = false) => {
    const saved = await saveActivityLocally(activity, isNew);
    await loadActivities();
    return saved;
  }, [loadActivities]);

  const removeActivity = useCallback(async (id: string) => {
    await deleteActivityLocally(id);
    await loadActivities();
  }, [loadActivities]);

  // Silent refresh (no loading spinner) — for use when page becomes visible again
  const refresh = useCallback(async () => {
    await loadActivities();
  }, [loadActivities]);

  return {
    activities,
    loading,
    syncing,
    sync,
    saveActivity,
    removeActivity,
    refresh,
  };
}

export function useDaySummaries() {
  const { activities, loading, syncing, sync, refresh } = useActivities();

  const dayNames = [
    'Pre-Trip', 'Arrival Day', 'Nusa Penida', 'Gili Trawangan',
    'Gili Trawangan', 'Ubud & Lovina', 'Lovina',
    'Mt Batur & ATV', 'Canggu', 'Uluwatu & Beaches', 'Departure',
  ];

  const allDays = Array.from({ length: 11 }, (_, i) => {
    const dayNum = i;
    const dayActivities = activities.filter(a => Number(a.dayNumber) === dayNum);

    const baseDate = new Date('2026-02-26');
    baseDate.setDate(baseDate.getDate() + i);
    const date = baseDate.toISOString().split('T')[0];

    let totalIDR = 0;
    let totalUSD = 0;
    for (const a of dayActivities) {
      if (a.amount) {
        if (a.currency === 'USD') totalUSD += a.amount;
        else totalIDR += a.amount;
      }
    }

    return {
      dayNumber: dayNum,
      date,
      title: dayNames[i],
      activityCount: dayActivities.length,
      totalIDR,
      totalUSD,
      activities: dayActivities,
    };
  });

  // Only show Day 0 (Pre-Trip) if it has activities
  const daySummaries = allDays.filter(d => d.dayNumber > 0 || d.activityCount > 0);

  return { daySummaries, loading, syncing, sync, refresh };
}
