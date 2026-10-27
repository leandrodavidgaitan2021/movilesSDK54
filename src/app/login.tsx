// src/app/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as z from "zod";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useLoginBiometrico } from "../hooks/useLoginBiometrico";
import { apiIngresar } from "../servicios/auth"; // <-- Importamos tu servicio de Axios

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("Correo electrónico inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
//    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { login } = useAuth();
  const { colors } = useTheme();
  const { disponible: hayBiometria, entrar: entrarConBiometria } = useLoginBiometrico();

  const handleLoginBiometrico = async () => {
    const exito = await entrarConBiometria();
    if (!exito) return;
    if (redirect) {
      router.replace(redirect as any);
    } else {
      router.replace("/(tabs)/perfil");
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      const respuesta = await apiIngresar({
        email: data.email,
        contrasena: data.password,
      });

      // Guardamos el email del objeto usuario y el token recibido
      await login(respuesta.usuario.email, respuesta.token);

      if (redirect) {
        router.replace(redirect as any);
      } else {
        router.replace("/(tabs)/perfil");
      }
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      const mensajeError =
        error.response?.status === 401
          ? "Credenciales incorrectas."
          : "No se pudo conectar con el servidor. Verifica tu conexión.";
      Alert.alert("Error de acceso", mensajeError);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.formContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="compass" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Turismo Colón
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Inicia sesión para guardar tu recorrido
        </Text>

        {/* Input de Correo */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        {/* Input de Contraseña */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        {/* Botón de Ingreso */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(handleLogin)}
        >
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>
        
        {hayBiometria && (
          <TouchableOpacity
            style={[styles.biometriaButton, { borderColor: colors.primary }]}
            onPress={handleLoginBiometrico}
            accessibilityLabel="Entrar con huella o rostro"
          >
            <Ionicons name="finger-print" size={20} color={colors.primary} />
            <Text style={[styles.biometriaButtonText, { color: colors.primary}]}>
              Entrar con huella o rostro
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => router.push("/register")}
        >
          <Text style={[styles.guestButtonText, { color: colors.primary }]}>
            ¿No tienes cuenta? Regístrate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text
            style={[styles.guestButtonText, { color: colors.textSecondary }]}
          >
            Continuar como invitado
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  formContainer: {
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 5,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 4,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  guestButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  biometriaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  biometriaButtonText: { fontSize: 16, fontWeight: "bold" },
});