import { FormEvent, useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { NotificationStatus } from '../hooks/useHabitNotifications';
import {
  BLUEPRINT_LIMITS,
  HABIT_CATEGORIES,
  HABIT_ICONS,
  Habit,
  HabitCategory,
  HabitDraft,
  HabitIcon,
  TIME_SLOTS,
  TimeOfDay,
  TrackingType,
  validateHabitDraft,
} from '../lib/blueprint';
import {
  CATEGORY_META,
  HABIT_ICON_META,
  TIME_SLOT_LABELS,
  WEEKDAY_LABELS,
} from '../lib/categories';

interface HabitFormModalProps {
  isOpen: boolean;
  editingHabit: Habit | null;
  notificationPermission: NotificationStatus;
  onRequestNotificationPermission: () => Promise<NotificationStatus>;
  onClose: () => void;
  onSubmit: (draft: HabitDraft, editingHabitId?: string) => Promise<boolean>;
}

const NUMERIC_PRESETS = [
  { label: '8 glasses', target: 8, unit: 'glasses' },
  { label: '30 mins', target: 30, unit: 'mins' },
  { label: '20 pages', target: 20, unit: 'pages' },
  { label: '8,000 steps', target: 8000, unit: 'steps' },
];

export function HabitFormModal({
  isOpen,
  editingHabit,
  notificationPermission,
  onRequestNotificationPermission,
  onClose,
  onSubmit,
}: HabitFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HabitCategory>('wellness');
  const [icon, setIcon] = useState<HabitIcon>('heart');
  const [iconManuallyChosen, setIconManuallyChosen] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [trackingType, setTrackingType] = useState<TrackingType>('boolean');
  const [targetValue, setTargetValue] = useState<string>('8');
  const [unit, setUnit] = useState('glasses');
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderTime, setReminderTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaving(false);
    if (editingHabit) {
      setTitle(editingHabit.title);
      setCategory(editingHabit.category);
      setIcon(editingHabit.icon ?? CATEGORY_META[editingHabit.category].defaultIcon);
      setIconManuallyChosen(true);
      setTimeOfDay(editingHabit.timeOfDay);
      setTrackingType(editingHabit.trackingType);
      setTargetValue(
        String(editingHabit.trackingType === 'numeric' ? editingHabit.targetValue : 8)
      );
      setUnit(editingHabit.unit || 'glasses');
      setScheduleDays(
        editingHabit.scheduleDays.length > 0 ? editingHabit.scheduleDays : [0, 1, 2, 3, 4, 5, 6]
      );
      setReminderTime(editingHabit.reminderTime || '');
    } else {
      setTitle('');
      setCategory('wellness');
      setIcon('heart');
      setIconManuallyChosen(false);
      setTimeOfDay('morning');
      setTrackingType('boolean');
      setTargetValue('8');
      setUnit('glasses');
      setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      setReminderTime('');
    }
  }, [isOpen, editingHabit]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    setScheduleDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayIndex);
      }
      return [...prev, dayIndex].sort((a, b) => a - b);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericTarget = Number(targetValue);
    const draft: HabitDraft = {
      title: title.trim(),
      category,
      icon,
      timeOfDay,
      trackingType,
      targetValue: trackingType === 'boolean' ? 1 : numericTarget,
      unit: trackingType === 'boolean' ? '' : unit.trim(),
      scheduleDays,
      reminderTime: reminderTime.trim(),
    };

    const validationError = validateHabitDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    const ok = await onSubmit(draft, editingHabit?.id);
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/45 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-[#E6E8F2] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E8F2]">
          <h2 id="habit-modal-title" className="text-lg font-bold text-[#0F172A]">
            {editingHabit ? 'Edit Habit Goal' : 'Create Daily Habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="w-10 h-10 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7FB] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {/* Habit Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="habit-title" className="text-xs font-semibold text-[#0F172A]">
                Goal Name
              </label>
              <span className="text-xs text-[#64748B] font-mono tabular-nums">
                {title.length}/{BLUEPRINT_LIMITS.TITLE_MAX}
              </span>
            </div>
            <input
              id="habit-title"
              type="text"
              maxLength={BLUEPRINT_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water or Morning meditation"
              className="w-full h-11 px-3.5 rounded-xl border border-[#E6E8F2] bg-[#F8F9FC] focus:bg-white focus:border-[#4F46E5] focus:outline-none text-sm text-[#0F172A] transition-colors"
              autoFocus
            />
          </div>

          {/* Goal Type */}
          <div>
            <span className="block text-xs font-semibold text-[#0F172A] mb-2">Tracking Mode</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F3F9] rounded-xl">
              <button
                type="button"
                onClick={() => setTrackingType('boolean')}
                className={`h-10 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  trackingType === 'boolean'
                    ? 'bg-white text-[#4F46E5] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Simple Check-off
              </button>
              <button
                type="button"
                onClick={() => setTrackingType('numeric')}
                className={`h-10 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  trackingType === 'numeric'
                    ? 'bg-white text-[#4F46E5] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Numeric Target
              </button>
            </div>
          </div>

          {/* Numeric Target Controls */}
          {trackingType === 'numeric' && (
            <div className="p-4 rounded-xl bg-[#F8F9FC] border border-[#E6E8F2] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="habit-target" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Daily Target
                  </label>
                  <input
                    id="habit-target"
                    type="number"
                    min={BLUEPRINT_LIMITS.TARGET_MIN}
                    max={BLUEPRINT_LIMITS.TARGET_MAX}
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E8F2] bg-white focus:border-[#4F46E5] focus:outline-none text-sm font-mono tabular-nums text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="habit-unit" className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Unit
                  </label>
                  <input
                    id="habit-unit"
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.UNIT_MAX}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="glasses, mins, pages"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E8F2] bg-white focus:border-[#4F46E5] focus:outline-none text-sm text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {NUMERIC_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setTargetValue(String(preset.target));
                      setUnit(preset.unit);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E8F2] hover:border-[#4F46E5] text-xs font-medium text-[#475569] hover:text-[#4F46E5] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <span className="block text-xs font-semibold text-[#0F172A] mb-2">Category</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HABIT_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const Icon = meta.Icon;
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      if (!iconManuallyChosen) {
                        setIcon(meta.defaultIcon);
                      }
                    }}
                    className={`h-11 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                        : 'border-[#E6E8F2] bg-white text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Habit Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#0F172A]">Icon</span>
              <span className="text-xs text-[#64748B]">{HABIT_ICON_META[icon].label}</span>
            </div>
            <div className="grid grid-cols-6 gap-2" role="group" aria-label="Choose habit icon">
              {HABIT_ICONS.map((iconKey) => {
                const iconMeta = HABIT_ICON_META[iconKey];
                const IconComp = iconMeta.Icon;
                const active = icon === iconKey;
                const catMeta = CATEGORY_META[category];
                return (
                  <button
                    key={iconKey}
                    type="button"
                    aria-label={iconMeta.label}
                    aria-pressed={active}
                    title={iconMeta.label}
                    onClick={() => {
                      setIcon(iconKey);
                      setIconManuallyChosen(true);
                    }}
                    className={`h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      active
                        ? `border-[#4F46E5] ${catMeta.wellBg} ${catMeta.iconColor} ring-2 ring-[#4F46E5]/20`
                        : 'border-[#E6E8F2] bg-white text-[#64748B] hover:border-[#C7D2FE] hover:text-[#0F172A]'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <span className="block text-xs font-semibold text-[#0F172A] mb-2">Preferred Time</span>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = timeOfDay === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeOfDay(slot)}
                    className={`h-10 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                        : 'border-[#E6E8F2] bg-white text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {TIME_SLOT_LABELS[slot]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repeat Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#0F172A]">Schedule Days</span>
              <button
                type="button"
                onClick={() => setScheduleDays([0, 1, 2, 3, 4, 5, 6])}
                className="text-xs font-medium text-[#4F46E5] hover:underline cursor-pointer"
              >
                Every day
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_LABELS.map((day) => {
                const active = scheduleDays.includes(day.index);
                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => toggleDay(day.index)}
                    aria-pressed={active}
                    className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-[#F1F3F9] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Notification Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="habit-reminder-time" className="text-xs font-semibold text-[#0F172A]">
                Daily Notification Time
              </label>
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="text-xs font-medium text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Clear reminder
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                id="habit-reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[#E6E8F2] bg-[#F8F9FC] focus:bg-white focus:border-[#4F46E5] focus:outline-none text-sm font-mono tabular-nums text-[#0F172A]"
              />
              <span className="text-xs text-[#64748B]">
                {reminderTime ? 'Alerts on scheduled days' : 'Optional'}
              </span>
            </div>

            {reminderTime && notificationPermission === 'default' && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#EEF2FF] flex items-center justify-between gap-3">
                <span className="text-xs text-[#3730A3]">
                  Allow browser notifications so alerts fire when this habit is due.
                </span>
                <button
                  type="button"
                  onClick={() => void onRequestNotificationPermission()}
                  className="h-8 px-3 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Allow
                </button>
              </div>
            )}

            {reminderTime && notificationPermission === 'granted' && (
              <p className="mt-2 text-xs text-[#16A34A] font-medium">
                Browser notifications are enabled for this reminder.
              </p>
            )}

            {reminderTime && notificationPermission === 'denied' && (
              <p className="mt-2 text-xs text-[#D97706]">
                Browser notifications are blocked in site settings. In-app alerts will still show while Daymark is open.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6E8F2]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 px-4 rounded-xl border border-[#E6E8F2] text-sm font-semibold text-[#475569] hover:bg-[#F6F7FB] transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {saving ? 'Saving...' : editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
