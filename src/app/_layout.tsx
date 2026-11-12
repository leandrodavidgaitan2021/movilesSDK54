// src/app/_layout.tsx
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
// Importamos la función correcta desde tu archivo db.ts
import { inicializarBaseDeDatosLocal } from "../servicios/db"; 

export default function RootLayout() {
  return (
    <SQLiteProvider 
      databaseName="colon_turismo.db" 
      onInit={inicializarBaseDeDatosLocal}
    >
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
    </SQLiteProvider>
  );
}