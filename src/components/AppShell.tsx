import { ReactNode, useState } from 'react';
import { LayoutDashboard, ListTodo, LogOut, Plus, Search, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { formatLongDate, getGreeting } from '../lib/dates';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveTab = 'dashboard' | 'habits';

interface AppShellProps {
  user: User;
  activeTab: ActiveTab;
  todayKey: string;
  searchQuery: string;
  actionError: string | null;
  onSelectTab: (tab: ActiveTab) => void;
  onSearchChange: (value: string) => void;
  onOpenNewHabit: () => void;
  onSignOut: () => Promise<void>;
  onDismissError: () => void;
  children: ReactNode;
}

export function AppShell({
  user,
  activeTab,
  todayKey,
  searchQuery,
  actionError,
  onSelectTab,
  onSearchChange,
  onOpenNewHabit,
  onSignOut,
  onDismissError,
  children,
}: AppShellProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Friend';
  const firstName = displayName.split(' ')[0];
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#0F172A] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-white border-r border-[#E6E8F2] min-h-screen sticky top-0 h-screen">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(79,70,229,0.22)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12.5l4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
            Daymark
          </span>
        </div>

        <nav aria-label="Primary navigation" className="px-4 flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`w-full h-11 px-3.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : 'text-[#64748B] hover:bg-[#F8F9FC] hover:text-[#0F172A]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('habits')}
            className={`w-full h-11 px-3.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'habits'
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : 'text-[#64748B] hover:bg-[#F8F9FC] hover:text-[#0F172A]'
            }`}
          >
            <ListTodo className="w-4 h-4 shrink-0" />
            All Habits
          </button>
        </nav>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-4 border-t border-[#E6E8F2]">
          <div className="flex items-center gap-3 mb-3">
            {user.photoURL && !avatarFailed ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-10 h-10 rounded-full object-cover border border-[#E6E8F2] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs flex items-center justify-center shrink-0">
                {initials || 'DM'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0F172A] truncate">{displayName}</p>
              <p className="text-xs text-[#64748B] truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <PWAInstallButton variant="sidebar" />
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="w-full h-10 px-3 rounded-xl border border-[#E6E8F2] hover:bg-[#F8F9FC] text-xs font-semibold text-[#475569] hover:text-[#0F172A] flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-10">
        {/* Mobile Compact Top Header (non-sticky so mobile sticky cap remains < 10%) */}
        <div className="lg:hidden px-4 pt-4 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12.5l4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-[#0F172A]">Daymark</span>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="h-10 px-3 rounded-xl bg-white border border-[#E6E8F2] text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Workspace Top Header */}
        <header className="px-4 sm:px-6 lg:px-8 pt-4 lg:pt-7 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#64748B]">{formatLongDate(todayKey)}</p>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-0.5">
              {getGreeting()}, {firstName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search habits..."
                aria-label="Search habits"
                className="w-full h-11 pl-10 pr-8 rounded-xl bg-white border border-[#E6E8F2] focus:border-[#4F46E5] focus:outline-none text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md text-[#64748B] hover:text-[#0F172A] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenNewHabit}
              className="hidden sm:inline-flex h-11 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold items-center gap-2 transition-colors shadow-[0_4px_14px_rgba(79,70,229,0.22)] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Habit
            </button>
          </div>
        </header>

        {/* Recoverable Action Error Banner */}
        {actionError && (
          <div className="px-4 sm:px-6 lg:px-8 mb-4">
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between gap-3"
            >
              <span>{actionError}</span>
              <button
                type="button"
                onClick={onDismissError}
                aria-label="Dismiss message"
                className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Viewport Container */}
        <main className="px-4 sm:px-6 lg:px-8 flex-1 max-w-7xl w-full">{children}</main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#E6E8F2] grid grid-cols-3 items-center px-2"
      >
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#4F46E5]' : 'text-[#64748B]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] font-semibold">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewHabit}
          className="h-11 mx-2 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('habits')}
          className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'habits' ? 'text-[#4F46E5]' : 'text-[#64748B]'
          }`}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[11px] font-semibold">Habits</span>
        </button>
      </nav>
    </div>
  );
}
