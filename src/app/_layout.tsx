import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { LocationProvider } from "../context/LocationContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />

            <Stack.Screen name="login" options={{ presentation: "card" }} />
            <Stack.Screen name="lugar/[id]" />
            <Stack.Screen
              name="escanear"
              options={{ presentation: "fullScreenModal" }}
            />
          </Stack>
        </AuthProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}
