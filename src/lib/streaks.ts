import { Habit, HabitLog } from './blueprint';
import { addDaysToDateKey, getWeekdayIndex } from './dates';

export function isHabitScheduledForDate(habit: Habit, dateKey: string): boolean {
  if (habit.archived) return false;
  const weekday = getWeekdayIndex(dateKey);
  return habit.scheduleDays.includes(weekday);
}

export interface DaySummary {
  dateKey: string;
  scheduledCount: number;
  completedCount: number;
  completionRate: number;
  isComplete: boolean;
}

export function computeDaySummary(
  habits: Habit[],
  logsByKey: Map<string, HabitLog>,
  dateKey: string
): DaySummary {
  const scheduled = habits.filter((habit) => isHabitScheduledForDate(habit, dateKey));
  const scheduledCount = scheduled.length;

  if (scheduledCount === 0) {
    return {
      dateKey,
      scheduledCount: 0,
      completedCount: 0,
      completionRate: 0,
      isComplete: false,
    };
  }

  let completedCount = 0;
  for (const habit of scheduled) {
    const log = logsByKey.get(`${habit.id}_${dateKey}`);
    if (log?.completed) {
      completedCount += 1;
    }
  }

  const completionRate = Math.round((completedCount / scheduledCount) * 100);
  return {
    dateKey,
    scheduledCount,
    completedCount,
    completionRate,
    isComplete: completedCount === scheduledCount,
  };
}

export interface StreakMetrics {
  currentStreak: number;
  bestStreak: number;
  todayCompleted: boolean;
}

export function computeOverallStreaks(
  habits: Habit[],
  logsByKey: Map<string, HabitLog>,
  todayKey: string,
  lookbackDays = 90
): StreakMetrics {
  const activeHabits = habits.filter((h) => !h.archived);
  if (activeHabits.length === 0) {
    return { currentStreak: 0, bestStreak: 0, todayCompleted: false };
  }

  const todaySummary = computeDaySummary(activeHabits, logsByKey, todayKey);
  const todayCompleted = todaySummary.scheduledCount > 0 && todaySummary.isComplete;

  // Calculate current streak: counts consecutive completed scheduled days ending at today (if done)
  // or ending at yesterday (while today is still in progress).
  let currentStreak = 0;
  let cursor = todayCompleted ? todayKey : addDaysToDateKey(todayKey, -1);

  for (let i = 0; i < lookbackDays; i += 1) {
    const summary = computeDaySummary(activeHabits, logsByKey, cursor);
    if (summary.scheduledCount === 0) {
      // Rest day with no scheduled habits neither breaks nor increments the streak
      cursor = addDaysToDateKey(cursor, -1);
      continue;
    }
    if (summary.isComplete) {
      currentStreak += 1;
      cursor = addDaysToDateKey(cursor, -1);
    } else {
      break;
    }
  }

  // Calculate best streak across the lookback window chronologically
  let bestStreak = 0;
  let running = 0;
  for (let offset = -(lookbackDays - 1); offset <= 0; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset);
    const summary = computeDaySummary(activeHabits, logsByKey, dateKey);
    if (summary.scheduledCount === 0) {
      continue;
    }
    if (summary.isComplete) {
      running += 1;
      if (running > bestStreak) {
        bestStreak = running;
      }
    } else {
      running = 0;
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    todayCompleted,
  };
}

export function computeHabitStreak(
  habit: Habit,
  logsByKey: Map<string, HabitLog>,
  todayKey: string,
  lookbackDays = 90
): number {
  const todayScheduled = isHabitScheduledForDate(habit, todayKey);
  const todayDone = Boolean(logsByKey.get(`${habit.id}_${todayKey}`)?.completed);

  let streak = 0;
  let cursor = todayScheduled && todayDone ? todayKey : addDaysToDateKey(todayKey, -1);

  for (let i = 0; i < lookbackDays; i += 1) {
    if (!isHabitScheduledForDate(habit, cursor)) {
      cursor = addDaysToDateKey(cursor, -1);
      continue;
    }
    const done = Boolean(logsByKey.get(`${habit.id}_${cursor}`)?.completed);
    if (done) {
      streak += 1;
      cursor = addDaysToDateKey(cursor, -1);
    } else {
      break;
    }
  }

  return streak;
}
