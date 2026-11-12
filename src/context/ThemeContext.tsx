// src/context/ThemeContext.tsx
import { createContext, ReactNode, useEffect, useState } from "react";
import { Appearance, useColorScheme } from "react-native";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
}

// Paletas de colores para cada modo
const colorPalettes = {
  light: {
    background: "#f8f9fa",
    card: "#ffffff",
    text: "#2c3e50",
    textSecondary: "#7f8c8d",
    primary: "#27ae60",
    border: "#e0e0e0",
  },
  dark: {
    background: "#121212",
    card: "#1e1e1e",
    text: "#ecf0f1",
    textSecondary: "#95a5a6",
    primary: "#2ecc71",
    border: "#2c2c2c",
  },
};

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useColorScheme();

  // Inicializamos el estado asegurando que solo devuelva "dark" o "light"
  const [theme, setTheme] = useState<ThemeType>(() => {
    const initialScheme = Appearance.getColorScheme();
    return initialScheme === "dark" ? "dark" : "light";
  });

  // Sincronizar de forma segura si cambia el tema del sistema operativo
  useEffect(() => {
    if (deviceColorScheme === "dark" || deviceColorScheme === "light") {
      setTheme(deviceColorScheme);
    }
  }, [deviceColorScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const colors = colorPalettes[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
