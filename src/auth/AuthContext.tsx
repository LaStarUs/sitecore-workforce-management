import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { authenticate, type User } from './permissions';

interface AuthValue {
  user: User | null;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);
const SESSION_KEY = 'siteready:user';

function readSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(() => (initialUser !== undefined ? initialUser : readSession()));

  const signIn = useCallback((username: string, password: string) => {
    const found = authenticate(username, password);
    if (!found) return false;
    setUser(found);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(found));
    } catch {
      /* session storage unavailable: stay signed in for this page view only */
    }
    return true;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** For screens behind the sign-in gate, where a user is guaranteed. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useUser called without a signed-in user');
  return user;
}
