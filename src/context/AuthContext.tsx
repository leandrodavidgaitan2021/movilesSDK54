// src/context/AuthContext.tsx
import { createContext, ReactNode, useState } from "react";

interface AuthContextType {
  user: string | null;
  token: string | null; // <-- Agregamos el token al tipo
  isAuthenticated: boolean;
  cargando: boolean;
  login: (email: string, accessToken: string) => Promise<void>; // Recibe el token al iniciar sesión
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null); // <-- Estado en memoria para el token
  const [cargando, setCargando] = useState<boolean>(false);

  const login = async (email: string, accessToken: string) => {
    // Guardamos el usuario y el token exclusivamente en la memoria de la app
    setUser(email);
    setToken(accessToken);
  };

  const logout = async () => {
    // Limpiamos ambos estados de la memoria
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token, // <-- Lo exponemos en el contexto
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