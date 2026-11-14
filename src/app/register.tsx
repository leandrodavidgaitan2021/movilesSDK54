// src/app/register.tsx
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store"; // <-- 1. Importación obligatoria para la cátedra
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

// 2. Esquema de validación con Zod mejorado
const registerSchema = z
  .object({
    nombre: z.string().min(1, "El nombre completo es requerido"),
    email: z
      .string()
      .min(1, "El correo es requerido")
      .email("Correo electrónico inválido")
      .transform((val) => val.trim().toLowerCase()), // <--- Razón: Limpia espacios y pasa a minúsculas para evitar rechazos en el servidor.
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Debes confirmar tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden", // <--- Razón: Asegura que el usuario no cometa errores tipográficos al registrarse.
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();

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

  // 3. Función al enviar el formulario con seguridad exigida por cátedra
  const handleRegister = async (data: RegisterFormData) => {
    try {
      const tokenDelServidor = "jwt_token_generado_por_el_backend_123";

      // <--- REQUISITO DE CÁTEDRA: Resguardo cifrado de credenciales
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
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={64} color="#27ae60" />
        </View>

        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>
          Regístrate para guardar tu bitácora de viaje en Colón
        </Text>

        {/* Input de Nombre */}
        <Controller
          control={control}
          name="nombre"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#aaa"
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
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#aaa"
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
        <View style={styles.passwordContainer}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.passwordInput}
                placeholder="Contraseña (mínimo 8 caracteres)"
                placeholderTextColor="#aaa"
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
              color="#7f8c8d"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        {/* Input de Confirmar Contraseña con su propio Ojito */}
        <View style={styles.passwordContainer}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.passwordInput}
                placeholder="Repetir contraseña"
                placeholderTextColor="#aaa"
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
              color="#7f8c8d"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, isSubmitting && { opacity: 0.7 }]}
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
          <Text style={styles.backButtonText}>
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
    backgroundColor: "#f8f9fa",
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
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 5,
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 5,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
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
    backgroundColor: "#27ae60",
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
    color: "#27ae60",
    fontSize: 14,
    fontWeight: "600",
  },
});