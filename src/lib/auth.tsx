import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string;
  isAdmin: boolean;
  fullName: string;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("user");
  const [fullName, setFullName] = useState<string>("");

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("user_id", userId)
      .single();
    if (data) {
      setRole(data.role || "user");
      setFullName(data.full_name || "");
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer profile fetch to avoid Supabase deadlock
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setRole("user");
        setFullName("");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole("user");
    setFullName("");
  };

  const deleteAccount = async () => {
    if (!user) return { error: new Error("Not authenticated") };
    // Delete all user data (cascades will handle cards, QR codes, scan logs)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);
    if (profileError) return { error: profileError as Error };

    // Sign out (account cleanup is handled by cascade)
    await supabase.auth.signOut();
    setRole("user");
    setFullName("");
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, role, isAdmin: role === "admin",
      fullName, signUp, signIn, signOut, deleteAccount, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
