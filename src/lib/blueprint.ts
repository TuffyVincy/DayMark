import { FieldValue, serverTimestamp } from 'firebase/firestore';

export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  DATE_KEY_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  DISPLAY_NAME_MIN: 1,
  DISPLAY_NAME_MAX: 80,
  EMAIL_MAX: 160,
  PHOTO_URL_MAX: 500,
  HABIT_ID_MAX: 64,
  TITLE_MIN: 1,
  TITLE_MAX: 80,
  UNIT_MAX: 24,
  TARGET_MIN: 1,
  TARGET_MAX: 100000,
  LOG_VALUE_MIN: 0,
  LOG_VALUE_MAX: 1000000,
  SCHEDULE_MIN_DAYS: 1,
  SCHEDULE_MAX_DAYS: 7,
  REMINDER_TIME_MAX: 5,
  REMINDER_TIME_PATTERN: /^([01][0-9]|2[0-3]):[0-5][0-9]$/,
} as const;

export const HABIT_CATEGORIES = ['wellness', 'focus', 'fitness', 'learning'] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export const HABIT_ICONS = [
  'droplets',
  'heart',
  'brain',
  'dumbbell',
  'footprints',
  'book',
  'moon',
  'sun',
  'apple',
  'flame',
  'music',
  'pencil',
] as const;
export type HabitIcon = (typeof HABIT_ICONS)[number];

export const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'anytime'] as const;
export type TimeOfDay = (typeof TIME_SLOTS)[number];

export const TRACKING_TYPES = ['boolean', 'numeric'] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  category: HabitCategory;
  icon?: HabitIcon;
  timeOfDay: TimeOfDay;
  trackingType: TrackingType;
  targetValue: number;
  unit: string;
  scheduleDays: number[];
  reminderTime?: string;
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  dateKey: string;
  value: number;
  targetSnapshot: number;
  completed: boolean;
  updatedAt?: unknown;
}

export interface HabitDraft {
  title: string;
  category: HabitCategory;
  icon: HabitIcon;
  timeOfDay: TimeOfDay;
  trackingType: TrackingType;
  targetValue: number;
  unit: string;
  scheduleDays: number[];
  reminderTime: string;
}

export function generateHabitId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `hab_${timePart}_${randomPart}`.slice(0, BLUEPRINT_LIMITS.HABIT_ID_MAX);
}

export function sanitizeScheduleDays(days: number[]): number[] {
  const unique = Array.from(
    new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))
  ).sort((a, b) => a - b);
  return unique.length > 0 ? unique.slice(0, BLUEPRINT_LIMITS.SCHEDULE_MAX_DAYS) : [0, 1, 2, 3, 4, 5, 6];
}

export function validateHabitDraft(draft: HabitDraft): string | null {
  const trimmedTitle = draft.title.trim();
  if (trimmedTitle.length < BLUEPRINT_LIMITS.TITLE_MIN) {
    return 'Please enter a habit goal name.';
  }
  if (trimmedTitle.length > BLUEPRINT_LIMITS.TITLE_MAX) {
    return `Goal name must be ${BLUEPRINT_LIMITS.TITLE_MAX} characters or fewer.`;
  }
  if (!HABIT_CATEGORIES.includes(draft.category)) {
    return 'Select a valid category.';
  }
  if (!HABIT_ICONS.includes(draft.icon)) {
    return 'Select a valid habit icon.';
  }
  if (!TIME_SLOTS.includes(draft.timeOfDay)) {
    return 'Select a valid time of day.';
  }
  if (!TRACKING_TYPES.includes(draft.trackingType)) {
    return 'Select a valid tracking mode.';
  }
  if (draft.trackingType === 'numeric') {
    if (!Number.isFinite(draft.targetValue) || draft.targetValue < BLUEPRINT_LIMITS.TARGET_MIN || draft.targetValue > BLUEPRINT_LIMITS.TARGET_MAX) {
      return `Daily target must be between ${BLUEPRINT_LIMITS.TARGET_MIN} and ${BLUEPRINT_LIMITS.TARGET_MAX.toLocaleString()}.`;
    }
    if (draft.unit.trim().length > BLUEPRINT_LIMITS.UNIT_MAX) {
      return `Unit label must be ${BLUEPRINT_LIMITS.UNIT_MAX} characters or fewer.`;
    }
  }
  const cleanDays = sanitizeScheduleDays(draft.scheduleDays);
  if (cleanDays.length < BLUEPRINT_LIMITS.SCHEDULE_MIN_DAYS) {
    return 'Choose at least one day of the week.';
  }
  const reminder = draft.reminderTime.trim();
  if (reminder !== '' && !BLUEPRINT_LIMITS.REMINDER_TIME_PATTERN.test(reminder)) {
    return 'Please select a valid daily notification time (HH:MM).';
  }
  return null;
}

export function buildUserProfileCreatePayload(params: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Record<string, string | FieldValue> {
  const safeName = (params.displayName?.trim() || params.email?.split('@')[0] || 'Daymark User').slice(
    0,
    BLUEPRINT_LIMITS.DISPLAY_NAME_MAX
  );
  const safeEmail = (params.email?.trim() || 'user@example.com').slice(0, BLUEPRINT_LIMITS.EMAIL_MAX);
  const safePhoto = (params.photoURL?.trim() || '').slice(0, BLUEPRINT_LIMITS.PHOTO_URL_MAX);

  return {
    uid: params.uid,
    displayName: safeName,
    email: safeEmail,
    photoURL: safePhoto,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function buildUserProfileUpdatePayload(params: {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Record<string, string | FieldValue> {
  const safeName = (params.displayName?.trim() || params.email?.split('@')[0] || 'Daymark User').slice(
    0,
    BLUEPRINT_LIMITS.DISPLAY_NAME_MAX
  );
  const safeEmail = (params.email?.trim() || 'user@example.com').slice(0, BLUEPRINT_LIMITS.EMAIL_MAX);
  const safePhoto = (params.photoURL?.trim() || '').slice(0, BLUEPRINT_LIMITS.PHOTO_URL_MAX);

  return {
    displayName: safeName,
    email: safeEmail,
    photoURL: safePhoto,
    updatedAt: serverTimestamp(),
  };
}

export function buildHabitCreatePayload(
  userId: string,
  habitId: string,
  draft: HabitDraft
): Record<string, string | number | boolean | number[] | FieldValue> {
  const isBoolean = draft.trackingType === 'boolean';
  const targetValue = isBoolean
    ? 1
    : Math.min(
        BLUEPRINT_LIMITS.TARGET_MAX,
        Math.max(BLUEPRINT_LIMITS.TARGET_MIN, Math.round(draft.targetValue))
      );

  return {
    id: habitId,
    userId,
    title: draft.title.trim().slice(0, BLUEPRINT_LIMITS.TITLE_MAX),
    category: draft.category,
    icon: draft.icon,
    timeOfDay: draft.timeOfDay,
    trackingType: draft.trackingType,
    targetValue,
    unit: isBoolean ? '' : draft.unit.trim().slice(0, BLUEPRINT_LIMITS.UNIT_MAX),
    scheduleDays: sanitizeScheduleDays(draft.scheduleDays),
    reminderTime: draft.reminderTime.trim().slice(0, BLUEPRINT_LIMITS.REMINDER_TIME_MAX),
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function buildHabitUpdatePayload(
  draft: HabitDraft
): Record<string, string | number | number[] | FieldValue> {
  const isBoolean = draft.trackingType === 'boolean';
  const targetValue = isBoolean
    ? 1
    : Math.min(
        BLUEPRINT_LIMITS.TARGET_MAX,
        Math.max(BLUEPRINT_LIMITS.TARGET_MIN, Math.round(draft.targetValue))
      );

  return {
    title: draft.title.trim().slice(0, BLUEPRINT_LIMITS.TITLE_MAX),
    category: draft.category,
    icon: draft.icon,
    timeOfDay: draft.timeOfDay,
    trackingType: draft.trackingType,
    targetValue,
    unit: isBoolean ? '' : draft.unit.trim().slice(0, BLUEPRINT_LIMITS.UNIT_MAX),
    scheduleDays: sanitizeScheduleDays(draft.scheduleDays),
    reminderTime: draft.reminderTime.trim().slice(0, BLUEPRINT_LIMITS.REMINDER_TIME_MAX),
    updatedAt: serverTimestamp(),
  };
}

export function buildHabitLogPayload(params: {
  userId: string;
  habit: Habit;
  dateKey: string;
  nextValue: number;
}): Record<string, string | number | boolean | FieldValue> {
  const target = Math.min(
    BLUEPRINT_LIMITS.TARGET_MAX,
    Math.max(BLUEPRINT_LIMITS.TARGET_MIN, params.habit.targetValue)
  );
  const clampedValue = Math.min(
    BLUEPRINT_LIMITS.LOG_VALUE_MAX,
    Math.max(BLUEPRINT_LIMITS.LOG_VALUE_MIN, params.nextValue)
  );
  const normalizedValue =
    params.habit.trackingType === 'boolean' ? (clampedValue >= 1 ? 1 : 0) : clampedValue;
  const completed = normalizedValue >= target;

  return {
    id: `${params.habit.id}_${params.dateKey}`,
    userId: params.userId,
    habitId: params.habit.id,
    dateKey: params.dateKey,
    value: normalizedValue,
    targetSnapshot: target,
    completed,
    updatedAt: serverTimestamp(),
  };
}
