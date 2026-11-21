import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
import { Habit, HABIT_CATEGORIES, HabitCategory, HabitLog } from '../lib/blueprint';
import { CATEGORY_META, getHabitIconComponent, TIME_SLOT_LABELS, WEEKDAY_LABELS } from '../lib/categories';
import { formatReminderTime } from '../lib/dates';
import { computeHabitStreak } from '../lib/streaks';

interface HabitsManagerViewProps {
  habits: Habit[];
  logsByKey: Map<string, HabitLog>;
  todayKey: string;
  searchQuery: string;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onToggleArchive: (habitId: string, archived: boolean) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
}

export function HabitsManagerView({
  habits,
  logsByKey,
  todayKey,
  searchQuery,
  onOpenNewHabit,
  onEditHabit,
  onToggleArchive,
  onDeleteHabit,
}: HabitsManagerViewProps) {
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const [categoryFilter, setCategoryFilter] = useState<'all' | HabitCategory>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredHabits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return habits.filter((habit) => {
      if (statusFilter === 'active' && habit.archived) return false;
      if (statusFilter === 'archived' && !habit.archived) return false;
      if (categoryFilter !== 'all' && habit.category !== categoryFilter) return false;
      if (q && !habit.title.toLowerCase().includes(q) && !habit.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [habits, statusFilter, categoryFilter, searchQuery]);

  const formatSchedule = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    return WEEKDAY_LABELS.filter((w) => days.includes(w.index))
      .map((w) => w.short)
      .join(', ');
  };

  return (
    <div className="bg-white border border-[#E6E8F2] rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#E6E8F2] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Manage Habit Goals</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure daily targets, active weekdays, or archive habits you want to pause.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F4F5FA] rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'archived'
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Archived
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewHabit}
            className="h-10 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Habit
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="px-6 py-3 border-b border-[#F1F3F9] flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            categoryFilter === 'all'
              ? 'bg-[#EEF2FF] text-[#4F46E5]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          All Categories
        </button>
        {HABIT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              categoryFilter === cat
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {filteredHabits.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-semibold text-[#0F172A] mb-1">
            {statusFilter === 'archived' ? 'No archived habits' : 'No habits found'}
          </p>
          <p className="text-xs text-[#64748B] mb-5">
            {statusFilter === 'archived'
              ? 'Archived habits appear here when you pause a daily goal.'
              : 'Create a daily check-off or numeric goal to get started.'}
          </p>
          {statusFilter === 'active' && (
            <button
              type="button"
              onClick={onOpenNewHabit}
              className="h-10 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create Habit
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-[#F1F3F9]">
          {filteredHabits.map((habit) => {
            const meta = CATEGORY_META[habit.category];
            const Icon = getHabitIconComponent(habit);
            const streak = computeHabitStreak(habit, logsByKey, todayKey);
            const isConfirmingDelete = confirmDeleteId === habit.id;

            return (
              <li
                key={habit.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBFD] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.wellBg} ${meta.iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{habit.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#64748B] mt-0.5">
                      <span>{meta.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>{TIME_SLOT_LABELS[habit.timeOfDay]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {habit.trackingType === 'boolean'
                          ? 'Daily check-off'
                          : `${habit.targetValue.toLocaleString()} ${habit.unit || 'units'} / day`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatSchedule(habit.scheduleDays)}</span>
                      {habit.reminderTime && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatReminderTime(habit.reminderTime)} alert
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{streak}d streak</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditHabit(habit)}
                    aria-label={`Edit ${habit.title}`}
                    className="h-10 px-3 rounded-xl border border-[#E6E8F2] bg-white hover:border-[#4F46E5] text-xs font-semibold text-[#475569] hover:text-[#4F46E5] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => void onToggleArchive(habit.id, !habit.archived)}
                    className="h-10 px-3 rounded-xl border border-[#E6E8F2] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {habit.archived ? (
                      <>
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        Archive
                      </>
                    )}
                  </button>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(null);
                          void onDeleteHabit(habit.id);
                        }}
                        className="h-10 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-10 px-3 rounded-xl border border-[#E6E8F2] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(habit.id)}
                      aria-label={`Delete ${habit.title}`}
                      className="w-10 h-10 rounded-xl border border-[#E6E8F2] bg-white hover:border-red-200 hover:bg-red-50 text-[#64748B] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
