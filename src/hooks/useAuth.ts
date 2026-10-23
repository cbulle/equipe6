import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Returns the signed-in user, for components rendered behind `RequireAuth`. */
export function useCurrentUser() {
  const { firebaseUser, profile } = useAuth();
  if (!firebaseUser || !profile) {
    throw new Error('useCurrentUser must be used behind RequireAuth');
  }
  return { uid: firebaseUser.uid, profile };
}
