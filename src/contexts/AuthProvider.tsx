import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth } from '@/config/firebase';
import { useUser } from '@/hooks/useAppData';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      }),
    [],
  );

  // The role is carried by the Firestore profile; a deactivated account has no role.
  const { data: profile, loading: profileLoading } = useUser(firebaseUser?.uid);
  const role = profile?.active ? profile.role : null;

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  const sendPasswordReset = useCallback((email: string) => sendPasswordResetEmail(auth, email.trim()), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      role,
      isAdmin: role === 'admin',
      isStaff: role === 'admin' || role === 'trainer',
      loading: authLoading || (firebaseUser !== null && profileLoading),
      signIn,
      signOut,
      sendPasswordReset,
    }),
    [firebaseUser, profile, role, authLoading, profileLoading, signIn, signOut, sendPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
