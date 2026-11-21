import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit, HabitLog } from '../lib/blueprint';
import {
  formatLongDate,
  formatMonthYear,
  getMonthCalendarCells,
  parseDateKey,
} from '../lib/dates';
import { computeDaySummary, isHabitScheduledForDate } from '../lib/streaks';

interface MonthlyCalendarHeatmapProps {
  habits: Habit[];
  logsByKey: Map<string, HabitLog>;
  todayKey: string;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthlyCalendarHeatmap({
  habits,
  logsByKey,
  todayKey,
  selectedDateKey,
  onSelectDate,
}: MonthlyCalendarHeatmapProps) {
  const todayDate = useMemo(() => parseDateKey(todayKey), [todayKey]);
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [habitFilterId, setHabitFilterId] = useState<string>('all');
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const scopedHabits = useMemo(() => {
    if (habitFilterId === 'all') return activeHabits;
    const match = activeHabits.find((h) => h.id === habitFilterId);
    return match ? [match] : activeHabits;
  }, [activeHabits, habitFilterId]);

  const cells = useMemo(
    () => getMonthCalendarCells(viewYear, viewMonth, todayKey),
    [viewYear, viewMonth, todayKey]
  );

  const isCurrentMonth =
    viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpCurrentMonth = () => {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
  };

  const monthStats = useMemo(() => {
    let scheduledDays = 0;
    let perfectDays = 0;
    let totalRateSum = 0;

    for (const cell of cells) {
      if (!cell || cell.isFuture) continue;
      const summary = computeDaySummary(scopedHabits, logsByKey, cell.dateKey);
      if (summary.scheduledCount > 0) {
        scheduledDays += 1;
        totalRateSum += summary.completionRate;
        if (summary.isComplete) {
          perfectDays += 1;
        }
      }
    }

    const averageRate = scheduledDays > 0 ? Math.round(totalRateSum / scheduledDays) : 0;
    return { scheduledDays, perfectDays, averageRate };
  }, [cells, scopedHabits, logsByKey]);

  const inspectedDateKey = hoveredDateKey ?? selectedDateKey;
  const inspectedSummary = useMemo(
    () => computeDaySummary(scopedHabits, logsByKey, inspectedDateKey),
    [scopedHabits, logsByKey, inspectedDateKey]
  );

  const getCellStyle = (
    rate: number,
    scheduledCount: number,
    isFuture: boolean
  ): string => {
    if (isFuture) {
      return 'bg-[#FAFBFD] text-[#CBD5E1] border border-dashed border-[#E6E8F2] cursor-default';
    }
    if (scheduledCount === 0) {
      return 'bg-[#F8F9FC] text-[#94A3B8] hover:bg-[#F1F3F9] cursor-pointer';
    }
    if (rate === 0) {
      return 'bg-[#F1F3F9] text-[#64748B] hover:bg-[#E2E8F0] cursor-pointer';
    }
    if (rate < 50) {
      return 'bg-[#E0E7FF] text-[#3730A3] hover:bg-[#C7D2FE] cursor-pointer';
    }
    if (rate < 100) {
      return 'bg-[#818CF8] text-white hover:bg-[#6366F1] cursor-pointer';
    }
    return 'bg-[#4F46E5] text-white font-bold hover:bg-[#4338CA] cursor-pointer';
  };

  return (
    <section
      aria-label="Monthly consistency heatmap"
      className="bg-white border border-[#E6E8F2] rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1F3F9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Monthly Consistency</h2>
            <p className="text-xs text-[#64748B] mt-0.5 font-mono tabular-nums">
              {monthStats.perfectDays} perfect {monthStats.perfectDays === 1 ? 'day' : 'days'} ·{' '}
              {monthStats.averageRate}% monthly avg
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeHabits.length > 0 && (
            <select
              aria-label="Filter heatmap by habit"
              value={habitFilterId}
              onChange={(e) => setHabitFilterId(e.target.value)}
              className="h-9 px-3 rounded-xl border border-[#E6E8F2] bg-[#F8F9FC] text-xs font-semibold text-[#0F172A] focus:border-[#4F46E5] focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Habits</option>
              {activeHabits.map((habit) => (
                <option key={habit.id} value={habit.id}>
                  {habit.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 bg-[#F8F9FC] border border-[#E6E8F2] rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-lg hover:bg-white text-[#475569] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleJumpCurrentMonth}
              className="px-2.5 h-8 rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {formatMonthYear(viewYear, viewMonth)}
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-lg hover:bg-white disabled:opacity-35 text-[#475569] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-2 mt-5 mb-2">
        {WEEKDAY_HEADERS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-semibold text-[#64748B] py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="h-10 sm:h-11" aria-hidden="true" />;
          }

          const summary = computeDaySummary(scopedHabits, logsByKey, cell.dateKey);
          const isSelected = cell.dateKey === selectedDateKey;
          const scheduledSingle =
            habitFilterId !== 'all' &&
            scopedHabits.length === 1 &&
            isHabitScheduledForDate(scopedHabits[0], cell.dateKey);

          const tooltipLabel = cell.isFuture
            ? `${formatLongDate(cell.dateKey)} (Upcoming)`
            : summary.scheduledCount === 0
              ? `${formatLongDate(cell.dateKey)} · Rest day`
              : `${formatLongDate(cell.dateKey)} · ${summary.completedCount}/${summary.scheduledCount} completed (${summary.completionRate}%)`;

          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={cell.isFuture}
              title={tooltipLabel}
              aria-label={tooltipLabel}
              aria-pressed={isSelected}
              onClick={() => {
                if (!cell.isFuture) {
                  onSelectDate(cell.dateKey);
                }
              }}
              onMouseEnter={() => {
                if (!cell.isFuture) {
                  setHoveredDateKey(cell.dateKey);
                }
              }}
              onMouseLeave={() => setHoveredDateKey(null)}
              className={`relative h-10 sm:h-11 rounded-xl text-xs font-mono tabular-nums flex flex-col items-center justify-center transition-all ${getCellStyle(
                summary.completionRate,
                summary.scheduledCount,
                cell.isFuture
              )} ${
                isSelected
                  ? 'ring-2 ring-[#4F46E5] ring-offset-2 ring-offset-white'
                  : cell.isToday
                    ? 'ring-1 ring-[#4F46E5]/50'
                    : ''
              }`}
            >
              <span>{cell.dayNumber}</span>
              {(cell.isToday || scheduledSingle) && summary.completionRate === 100 && (
                <span className="sr-only">Complete</span>
              )}
              {cell.isToday && (
                <span
                  aria-hidden="true"
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    summary.completionRate >= 50 ? 'bg-white' : 'bg-[#4F46E5]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Inspection Strip & Intensity Legend */}
      <div className="mt-5 pt-4 border-t border-[#F1F3F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#64748B]">
          <span className="font-semibold text-[#0F172A]">
            {formatLongDate(inspectedDateKey)}
          </span>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          {inspectedSummary.scheduledCount === 0 ? (
            <span>No goals scheduled</span>
          ) : (
            <span className="font-mono tabular-nums">
              {inspectedSummary.completedCount}/{inspectedSummary.scheduledCount} completed (
              {inspectedSummary.completionRate}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <span>Less</span>
          <span className="w-3.5 h-3.5 rounded bg-[#F1F3F9] border border-[#E6E8F2]" title="0%" />
          <span className="w-3.5 h-3.5 rounded bg-[#E0E7FF]" title="1-49%" />
          <span className="w-3.5 h-3.5 rounded bg-[#818CF8]" title="50-99%" />
          <span className="w-3.5 h-3.5 rounded bg-[#4F46E5]" title="100%" />
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
