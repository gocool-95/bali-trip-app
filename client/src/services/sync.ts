import db, { type LocalActivity, type PendingSync } from './db';
import * as api from './api';
import fallbackData from '../data/itinerary.json';
import { scheduleActivityReminders } from './notifications';

let syncInProgress = false;

// Seed local DB with bundled fallback data if empty
export async function ensureLocalData(): Promise<void> {
  const count = await db.activities.count();
  if (count === 0) {
    const activities: LocalActivity[] = (fallbackData as any[]).map((item, index) => ({
      ...item,
      _id: `local_${item.dayNumber}_${item.order}`,
      updatedAt: Date.now(),
    }));
    await db.activities.bulkPut(activities);
  }
}

// Try to sync from server, merging with local data
export async function syncFromServer(): Promise<boolean> {
  if (syncInProgress) return false;
  syncInProgress = true;

  try {
    // First flush pending changes to server
    await flushPendingSync();

    const { activities: serverActivities } = await api.syncAll();

    // Merge: server wins on updatedAt
    for (const serverAct of serverActivities) {
      const localAct = await db.activities.get(serverAct._id);
      if (!localAct || serverAct.updatedAt >= localAct.updatedAt) {
        await db.activities.put(serverAct as LocalActivity);
      }
    }

    // Remove local-only items that now have server IDs
    const allLocal = await db.activities.toArray();
    const serverIds = new Set(serverActivities.map(a => a._id));
    for (const local of allLocal) {
      if (local._id.startsWith('local_') && !serverIds.has(local._id)) {
        // Check if there's a server version with same day/order
        const match = serverActivities.find(
          s => s.dayNumber === local.dayNumber && s.order === local.order
        );
        if (match) {
          await db.activities.delete(local._id);
        }
      }
    }

    await db.meta.put({ key: 'lastSync', value: Date.now() });
    syncInProgress = false;
    // Re-schedule notifications after sync
    scheduleActivityReminders();
    return true;
  } catch (err) {
    syncInProgress = false;
    return false;
  }
}

// Queue a write operation for later sync
export async function queueSync(
  activityId: string,
  action: PendingSync['action'],
  data?: Partial<LocalActivity>
): Promise<void> {
  await db.pendingSync.add({
    activityId,
    action,
    data,
    createdAt: Date.now(),
  });
}

// Flush all pending sync items to server
export async function flushPendingSync(): Promise<void> {
  const pending = await db.pendingSync.orderBy('createdAt').toArray();
  let networkError = false;

  for (const item of pending) {
    if (networkError) break; // Stop on network errors, retry later
    try {
      switch (item.action) {
        case 'create':
          if (item.data) {
            // Strip local _id so server generates a proper MongoDB ObjectId
            const { _id: _localId, ...dataForServer } = item.data;
            const created = await api.createActivity(dataForServer);
            // Replace local entry with server version
            if (item.activityId.startsWith('local_')) {
              await db.activities.delete(item.activityId);
            }
            await db.activities.put(created as LocalActivity);
          }
          break;
        case 'update':
          if (item.data && !item.activityId.startsWith('local_')) {
            await api.updateActivity(item.activityId, item.data);
          }
          break;
        case 'delete':
          if (!item.activityId.startsWith('local_')) {
            await api.deleteActivity(item.activityId);
          }
          break;
      }
      await db.pendingSync.delete(item.id!);
    } catch (err: any) {
      // Distinguish network errors from server rejections (4xx)
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) {
        // Server rejected this item (validation error etc.) — skip it, don't block queue
        await db.pendingSync.delete(item.id!);
        continue;
      }
      // Network error — stop flushing, retry later
      networkError = true;
    }
  }
}

// Get all activities for a day from local DB
export async function getLocalDayActivities(dayNumber: number): Promise<LocalActivity[]> {
  return db.activities
    .where('dayNumber')
    .equals(dayNumber)
    .sortBy('order');
}

// Get all activities from local DB
export async function getAllLocalActivities(): Promise<LocalActivity[]> {
  return db.activities.orderBy('[dayNumber+order]').toArray().catch(() =>
    db.activities.toArray().then(acts =>
      acts.sort((a, b) => a.dayNumber - b.dayNumber || a.order - b.order)
    )
  );
}

// Save activity locally and queue sync
export async function saveActivityLocally(
  activity: LocalActivity,
  isNew = false
): Promise<LocalActivity> {
  activity.updatedAt = Date.now();
  await db.activities.put(activity);
  await queueSync(activity._id, isNew ? 'create' : 'update', activity);
  // Re-schedule notifications when activities change
  scheduleActivityReminders();
  return activity;
}

// Delete activity locally and queue sync
export async function deleteActivityLocally(id: string): Promise<void> {
  await db.activities.delete(id);
  await queueSync(id, 'delete');
}
