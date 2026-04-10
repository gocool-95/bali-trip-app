import { LocalNotifications } from '@capacitor/local-notifications';
import { type LocalActivity } from './db';
import { getAllLocalActivities } from './sync';
import { activityToUTC, getTimezoneLabel } from './timezone';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    // Not running on native — notifications not available
    return false;
  }
}

export async function scheduleActivityReminders(): Promise<void> {
  try {
    // Cancel all existing notifications first
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const activities = await getAllLocalActivities();
    const now = new Date();
    const notifications: any[] = [];

    for (const activity of activities) {
      if (activity.completed) continue; // Skip completed activities

      // Use timezone-aware UTC conversion, then subtract 15 minutes
      const actUTC = activityToUTC(activity);
      const reminderTime = new Date(actUTC.getTime() - 15 * 60 * 1000);

      if (reminderTime <= now) continue; // Skip past activities

      const tzLabel = getTimezoneLabel(activity.timezone);

      notifications.push({
        title: `Coming up in 15 min`,
        body: `${activity.title} at ${activity.location} (${activity.time} ${tzLabel})`,
        id: hashId(activity._id),
        schedule: { at: reminderTime },
        extra: { activityId: activity._id },
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch {
    // Notifications not available (web/dev mode)
  }
}

// Simple string hash to create numeric IDs
function hashId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
