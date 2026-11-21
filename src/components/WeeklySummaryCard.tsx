import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Habit, HabitLog } from '../lib/blueprint';
import { getRollingWeekDays } from '../lib/dates';
import { computeDaySummary } from '../lib/streaks';

interface WeeklySummaryCardProps {
  habits: Habit[];
  logsByKey: Map<string, HabitLog>;
  todayKey: string;
  currentStreak: number;
}

interface WeeklySummaryData {
  headline: string;
  insight: string;
  completionRate: number;
  totalCompleted: number;
  totalScheduled: number;
}

export function WeeklySummaryCard({
  habits,
  logsByKey,
  todayKey,
  currentStreak,
}: WeeklySummaryCardProps) {
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastDigestRef = useRef<string>('');

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const weekDays = useMemo(() => getRollingWeekDays(todayKey), [todayKey]);

  const weeklyLogs = useMemo(() => {
    const items: Array<{
      habitId: string;
      dateKey: string;
      value: number;
      completed: boolean;
    }> = [];
    for (const habit of activeHabits) {
      for (const day of weekDays) {
        const log = logsByKey.get(`${habit.id}_${day.dateKey}`);
        if (log) {
          items.push({
            habitId: log.habitId,
            dateKey: log.dateKey,
            value: log.value,
            completed: log.completed,
          });
        }
      }
    }
    return items;
  }, [activeHabits, weekDays, logsByKey]);

  const weekTotals = useMemo(() => {
    let scheduled = 0;
    let completed = 0;
    for (const day of weekDays) {
      const daySummary = computeDaySummary(activeHabits, logsByKey, day.dateKey);
      scheduled += daySummary.scheduledCount;
      completed += daySummary.completedCount;
    }
    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
    return { scheduled, completed, rate };
  }, [activeHabits, logsByKey, weekDays]);

  const stateDigest = useMemo(() => {
    if (weekTotals.scheduled === 0) return '';
    return JSON.stringify({
      todayKey,
      currentStreak,
      habits: activeHabits.map((h) => `${h.id}:${h.title}:${h.targetValue}:${h.scheduleDays.join(',')}`),
      logs: weeklyLogs.map((l) => `${l.habitId}_${l.dateKey}:${l.value}:${l.completed}`),
    });
  }, [todayKey, currentStreak, activeHabits, weeklyLogs, weekTotals.scheduled]);

  const fetchSummary = useCallback(
    async (force = false) => {
      if (weekTotals.scheduled === 0) {
        setSummary(null);
        setError(null);
        return;
      }
      if (!force && lastDigestRef.current === stateDigest && summary) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/weekly-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            todayKey,
            weekDays: weekDays.map((d) => ({ dateKey: d.dateKey, weekdayShort: d.weekdayShort })),
            habits: activeHabits.map((h) => ({
              id: h.id,
              title: h.title,
              category: h.category,
              trackingType: h.trackingType,
              targetValue: h.targetValue,
              unit: h.unit,
              scheduleDays: h.scheduleDays,
            })),
            logs: weeklyLogs,
            currentStreak,
          }),
        });

        const payload = (await response.json()) as Partial<WeeklySummaryData> & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to generate weekly summary.');
        }

        if (!payload.headline || !payload.insight) {
          throw new Error('Weekly summary response was incomplete.');
        }

        lastDigestRef.current = stateDigest;
        setSummary({
          headline: payload.headline,
          insight: payload.insight,
          completionRate: payload.completionRate ?? weekTotals.rate,
          totalCompleted: payload.totalCompleted ?? weekTotals.completed,
          totalScheduled: payload.totalScheduled ?? weekTotals.scheduled,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to generate weekly summary.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      weekTotals.scheduled,
      weekTotals.rate,
      weekTotals.completed,
      stateDigest,
      summary,
      todayKey,
      weekDays,
      activeHabits,
      weeklyLogs,
      currentStreak,
    ]
  );

  useEffect(() => {
    if (weekTotals.scheduled === 0) {
      setSummary(null);
      setError(null);
      lastDigestRef.current = '';
      return undefined;
    }

    if (lastDigestRef.current === stateDigest) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void fetchSummary(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [stateDigest, weekTotals.scheduled, fetchSummary]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <section
      aria-label="Weekly summary"
      className="bg-white border border-[#E6E8F2] rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Weekly Summary</h3>
            <p className="text-[11px] text-[#64748B]">Last 7 days</p>
          </div>
        </div>

        {weekTotals.scheduled > 0 && (
          <button
            type="button"
            onClick={() => void fetchSummary(true)}
            disabled={loading}
            aria-label="Refresh weekly summary"
            className="w-9 h-9 rounded-xl border border-[#E6E8F2] hover:border-[#4F46E5] text-[#64748B] hover:text-[#4F46E5] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {weekTotals.scheduled === 0 ? (
        <p className="text-xs text-[#64748B] leading-relaxed">
          Schedule daily habits and log check-ins across the week to see your personalized performance recap.
        </p>
      ) : loading && !summary ? (
        <div className="space-y-2.5 animate-pulse py-1">
          <div className="h-4 w-4/5 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-xs text-red-600 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => void fetchSummary(true)}
            className="h-9 px-3.5 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Try Again
          </button>
        </div>
      ) : summary ? (
        <div>
          <p className="text-sm font-bold text-[#0F172A] leading-snug">{summary.headline}</p>
          <p className="text-xs text-[#475569] leading-relaxed mt-2">{summary.insight}</p>

          <div className="mt-4 pt-3.5 border-t border-[#F1F3F9] flex items-center justify-between text-xs text-[#64748B]">
            <span>Weekly rate</span>
            <span className="font-semibold text-[#0F172A] font-mono tabular-nums">
              {summary.totalCompleted} / {summary.totalScheduled} goals ({summary.completionRate}%)
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
