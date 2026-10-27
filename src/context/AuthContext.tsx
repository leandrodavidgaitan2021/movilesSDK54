// src/context/AuthContext.tsx
import { createContext, ReactNode, useState, useEffect } from "react";
import { borrarSesion, guardarSesion, leerSesion } from "../servicios/sesion";

interface AuthContextType {
  user: string | null;
  token: string | null;
  isAuthenticated: boolean;
  cargando: boolean;
  login: (email: string, accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    async function inicializarSesion() {
      try {
        const sesionGuardada = await leerSesion();
        if (sesionGuardada) {
          setUser(sesionGuardada.email);
          setToken(sesionGuardada.token);
        }
      } catch (error) {
        console.error("Error al cargar la sesión inicial:", error);
      } finally {
        setCargando(false);
      }
    }
    inicializarSesion();
  }, []);

  const login = async (email: string, accessToken: string) => {
    setUser(email);
    setToken(accessToken);
    await guardarSesion(email, accessToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await borrarSesion();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        cargando,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

