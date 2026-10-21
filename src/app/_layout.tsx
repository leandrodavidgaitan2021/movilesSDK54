// src/app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext"; // <-- Importamos

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* La ruta de pestañas debe ser la primera para que abra de inicio */}
          <Stack.Screen name="(tabs)" />

          {/* Pantallas secundarias o modales */}
          <Stack.Screen name="login" options={{ presentation: "card" }} />
          <Stack.Screen name="lugar/[id]" />
          <Stack.Screen
            name="escanear"
            options={{ presentation: "fullScreenModal" }}
          />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
