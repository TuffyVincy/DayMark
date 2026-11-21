import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  buildHabitCreatePayload,
  buildHabitLogPayload,
  buildHabitUpdatePayload,
  buildUserProfileCreatePayload,
  buildUserProfileUpdatePayload,
  generateHabitId,
  Habit,
  HabitDraft,
  HabitLog,
  validateHabitDraft,
} from '../lib/blueprint';
import { STARTER_HABITS } from '../lib/categories';
import { toDateKey } from '../lib/dates';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export function useHabitTracker() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      setFatalError(null);

      if (!nextUser) {
        setProfileReady(false);
        setHabits([]);
        setLogs([]);
        setDataLoading(false);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(false);
      setDataLoading(true);
      setProfileReady(false);

      const userPath = `users/${nextUser.uid}`;
      try {
        const userRef = doc(db, 'users', nextUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(
            userRef,
            buildUserProfileCreatePayload({
              uid: nextUser.uid,
              displayName: nextUser.displayName,
              email: nextUser.email,
              photoURL: nextUser.photoURL,
            })
          );
        } else {
          const existing = snap.data();
          const nextName =
            nextUser.displayName?.trim() || nextUser.email?.split('@')[0] || 'Daymark User';
          const nextEmail = nextUser.email?.trim() || 'user@example.com';
          const nextPhoto = nextUser.photoURL?.trim() || '';

          if (
            existing.displayName !== nextName ||
            existing.email !== nextEmail ||
            existing.photoURL !== nextPhoto
          ) {
            await updateDoc(
              userRef,
              buildUserProfileUpdatePayload({
                displayName: nextUser.displayName,
                email: nextUser.email,
                photoURL: nextUser.photoURL,
              })
            );
          }
        }
        setProfileReady(true);
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, userPath);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
          setDataLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !profileReady) {
      return undefined;
    }

    const uid = user.uid;
    const habitsPath = `users/${uid}/habits`;
    const logsPath = `users/${uid}/logs`;

    let habitsLoaded = false;
    let logsLoaded = false;

    const markReady = () => {
      if (habitsLoaded && logsLoaded) {
        setDataLoading(false);
      }
    };

    const habitsQuery = query(collection(db, 'users', uid, 'habits'), where('userId', '==', uid));
    const unsubHabits = onSnapshot(
      habitsQuery,
      (snapshot) => {
        const nextHabits: Habit[] = snapshot.docs.map((d) => d.data() as Habit);
        nextHabits.sort((a, b) => {
          const aTime =
            typeof (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis === 'function'
              ? (a.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          const bTime =
            typeof (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis === 'function'
              ? (b.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          if (aTime !== bTime) return aTime - bTime;
          return a.title.localeCompare(b.title);
        });
        setHabits(nextHabits);
        habitsLoaded = true;
        markReady();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, habitsPath);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
          setDataLoading(false);
        }
      }
    );

    const logsQuery = query(collection(db, 'users', uid, 'logs'), where('userId', '==', uid));
    const unsubLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const nextLogs: HabitLog[] = snapshot.docs.map((d) => d.data() as HabitLog);
        setLogs(nextLogs);
        logsLoaded = true;
        markReady();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, logsPath);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
          setDataLoading(false);
        }
      }
    );

    return () => {
      unsubHabits();
      unsubLogs();
    };
  }, [user, profileReady]);

  const logsByKey = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of logs) {
      map.set(`${log.habitId}_${log.dateKey}`, log);
    }
    return map;
  }, [logs]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('popup-closed-by-user')
          ? 'Sign-in was canceled before completion.'
          : 'Unable to sign in with Google right now. Please try again.';
      setAuthError(message);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setActionError(null);
    try {
      await signOut(auth);
    } catch {
      setActionError('Unable to sign out right now. Please refresh and try again.');
    }
  }, []);

  const createHabit = useCallback(
    async (draft: HabitDraft): Promise<boolean> => {
      if (!user) return false;
      const validationError = validateHabitDraft(draft);
      if (validationError) {
        setActionError(validationError);
        return false;
      }

      setActionError(null);
      const habitId = generateHabitId();
      const path = `users/${user.uid}/habits/${habitId}`;

      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', habitId), buildHabitCreatePayload(user.uid, habitId, draft));
        return true;
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.CREATE, path);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
        return false;
      }
    },
    [user]
  );

  const updateHabit = useCallback(
    async (habitId: string, draft: HabitDraft): Promise<boolean> => {
      if (!user) return false;
      const validationError = validateHabitDraft(draft);
      if (validationError) {
        setActionError(validationError);
        return false;
      }

      setActionError(null);
      const path = `users/${user.uid}/habits/${habitId}`;

      try {
        await updateDoc(doc(db, 'users', user.uid, 'habits', habitId), buildHabitUpdatePayload(draft));
        return true;
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, path);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
        return false;
      }
    },
    [user]
  );

  const setHabitArchived = useCallback(
    async (habitId: string, archived: boolean): Promise<void> => {
      if (!user) return;
      setActionError(null);
      const path = `users/${user.uid}/habits/${habitId}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'habits', habitId), {
          archived,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.UPDATE, path);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    },
    [user]
  );

  const deleteHabit = useCallback(
    async (habitId: string): Promise<void> => {
      if (!user) return;
      setActionError(null);
      const path = `users/${user.uid}/habits/${habitId}`;
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', user.uid, 'habits', habitId));
        for (const log of logs) {
          if (log.habitId === habitId) {
            batch.delete(doc(db, 'users', user.uid, 'logs', log.id));
          }
        }
        await batch.commit();
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.DELETE, path);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    },
    [user, logs]
  );

  const logHabitValue = useCallback(
    async (habit: Habit, dateKey: string, nextValue: number): Promise<void> => {
      if (!user) return;
      setActionError(null);
      const logId = `${habit.id}_${dateKey}`;
      const path = `users/${user.uid}/logs/${logId}`;

      try {
        const payload = buildHabitLogPayload({
          userId: user.uid,
          habit,
          dateKey,
          nextValue,
        });
        await setDoc(doc(db, 'users', user.uid, 'logs', logId), payload);
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    },
    [user]
  );

  const loadStarterRoutine = useCallback(async (): Promise<void> => {
    if (!user) return;
    setActionError(null);
    const path = `users/${user.uid}/habits`;
    try {
      const batch = writeBatch(db);
      for (const draft of STARTER_HABITS) {
        const habitId = generateHabitId();
        batch.set(
          doc(db, 'users', user.uid, 'habits', habitId),
          buildHabitCreatePayload(user.uid, habitId, draft)
        );
      }
      await batch.commit();
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  }, [user]);

  return {
    user,
    authLoading,
    dataLoading,
    habits,
    logs,
    logsByKey,
    todayKey,
    fatalError,
    actionError,
    authError,
    clearActionError: () => setActionError(null),
    signInWithGoogle,
    signOutUser,
    createHabit,
    updateHabit,
    setHabitArchived,
    deleteHabit,
    logHabitValue,
    loadStarterRoutine,
  };
}
