export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysToDateKey(dateKey: string, delta: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function getWeekdayIndex(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

export interface WeekDayOption {
  dateKey: string;
  weekdayShort: string;
  dayNumber: number;
  isToday: boolean;
}

export function getRollingWeekDays(todayKey: string): WeekDayOption[] {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days: WeekDayOption[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset);
    const parsed = parseDateKey(dateKey);
    days.push({
      dateKey,
      weekdayShort: weekdays[parsed.getDay()],
      dayNumber: parsed.getDate(),
      isToday: dateKey === todayKey,
    });
  }
  return days;
}

export function formatLongDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export interface CalendarDayCell {
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
}

export function getMonthCalendarCells(
  year: number,
  monthIndex: number,
  todayKey: string
): Array<CalendarDayCell | null> {
  const firstDayWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<CalendarDayCell | null> = [];

  for (let i = 0; i < firstDayWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(new Date(year, monthIndex, day));
    cells.push({
      dateKey,
      dayNumber: day,
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    });
  }

  return cells;
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatReminderTime(hhmm?: string): string {
  if (!hhmm || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(hhmm)) {
    return '';
  }
  const [hoursStr, minutesStr] = hhmm.split(':');
  const hours = Number(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutesStr} ${period}`;
}


