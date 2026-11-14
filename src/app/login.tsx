// src/app/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
import { apiIngresar } from "../servicios/auth";

// Al ingresar solo se exige que los campos no estén vacíos: las reglas de
// largo y número corresponden al registro, y la API ya valida las credenciales.
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { login } = useAuth();
  const { colors } = useTheme();
  
  // Estado para controlar la visibilidad de la contraseña (el "ojito")
  const [showPassword, setShowPassword] = useState(false);

  const {
    disponible: hayBiometria,
    sensor,
    activa,
    entrar: entrarConBiometria,
    activar,
    actualizar,
  } = useLoginBiometrico();

  const irAlDestino = () => {
    router.replace((redirect ?? "/(tabs)/perfil") as any);
  };

  const handleLoginBiometrico = async () => {
    const exito = await entrarConBiometria();
    if (exito) irAlDestino();
  };

  // Pregunta si quiere activar la huella y espera la respuesta antes de seguir
  const ofrecerActivar = (email: string, token: string) =>
    new Promise<void>((resolver) => {
      Alert.alert(
        "Ingreso con huella",
        "¿Querés ingresar con tu huella o rostro la próxima vez?",
        [
          { text: "Ahora no", style: "cancel", onPress: () => resolver() },
          {
            text: "Activar",
            onPress: async () => {
              await activar(email, token);
              resolver();
            },
          },
        ],
        { cancelable: false },
      );
    });

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
      const { email } = respuesta.usuario;

      // Guardamos el email del objeto usuario y el token recibido
      await login(email, respuesta.token);

      // Si la huella ya estaba activada para esta cuenta, renovamos su token;
      // si no, y el celular lo permite, ofrecemos activarla.
      await actualizar(email, respuesta.token);
      if (sensor && !activa) {
        await ofrecerActivar(email, respuesta.token);
      }

      irAlDestino();
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

        {/* Input de Contraseña con el Ojito integrado */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="Contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel="Mostrar u ocultar contraseña"
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
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
            <Text style={[styles.biometriaButtonText, { color: colors.primary }]}>
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 5,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 14,
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