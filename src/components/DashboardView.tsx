import { useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCircle2,
  Flame,
  ListChecks,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { DueHabitAlert, NotificationStatus } from '../hooks/useHabitNotifications';
import { Habit, HabitLog, TIME_SLOTS, TimeOfDay } from '../lib/blueprint';
import { CATEGORY_META, getHabitIconComponent, TIME_SLOT_LABELS } from '../lib/categories';
import { formatLongDate, formatReminderTime, getRollingWeekDays } from '../lib/dates';
import {
  computeDaySummary,
  computeHabitStreak,
  computeOverallStreaks,
  isHabitScheduledForDate,
} from '../lib/streaks';
import { MonthlyCalendarHeatmap } from './MonthlyCalendarHeatmap';
import { WeeklySummaryCard } from './WeeklySummaryCard';

interface DashboardViewProps {
  habits: Habit[];
  logsByKey: Map<string, HabitLog>;
  todayKey: string;
  selectedDateKey: string;
  searchQuery: string;
  dataLoading: boolean;
  notificationPermission: NotificationStatus;
  dueAlerts: DueHabitAlert[];
  onSelectDate: (dateKey: string) => void;
  onLogValue: (habit: Habit, dateKey: string, nextValue: number) => Promise<void>;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onLoadStarterRoutine: () => Promise<void>;
  onClearSearch: () => void;
  onRequestNotificationPermission: () => Promise<NotificationStatus>;
  onSendTestNotification: () => boolean;
  onDismissDueAlert: (habitId: string) => void;
}

export function DashboardView({
  habits,
  logsByKey,
  todayKey,
  selectedDateKey,
  searchQuery,
  dataLoading,
  notificationPermission,
  dueAlerts,
  onSelectDate,
  onLogValue,
  onOpenNewHabit,
  onEditHabit,
  onLoadStarterRoutine,
  onClearSearch,
  onRequestNotificationPermission,
  onSendTestNotification,
  onDismissDueAlert,
}: DashboardViewProps) {
  const [timeFilter, setTimeFilter] = useState<'all' | TimeOfDay>('all');
  const [loadingStarter, setLoadingStarter] = useState(false);
  const [testAlertSent, setTestAlertSent] = useState(false);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const weekDays = useMemo(() => getRollingWeekDays(todayKey), [todayKey]);

  const selectedDaySummary = useMemo(
    () => computeDaySummary(activeHabits, logsByKey, selectedDateKey),
    [activeHabits, logsByKey, selectedDateKey]
  );

  const todaySummary = useMemo(
    () => computeDaySummary(activeHabits, logsByKey, todayKey),
    [activeHabits, logsByKey, todayKey]
  );

  const streakMetrics = useMemo(
    () => computeOverallStreaks(activeHabits, logsByKey, todayKey),
    [activeHabits, logsByKey, todayKey]
  );

  const scheduledForSelectedDate = useMemo(
    () => activeHabits.filter((habit) => isHabitScheduledForDate(habit, selectedDateKey)),
    [activeHabits, selectedDateKey]
  );

  const filteredHabits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scheduledForSelectedDate.filter((habit) => {
      if (timeFilter !== 'all' && habit.timeOfDay !== timeFilter) {
        return false;
      }
      if (q && !habit.title.toLowerCase().includes(q) && !habit.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [scheduledForSelectedDate, timeFilter, searchQuery]);

  const numericHabitsToday = useMemo(
    () => scheduledForSelectedDate.filter((habit) => habit.trackingType === 'numeric'),
    [scheduledForSelectedDate]
  );

  const remainingTodayCount = Math.max(0, todaySummary.scheduledCount - todaySummary.completedCount);
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (selectedDaySummary.completionRate / 100) * ringCircumference;

  const handleLoadStarter = async () => {
    setLoadingStarter(true);
    await onLoadStarterRoutine();
    setLoadingStarter(false);
  };

  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 rounded-2xl bg-white border border-[#E6E8F2] p-5 animate-pulse"
            >
              <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
              <div className="h-7 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 h-96 rounded-2xl bg-white border border-[#E6E8F2] animate-pulse" />
          <div className="xl:col-span-4 h-96 rounded-2xl bg-white border border-[#E6E8F2] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-Card KPI Summary Strip */}
      <section aria-label="Daily overview metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6E8F2] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#64748B] mb-1">Active Goals</p>
            <p className="text-2xl font-bold text-[#0F172A] font-mono tabular-nums">
              {selectedDaySummary.scheduledCount}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">
              {selectedDateKey === todayKey ? 'Scheduled today' : 'Scheduled on day'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <ListChecks className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E6E8F2] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#64748B] mb-1">Completed</p>
            <p className="text-2xl font-bold text-[#0F172A] font-mono tabular-nums">
              {selectedDaySummary.completedCount}
              <span className="text-sm font-medium text-[#64748B]">
                /{selectedDaySummary.scheduledCount}
              </span>
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">Daily check-ins</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E6E8F2] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#64748B] mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-[#0F172A] font-mono tabular-nums">
              {selectedDaySummary.completionRate}%
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">
              {selectedDaySummary.isComplete && selectedDaySummary.scheduledCount > 0
                ? 'Target reached'
                : 'In progress'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E6E8F2] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#64748B] mb-1">Best Streak</p>
            <p className="text-2xl font-bold text-[#0F172A] font-mono tabular-nums">
              {streakMetrics.bestStreak}
              <span className="text-sm font-medium text-[#64748B] ml-1">d</span>
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">All-time record</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#D97706] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left/Primary Column: Today's Check-In List + Monthly Consistency Heatmap */}
        <div className="xl:col-span-8 space-y-6">
          <section className="bg-white border border-[#E6E8F2] rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[#E6E8F2] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  {selectedDateKey === todayKey
                    ? "Today's Check-In List"
                    : `Check-Ins · ${formatLongDate(selectedDateKey)}`}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {selectedDaySummary.scheduledCount === 0
                    ? 'No habits scheduled for this date'
                    : `${selectedDaySummary.completedCount} of ${selectedDaySummary.scheduledCount} daily goals completed`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {notificationPermission === 'default' && (
                  <button
                    type="button"
                    onClick={() => void onRequestNotificationPermission()}
                    className="h-9 px-3 rounded-lg border border-[#E6E8F2] bg-[#F8F9FC] hover:border-[#4F46E5] hover:text-[#4F46E5] text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Enable Alerts
                  </button>
                )}

                {notificationPermission === 'granted' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSendTestNotification()) {
                        setTestAlertSent(true);
                        window.setTimeout(() => setTestAlertSent(false), 2500);
                      }
                    }}
                    className="h-9 px-3 rounded-lg border border-[#E6E8F2] bg-[#F8F9FC] hover:border-[#4F46E5] text-xs font-semibold text-[#16A34A] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    {testAlertSent ? 'Test Sent' : 'Alerts On'}
                  </button>
                )}

                {notificationPermission === 'denied' && (
                  <span
                    title="Enable notifications in your browser site settings"
                    className="h-9 px-3 rounded-lg border border-[#E6E8F2] bg-[#F8F9FC] text-xs font-medium text-[#64748B] inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    Alerts Blocked
                  </span>
                )}

                {selectedDateKey !== todayKey && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(todayKey)}
                    className="h-9 px-3.5 rounded-lg bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold hover:bg-[#E0E7FF] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Back to Today
                  </button>
                )}
              </div>
            </div>

            {/* 7-Day Date Selector Strip */}
            <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Select day">
              {weekDays.map((day) => {
                const daySummary = computeDaySummary(activeHabits, logsByKey, day.dateKey);
                const selected = day.dateKey === selectedDateKey;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => onSelectDate(day.dateKey)}
                    className={`min-h-[54px] py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#4F46E5] text-white shadow-[0_4px_12px_rgba(79,70,229,0.24)]'
                        : 'bg-[#F8F9FC] text-[#475569] hover:bg-[#EEF2FF] hover:text-[#4F46E5]'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-medium ${
                        selected ? 'text-indigo-100' : 'text-[#64748B]'
                      }`}
                    >
                      {day.isToday ? 'Today' : day.weekdayShort}
                    </span>
                    <span className="text-sm font-bold font-mono tabular-nums">
                      {day.dayNumber}
                    </span>
                    <span
                      className={`w-5 h-1 rounded-full mt-0.5 ${
                        daySummary.isComplete && daySummary.scheduledCount > 0
                          ? selected
                            ? 'bg-white'
                            : 'bg-[#16A34A]'
                          : daySummary.completedCount > 0
                            ? selected
                              ? 'bg-indigo-200'
                              : 'bg-[#4F46E5]/45'
                            : 'bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Segmented Time-of-Day Filter */}
            <div className="flex items-center gap-1 p-1 bg-[#F4F5FA] rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  timeFilter === 'all'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                All
              </button>
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeFilter(slot)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    timeFilter === slot
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {TIME_SLOT_LABELS[slot]}
                </button>
              ))}
            </div>
          </div>

          {/* Live Due Habit Alerts */}
          {dueAlerts.length > 0 && (
            <div className="px-5 sm:px-6 py-3 bg-[#EEF2FF] border-b border-[#E0E7FF] space-y-2">
              {dueAlerts.map((alert) => (
                <div
                  key={alert.habit.id}
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BellRing className="w-4 h-4 text-[#4F46E5] shrink-0" />
                    <p className="text-xs font-semibold text-[#1E1B4B] truncate">
                      Reminder due ({alert.reminderLabel}): {alert.habit.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        void onLogValue(alert.habit, alert.dateKey, alert.habit.targetValue);
                        onDismissDueAlert(alert.habit.id);
                      }}
                      className="h-8 px-3 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Mark Done
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismissDueAlert(alert.habit.id)}
                      className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#4338CA] hover:bg-white/70 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Habit Rows or Empty States */}
          {activeHabits.length === 0 ? (
            <div className="px-6 py-14 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-1.5">Set your first daily goal</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Create a custom check-off or numeric target habit, or load a balanced 4-habit starter routine to begin tracking right away.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onOpenNewHabit}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Create First Habit
                </button>
                <button
                  type="button"
                  disabled={loadingStarter}
                  onClick={() => void handleLoadStarter()}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl border border-[#E6E8F2] bg-white hover:bg-[#F8F9FC] text-[#0F172A] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  {loadingStarter ? 'Adding Routine...' : 'Load Starter Routine'}
                </button>
              </div>
            </div>
          ) : filteredHabits.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-[#0F172A] mb-1">No habits in this view</p>
              <p className="text-xs text-[#64748B] mb-4">
                {searchQuery
                  ? 'Try clearing your search filter or choosing another time of day.'
                  : 'No habits are scheduled for this filter and date.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setTimeFilter('all');
                  onClearSearch();
                }}
                className="h-10 px-4 rounded-xl bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold hover:bg-[#E0E7FF] transition-colors cursor-pointer whitespace-nowrap"
              >
                Show All Habits
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#F1F3F9]">
              {filteredHabits.map((habit) => {
                const log = logsByKey.get(`${habit.id}_${selectedDateKey}`);
                const currentValue = log?.value ?? 0;
                const isCompleted = Boolean(log?.completed);
                const habitStreak = computeHabitStreak(habit, logsByKey, todayKey);
                const categoryMeta = CATEGORY_META[habit.category];
                const HabitIcon = getHabitIconComponent(habit);
                const numericPct =
                  habit.trackingType === 'numeric'
                    ? Math.min(100, Math.round((currentValue / habit.targetValue) * 100))
                    : isCompleted
                      ? 100
                      : 0;

                return (
                  <li
                    key={habit.id}
                    className="px-5 sm:px-6 py-4 hover:bg-[#FAFBFD] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-[#ECFDF5] text-[#16A34A]'
                            : `${categoryMeta.wellBg} ${categoryMeta.iconColor}`
                        }`}
                      >
                        <HabitIcon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCompleted ? 'text-[#64748B] line-through' : 'text-[#0F172A]'
                            }`}
                          >
                            {habit.title}
                          </p>
                        </div>

                        {/* Unboxed typographic metadata (Zero-Pill Discipline) */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#64748B] mt-0.5">
                          <span>{TIME_SLOT_LABELS[habit.timeOfDay]}</span>
                          <span aria-hidden="true">·</span>
                          <span>{categoryMeta.label}</span>
                          {habit.reminderTime && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {formatReminderTime(habit.reminderTime)}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {habitStreak} {habitStreak === 1 ? 'day' : 'days'} streak
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              isCompleted ? 'text-[#16A34A] font-medium' : 'text-[#64748B]'
                            }
                          >
                            {isCompleted ? 'Done' : 'Pending'}
                          </span>
                        </div>

                        {/* Numeric Progress Bar */}
                        {habit.trackingType === 'numeric' && (
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-[#EEF2FF] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-200 ${
                                  isCompleted ? 'bg-[#16A34A]' : 'bg-[#4F46E5]'
                                }`}
                                style={{ width: `${numericPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold font-mono tabular-nums text-[#0F172A] shrink-0">
                              {currentValue.toLocaleString()} /{' '}
                              {habit.targetValue.toLocaleString()}
                              {habit.unit ? ` ${habit.unit}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action Controls */}
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {habit.trackingType === 'boolean' ? (
                        <button
                          type="button"
                          onClick={() =>
                            void onLogValue(habit, selectedDateKey, isCompleted ? 0 : 1)
                          }
                          aria-label={
                            isCompleted
                              ? `Mark ${habit.title} incomplete`
                              : `Mark ${habit.title} complete`
                          }
                          aria-pressed={isCompleted}
                          className={`h-10 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                            isCompleted
                              ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-[0_4px_12px_rgba(22,163,74,0.2)]'
                              : 'bg-white border-[#D6DAE8] text-[#0F172A] hover:border-[#4F46E5] hover:text-[#4F46E5]'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          {isCompleted ? 'Completed' : 'Check Off'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              void onLogValue(
                                habit,
                                selectedDateKey,
                                Math.max(0, currentValue - 1)
                              )
                            }
                            disabled={currentValue <= 0}
                            aria-label={`Decrease ${habit.title}`}
                            className="w-10 h-10 rounded-xl border border-[#E6E8F2] bg-white hover:bg-[#F8F9FC] disabled:opacity-40 text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void onLogValue(habit, selectedDateKey, currentValue + 1)
                            }
                            aria-label={`Increase ${habit.title}`}
                            className="w-10 h-10 rounded-xl border border-[#E6E8F2] bg-white hover:border-[#4F46E5] hover:text-[#4F46E5] text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() =>
                                void onLogValue(habit, selectedDateKey, habit.targetValue)
                              }
                              className="h-10 px-3 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditHabit(habit)}
                        aria-label={`Edit ${habit.title}`}
                        className="w-10 h-10 rounded-xl text-[#64748B] hover:text-[#4F46E5] hover:bg-[#EEF2FF] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          </section>

          <MonthlyCalendarHeatmap
            habits={habits}
            logsByKey={logsByKey}
            todayKey={todayKey}
            selectedDateKey={selectedDateKey}
            onSelectDate={onSelectDate}
          />
        </div>

        {/* Right Column: Signature Current Streak Card & Daily Progress Summary */}
        <aside className="xl:col-span-4 space-y-6">
          {/* Signature Current Streak Card (mirrors reference gradient card) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#5B4FE9] to-[#7C3AED] text-white p-6 shadow-[0_12px_30px_rgba(79,70,229,0.22)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-white/95">Current Streak</span>
              </div>
              <span className="text-xs font-medium text-indigo-100 font-mono tabular-nums">
                Best {streakMetrics.bestStreak}d
              </span>
            </div>

            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Flame className="w-7 h-7 text-amber-300 fill-amber-300/20" />
              </div>
              <p className="text-5xl font-extrabold font-mono tabular-nums tracking-tight">
                {streakMetrics.currentStreak}
              </p>
              <p className="text-sm font-semibold text-indigo-100 mt-1">
                {streakMetrics.currentStreak === 1 ? 'Day' : 'Days'}
              </p>
              <p className="text-xs text-indigo-100/90 mt-3 leading-relaxed max-w-[230px] mx-auto">
                {todaySummary.scheduledCount === 0
                  ? 'Add a daily habit goal to start building your streak.'
                  : streakMetrics.todayCompleted
                    ? 'All goals complete today — keep the momentum going!'
                    : `${remainingTodayCount} ${
                        remainingTodayCount === 1 ? 'goal' : 'goals'
                      } left today to keep your streak growing.`}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-indigo-100">Today&apos;s pace</span>
              <span className="font-semibold font-mono tabular-nums">
                {todaySummary.completedCount} / {todaySummary.scheduledCount} completed
              </span>
            </div>
          </div>

          <WeeklySummaryCard
            habits={habits}
            logsByKey={logsByKey}
            todayKey={todayKey}
            currentStreak={streakMetrics.currentStreak}
          />

          {/* Daily Goal Progress Ring & Numeric Targets Card */}
          <div className="bg-white border border-[#E6E8F2] rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[#0F172A]">Daily Progress</h3>
              <span className="text-xs text-[#64748B]">
                {selectedDateKey === todayKey ? 'Today' : formatLongDate(selectedDateKey)}
              </span>
            </div>

            <div className="flex items-center gap-5 pb-5 border-b border-[#F1F3F9]">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
                  <circle
                    cx="56"
                    cy="56"
                    r={ringRadius}
                    fill="none"
                    stroke="#EEF2FF"
                    strokeWidth="10"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={ringRadius}
                    fill="none"
                    stroke={selectedDaySummary.completionRate === 100 ? '#16A34A' : '#4F46E5'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[#0F172A] font-mono tabular-nums">
                    {selectedDaySummary.completionRate}%
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Completed</span>
                  <span className="font-semibold text-[#16A34A] font-mono tabular-nums">
                    {selectedDaySummary.completedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Remaining</span>
                  <span className="font-semibold text-[#0F172A] font-mono tabular-nums">
                    {Math.max(
                      0,
                      selectedDaySummary.scheduledCount - selectedDaySummary.completedCount
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Scheduled</span>
                  <span className="font-semibold text-[#0F172A] font-mono tabular-nums">
                    {selectedDaySummary.scheduledCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Numeric Target Goals Snapshot */}
            <div className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-[#0F172A]">Numeric Targets</h4>
                <span className="text-xs text-[#64748B] font-mono tabular-nums">
                  {numericHabitsToday.length}
                </span>
              </div>

              {numericHabitsToday.length === 0 ? (
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Add a numeric target habit (like 8 glasses of water or 30 mins reading) to track measurable progress bars here.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {numericHabitsToday.slice(0, 4).map((habit) => {
                    const value = logsByKey.get(`${habit.id}_${selectedDateKey}`)?.value ?? 0;
                    const pct = Math.min(100, Math.round((value / habit.targetValue) * 100));
                    return (
                      <div key={habit.id}>
                        <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                          <span className="font-medium text-[#0F172A] truncate">{habit.title}</span>
                          <span className="font-mono tabular-nums text-[#64748B] shrink-0">
                            {value.toLocaleString()}/{habit.targetValue.toLocaleString()}{' '}
                            {habit.unit}
                          </span>
                        </div>
                        <div className="h-2 bg-[#EEF2FF] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-200 ${
                              pct >= 100 ? 'bg-[#16A34A]' : 'bg-[#4F46E5]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
