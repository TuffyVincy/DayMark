import { useState } from 'react';
import { ActiveTab, AppShell } from './components/AppShell';
import { AuthWelcome } from './components/AuthWelcome';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HabitFormModal } from './components/HabitFormModal';
import { HabitsManagerView } from './components/HabitsManagerView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useHabitNotifications } from './hooks/useHabitNotifications';
import { useHabitTracker } from './hooks/useHabitTracker';
import { Habit, HabitDraft } from './lib/blueprint';

function HabitTrackerWorkspace() {
  const {
    user,
    authLoading,
    dataLoading,
    habits,
    logsByKey,
    todayKey,
    fatalError,
    actionError,
    authError,
    clearActionError,
    signInWithGoogle,
    signOutUser,
    createHabit,
    updateHabit,
    setHabitArchived,
    deleteHabit,
    logHabitValue,
    loadStarterRoutine,
  } = useHabitTracker();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const {
    permission: notificationPermission,
    dueAlerts,
    requestPermission: requestNotificationPermission,
    sendTestNotification,
    dismissAlert: dismissDueAlert,
  } = useHabitNotifications({
    userId: user?.uid ?? null,
    habits,
    logsByKey,
  });

  if (fatalError) {
    throw fatalError;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] animate-pulse" />
          <p className="text-sm font-medium text-[#64748B]">Loading Daymark...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthWelcome onSignIn={signInWithGoogle} authError={authError} />;
  }

  const handleOpenNewHabit = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const handleModalSubmit = async (draft: HabitDraft, editingHabitId?: string): Promise<boolean> => {
    if (editingHabitId) {
      return updateHabit(editingHabitId, draft);
    }
    return createHabit(draft);
  };

  return (
    <>
      <AppShell
        user={user}
        activeTab={activeTab}
        todayKey={todayKey}
        searchQuery={searchQuery}
        actionError={actionError}
        onSelectTab={setActiveTab}
        onSearchChange={setSearchQuery}
        onOpenNewHabit={handleOpenNewHabit}
        onSignOut={signOutUser}
        onDismissError={clearActionError}
      >
        {activeTab === 'dashboard' ? (
          <DashboardView
            habits={habits}
            logsByKey={logsByKey}
            todayKey={todayKey}
            selectedDateKey={selectedDateKey}
            searchQuery={searchQuery}
            dataLoading={dataLoading}
            notificationPermission={notificationPermission}
            dueAlerts={dueAlerts}
            onSelectDate={setSelectedDateKey}
            onLogValue={logHabitValue}
            onOpenNewHabit={handleOpenNewHabit}
            onEditHabit={handleEditHabit}
            onLoadStarterRoutine={loadStarterRoutine}
            onClearSearch={() => setSearchQuery('')}
            onRequestNotificationPermission={requestNotificationPermission}
            onSendTestNotification={sendTestNotification}
            onDismissDueAlert={dismissDueAlert}
          />
        ) : (
          <HabitsManagerView
            habits={habits}
            logsByKey={logsByKey}
            todayKey={todayKey}
            searchQuery={searchQuery}
            onOpenNewHabit={handleOpenNewHabit}
            onEditHabit={handleEditHabit}
            onToggleArchive={setHabitArchived}
            onDeleteHabit={deleteHabit}
          />
        )}
      </AppShell>

      <HabitFormModal
        isOpen={modalOpen}
        editingHabit={editingHabit}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={requestNotificationPermission}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HabitTrackerWorkspace />
      <OfflineIndicator />
    </ErrorBoundary>
  );
}
