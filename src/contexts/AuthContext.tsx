import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextData {
  user: User | null;
  authLoading: boolean;
  signIn: (e: string, p: string) => Promise<string>;
  signUp: (e: string, p: string) => Promise<string>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    }).catch(err => {
      console.error("[Auth] Erro ao buscar sessão:", err);
      setAuthLoading(false);
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<string> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error("[Auth] Falha no login:", error);
    return error ? error.message : "";
  };

  const signUp = async (email: string, password: string): Promise<string> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) console.error("[Auth] Falha no cadastro:", error);
    return error ? error.message : "Verifique seu email para confirmar o cadastro!";
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("[Auth] Falha no logout:", error);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
