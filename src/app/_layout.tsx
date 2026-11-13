import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { AuthProvider } from "../context/AuthContext";
import { LocationProvider } from "../context/LocationContext";
import { ThemeProvider } from "../context/ThemeContext";
import { inicializarBaseDeDatosLocal } from "../servicios/db";

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="colon_turismo.db"
      onInit={inicializarBaseDeDatosLocal}
    >
      <ThemeProvider>
        <LocationProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" options={{ presentation: "card" }} />
              <Stack.Screen name="register" options={{ presentation: "card" }} />
              <Stack.Screen name="lugar/[id]" />
              <Stack.Screen name="evento/[id]" />
              <Stack.Screen name="favoritos" />
              <Stack.Screen
                name="escanear"
                options={{ presentation: "fullScreenModal" }}
              />
            </Stack>
          </AuthProvider>
        </LocationProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}