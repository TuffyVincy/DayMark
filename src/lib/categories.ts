import {
  Apple,
  BookOpen,
  Brain,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  Music,
  PenLine,
  Sun,
} from 'lucide-react';
import { Habit, HabitCategory, HabitDraft, HabitIcon, TimeOfDay } from './blueprint';

export const CATEGORY_META: Record<
  HabitCategory,
  {
    label: string;
    wellBg: string;
    iconColor: string;
    defaultIcon: HabitIcon;
    Icon: typeof HeartPulse;
  }
> = {
  wellness: {
    label: 'Wellness',
    wellBg: 'bg-[#EEF2FF]',
    iconColor: 'text-[#4F46E5]',
    defaultIcon: 'heart',
    Icon: HeartPulse,
  },
  focus: {
    label: 'Focus',
    wellBg: 'bg-[#F3E8FF]',
    iconColor: 'text-[#7C3AED]',
    defaultIcon: 'brain',
    Icon: Brain,
  },
  fitness: {
    label: 'Fitness',
    wellBg: 'bg-[#ECFDF5]',
    iconColor: 'text-[#16A34A]',
    defaultIcon: 'dumbbell',
    Icon: Dumbbell,
  },
  learning: {
    label: 'Learning',
    wellBg: 'bg-[#FFF7ED]',
    iconColor: 'text-[#D97706]',
    defaultIcon: 'book',
    Icon: BookOpen,
  },
};

export const HABIT_ICON_META: Record<
  HabitIcon,
  {
    label: string;
    Icon: typeof HeartPulse;
  }
> = {
  droplets: { label: 'Hydration', Icon: Droplets },
  heart: { label: 'Wellness', Icon: HeartPulse },
  brain: { label: 'Focus', Icon: Brain },
  dumbbell: { label: 'Strength', Icon: Dumbbell },
  footprints: { label: 'Steps & Walk', Icon: Footprints },
  book: { label: 'Reading', Icon: BookOpen },
  moon: { label: 'Sleep', Icon: Moon },
  sun: { label: 'Morning', Icon: Sun },
  apple: { label: 'Nutrition', Icon: Apple },
  flame: { label: 'Cardio', Icon: Flame },
  music: { label: 'Music & Calm', Icon: Music },
  pencil: { label: 'Journal', Icon: PenLine },
};

export function getHabitIconComponent(habit: Pick<Habit, 'icon' | 'category'>) {
  if (habit.icon && habit.icon in HABIT_ICON_META) {
    return HABIT_ICON_META[habit.icon].Icon;
  }
  return CATEGORY_META[habit.category].Icon;
}

export const TIME_SLOT_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  anytime: 'Anytime',
};

export const WEEKDAY_LABELS = [
  { index: 1, short: 'Mon', single: 'M' },
  { index: 2, short: 'Tue', single: 'T' },
  { index: 3, short: 'Wed', single: 'W' },
  { index: 4, short: 'Thu', single: 'T' },
  { index: 5, short: 'Fri', single: 'F' },
  { index: 6, short: 'Sat', single: 'S' },
  { index: 0, short: 'Sun', single: 'S' },
] as const;

export const STARTER_HABITS: HabitDraft[] = [
  {
    title: 'Morning Hydration',
    category: 'wellness',
    icon: 'droplets',
    timeOfDay: 'morning',
    trackingType: 'numeric',
    targetValue: 8,
    unit: 'glasses',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '08:30',
  },
  {
    title: 'Focused Deep Work',
    category: 'focus',
    icon: 'brain',
    timeOfDay: 'morning',
    trackingType: 'numeric',
    targetValue: 60,
    unit: 'mins',
    scheduleDays: [1, 2, 3, 4, 5],
    reminderTime: '10:00',
  },
  {
    title: 'Read 20 Pages',
    category: 'learning',
    icon: 'book',
    timeOfDay: 'evening',
    trackingType: 'boolean',
    targetValue: 1,
    unit: '',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '20:30',
  },
  {
    title: 'Evening Walk',
    category: 'fitness',
    icon: 'footprints',
    timeOfDay: 'evening',
    trackingType: 'boolean',
    targetValue: 1,
    unit: '',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '',
  },
];
