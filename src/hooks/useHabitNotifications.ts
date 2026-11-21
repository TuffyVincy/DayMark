import { useCallback, useEffect, useState } from 'react';
import { BLUEPRINT_LIMITS, Habit, HabitLog } from '../lib/blueprint';
import { formatReminderTime, toDateKey } from '../lib/dates';
import { isHabitScheduledForDate } from '../lib/streaks';

export type NotificationStatus = 'granted' | 'default' | 'denied' | 'unsupported';

export interface DueHabitAlert {
  habit: Habit;
  dateKey: string;
  reminderLabel: string;
}

function getBrowserPermission(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function parseMinutesFromHHMM(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

function getNotifiedStorageKey(userId: string, dateKey: string): string {
  return `daymark_notified_${userId}_${dateKey}`;
}

function readNotifiedSet(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function writeNotifiedSet(storageKey: string, items: Set<string>): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(items)));
  } catch {
    // Ignore storage quota errors
  }
}

export function useHabitNotifications(params: {
  userId: string | null;
  habits: Habit[];
  logsByKey: Map<string, HabitLog>;
}) {
  const { userId, habits, logsByKey } = params;
  const [permission, setPermission] = useState<NotificationStatus>(() => getBrowserPermission());
  const [dueAlerts, setDueAlerts] = useState<DueHabitAlert[]>([]);

  const syncPermission = useCallback(() => {
    setPermission(getBrowserPermission());
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationStatus> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      const current = getBrowserPermission();
      setPermission(current);
      return current;
    }
  }, []);

  const sendTestNotification = useCallback(() => {
    const current = getBrowserPermission();
    setPermission(current);
    if (current !== 'granted') return false;

    try {
      const notification = new Notification('Daymark Reminder Preview', {
        body: 'Daily habit notifications are enabled and ready.',
        tag: 'daymark-test-notification',
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return true;
    } catch {
      return false;
    }
  }, []);

  const dismissAlert = useCallback((habitId: string) => {
    setDueAlerts((prev) => prev.filter((item) => item.habit.id !== habitId));
  }, []);

  const checkDueHabits = useCallback(() => {
    if (!userId) return;

    const now = new Date();
    const currentDateKey = toDateKey(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const storageKey = getNotifiedStorageKey(userId, currentDateKey);
    const notified = readNotifiedSet(storageKey);
    let updatedNotified = false;
    const newlyDue: DueHabitAlert[] = [];

    for (const habit of habits) {
      if (habit.archived) continue;
      const reminder = habit.reminderTime?.trim() ?? '';
      if (!reminder || !BLUEPRINT_LIMITS.REMINDER_TIME_PATTERN.test(reminder)) {
        continue;
      }
      if (!isHabitScheduledForDate(habit, currentDateKey)) {
        continue;
      }
      const isCompletedToday = Boolean(logsByKey.get(`${habit.id}_${currentDateKey}`)?.completed);
      if (isCompletedToday) {
        continue;
      }

      const targetMinutes = parseMinutesFromHHMM(reminder);
      const diffMinutes = currentMinutes - targetMinutes;
      if (diffMinutes < 0 || diffMinutes > 2) {
        continue;
      }

      const token = `${habit.id}@${reminder}`;
      if (notified.has(token)) {
        continue;
      }

      notified.add(token);
      updatedNotified = true;

      const reminderLabel = formatReminderTime(reminder);
      newlyDue.push({ habit, dateKey: currentDateKey, reminderLabel });

      if (getBrowserPermission() === 'granted') {
        try {
          const bodyText =
            habit.trackingType === 'numeric'
              ? `Goal due (${reminderLabel}): ${habit.targetValue.toLocaleString()} ${habit.unit || 'units'}`
              : `Daily check-in due (${reminderLabel})`;
          const notification = new Notification(`Time for ${habit.title}`, {
            body: bodyText,
            tag: `daymark-${habit.id}-${currentDateKey}`,
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch {
          // Browser environment blocked direct Notification construction; in-app alert still surfaces
        }
      }
    }

    if (updatedNotified) {
      writeNotifiedSet(storageKey, notified);
    }

    if (newlyDue.length > 0) {
      setDueAlerts((prev) => {
        const existingIds = new Set(prev.map((a) => a.habit.id));
        const filteredNew = newlyDue.filter((a) => !existingIds.has(a.habit.id));
        return [...prev, ...filteredNew];
      });
    }
  }, [userId, habits, logsByKey]);

  // Remove in-app alerts automatically once the habit is completed or archived
  useEffect(() => {
    const today = toDateKey(new Date());
    setDueAlerts((prev) =>
      prev.filter((alert) => {
        const latest = habits.find((h) => h.id === alert.habit.id);
        if (!latest || latest.archived) return false;
        const done = Boolean(logsByKey.get(`${alert.habit.id}_${today}`)?.completed);
        return !done;
      })
    );
  }, [habits, logsByKey]);

  useEffect(() => {
    if (!userId) {
      setDueAlerts([]);
      return undefined;
    }

    checkDueHabits();
    const intervalId = window.setInterval(checkDueHabits, 15000);

    const handleVisibilityOrFocus = () => {
      syncPermission();
      checkDueHabits();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [userId, checkDueHabits, syncPermission]);

  return {
    permission,
    dueAlerts,
    requestPermission,
    sendTestNotification,
    dismissAlert,
  };
}
