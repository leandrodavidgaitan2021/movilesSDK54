// src/app/register.tsx
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
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

const registerSchema = z
  .object({
    nombre: z.string().min(1, "El nombre completo es requerido"),
    email: z
      .string()
      .min(1, "El correo es requerido")
      .email("Correo electrónico inválido")
      .transform((val) => val.trim().toLowerCase()),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Debes confirmar tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleRegister = async (data: RegisterFormData) => {
    try {
      const tokenDelServidor = "jwt_token_generado_por_el_backend_123";

      await SecureStore.setItemAsync("user_token", tokenDelServidor);
      await SecureStore.setItemAsync("user_email", data.email);

      login(data.email, tokenDelServidor);
      alert(`¡Registro exitoso! Bienvenido, ${data.nombre}`);
      router.replace("/(tabs)/perfil");
    } catch (error) {
      console.error("Error al guardar la sesión de registro:", error);
      alert("Ocurrió un error al guardar las credenciales de forma segura.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.formContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Crear Cuenta</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Regístrate para guardar tu bitácora de viaje en Colón
        </Text>

        {/* Input de Nombre */}
        <Controller
          control={control}
          name="nombre"
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
              placeholder="Nombre completo"
              placeholderTextColor={colors.textSecondary}
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.nombre && (
          <Text style={styles.errorText}>{errors.nombre.message}</Text>
        )}

        {/* Input de Correo con sanitización */}
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

        {/* Input de Contraseña con el Ojito */}
        <View
          style={[
            styles.passwordContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="Contraseña (mínimo 8 caracteres)"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        {/* Input de Confirmar Contraseña con su propio Ojito */}
        <View
          style={[
            styles.passwordContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    color: colors.text,
                  },
                ]}
                placeholder="Repetir contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isSubmitting && { opacity: 0.7 },
          ]}
          onPress={handleSubmit(handleRegister)}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Registrando..." : "Registrarse"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ¿Ya tienes cuenta? Inicia sesión
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
  backButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});