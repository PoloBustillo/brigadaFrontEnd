# 📱 Propuesta de Pantallas - Brigada Digital

## 🎯 Flujo de la Aplicación

```
Splash Screen
    ↓
¿Tiene sesión?
    ├─ NO → Login Screen
    │        ↓
    │   Auth Success → Role Selection (si aplica)
    │                       ↓
    │                   Home Screen
    └─ SÍ → Home Screen
```

---

## 1. 🚀 Splash Screen

**Ya implementado** ✅ - Ver `SPLASH_ENHANCED_PRO.md`

---

## 2. 🔐 Login Screen

### **Wireframe**

```
┌─────────────────────────────┐
│                             │
│                             │  ← 80px padding top
│      brigadaDigital         │  ← Logo/Brand (52px)
│                             │
│     Inicia sesión para      │  ← Título (24px)
│    acceder a tu cuenta      │
│                             │  ← 48px padding
│                             │
│   ┌─────────────────────┐   │
│   │ 📧 Correo           │   │  ← Label (14px, bold)
│   │ ┌─────────────────┐ │   │
│   │ │ tu@email.com    │ │   │  ← Input (56px)
│   │ └─────────────────┘ │   │
│   └─────────────────────┘   │
│                             │  ← 16px gap
│   ┌─────────────────────┐   │
│   │ 🔒 Contraseña       │   │
│   │ ┌─────────────────┐ │   │
│   │ │ ••••••••••  👁  │ │   │  ← Input con toggle
│   │ └─────────────────┘ │   │
│   └─────────────────────┘   │
│                             │  ← 24px gap
│   ┌─────────────────────┐   │
│   │   INICIAR SESIÓN    │   │  ← CTA (56px, primary)
│   └─────────────────────┘   │
│                             │  ← 16px gap
│   ¿Olvidaste tu contraseña? │  ← Link secundario
│                             │
│                             │
│      v1.0.0 • 📶 WiFi       │  ← Footer
└─────────────────────────────┘
```

### **Estados**

#### **Default**

- Inputs vacíos
- CTA habilitado (pero gris hasta validación)
- Labels visibles
- Sin errores

#### **Typing**

- Input focused con borde primary
- Validación en tiempo real (después del primer blur)
- CTA cambia a primary cuando formulario válido

#### **Loading**

```
┌─────────────────────────────┐
│   ┌─────────────────────┐   │
│   │     🔄 Validando    │   │  ← Button con spinner
│   └─────────────────────┘   │
```

#### **Error**

```
┌─────────────────────────────┐
│   ┌─────────────────────┐   │
│   │ 📧 Correo           │   │
│   │ ┌─────────────────┐ │   │
│   │ │ invalido@.com   │ │   │  ← Border rojo
│   │ └─────────────────┘ │   │
│   │ ❌ Email inválido   │   │  ← Mensaje error
│   └─────────────────────┘   │
```

### **Código Base**

```typescript
import { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleLogin = async () => {
    // Validar
    if (!validateEmail(email)) {
      setEmailError('Formato de email inválido');
      shake();
      return;
    }

    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      shake();
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar login real
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navegar a role selection o home
      // navigation.navigate('RoleSelection');
    } catch (error) {
      setEmailError('Usuario o contraseña incorrectos');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const isFormValid = email.length > 0 && password.length >= 6 && !emailError;

  return (
    <LinearGradient
      colors={['#F5F7FA', '#FFFFFF']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>brigadaDigital</Text>

        {/* Título */}
        <Text style={styles.title}>Inicia sesión para</Text>
        <Text style={styles.subtitle}>acceder a tu cuenta</Text>

        {/* Email Input */}
        <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.label}>📧 Correo electrónico</Text>
          <TextInput
            style={[
              styles.input,
              emailFocused && styles.inputFocused,
              emailError && styles.inputError,
            ]}
            placeholder="tu@email.com"
            placeholderTextColor="#BDC3C7"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            onBlur={() => {
              setEmailFocused(false);
              if (email.length > 0 && !validateEmail(email)) {
                setEmailError('Formato de email inválido');
              }
            }}
            onFocus={() => setEmailFocused(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {emailError && (
            <Text style={styles.errorText}>❌ {emailError}</Text>
          )}
        </Animated.View>

        {/* Password Input */}
        <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.label}>🔒 Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                passwordFocused && styles.inputFocused,
                passwordError && styles.inputError,
              ]}
              placeholder="••••••••"
              placeholderTextColor="#BDC3C7"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              onBlur={() => setPasswordFocused(false)}
              onFocus={() => setPasswordFocused(true)}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#6C7A89"
              />
            </TouchableOpacity>
          </View>
          {passwordError && (
            <Text style={styles.errorText}>❌ {passwordError}</Text>
          )}
        </Animated.View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !isFormValid && styles.buttonDisabled,
            loading && styles.buttonLoading,
          ]}
          onPress={handleLogin}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="sync" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Validando...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
          )}
        </TouchableOpacity>

        {/* Link Secundario */}
        <TouchableOpacity onPress={() => {/* TODO: Navigate to forgot password */}}>
          <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0 • 📶 WiFi</Text>
      </View>
    </LinearGradient>
  );
}
```

---

## 3. 👤 Role Selection Screen

**Se muestra solo si el usuario tiene múltiples roles**

### **Wireframe**

```
┌─────────────────────────────┐
│                             │
│      brigadaDigital         │  ← Logo pequeño
│                             │
│    Selecciona tu rol        │  ← Título (24px)
│                             │  ← 32px padding
│                             │
│   ┌─────────────────────┐   │
│   │  👮 Brigadista      │   │  ← Card seleccionable
│   │                     │   │     (80px height)
│   │  Realizar encuestas │   │
│   └─────────────────────┘   │
│                             │  ← 16px gap
│   ┌─────────────────────┐   │
│   │  👔 Supervisor      │   │
│   │                     │   │
│   │  Revisar y aprobar  │   │
│   └─────────────────────┘   │
│                             │  ← 16px gap
│   ┌─────────────────────┐   │
│   │  📊 Administrador   │   │
│   │                     │   │
│   │  Gestionar sistema  │   │
│   └─────────────────────┘   │
│                             │  ← 32px gap
│   ┌─────────────────────┐   │
│   │     CONTINUAR       │   │  ← CTA (disabled hasta selección)
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

### **Estados**

#### **Sin Selección**

- Cards con borde gris
- CTA disabled

#### **Con Selección**

```
┌─────────────────────────────┐
│   ┌─────────────────────┐   │
│   │  ✅ 👮 Brigadista   │   │  ← Border primary, check
│   │                     │   │     Background primary 10%
│   │  Realizar encuestas │   │
│   └─────────────────────┘   │
```

---

## 4. 🏠 Home Screen

### **Wireframe (Sin Datos)**

```
┌─────────────────────────────┐
│  [Avatar] Hola, Usuario  [⚙]│  ← Header (56px)
├─────────────────────────────┤
│                             │
│    📊 Panel Principal       │
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   🗂️ No tienes      │   │  ← Empty state
│   │   encuestas aún     │   │
│   │                     │   │
│   │   ┌─────────────┐   │   │
│   │   │   CREAR     │   │   │  ← CTA único
│   │   └─────────────┘   │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│                             │
└─────────────────────────────┘
│ 🏠  📊  📋  👤 │  ← Bottom nav
└─────────────────────────────┘
```

### **Wireframe (Con Datos)**

```
┌─────────────────────────────┐
│  [👤] Hola, Juan  [⚙️] [🔔3]│  ← Header sticky
├─────────────────────────────┤
│                             │
│   📊 Mis Encuestas          │  ← Sección
│                             │
│   ┌─────────────────────┐   │
│   │ 📝 Censo 2024       │   │  ← Card (120px)
│   │ En progreso         │   │
│   │ ▓▓▓▓▓▓░░░░ 60%      │   │  ← Progress
│   │                     │   │
│   │  [Continuar →]      │   │  ← CTA secundario
│   └─────────────────────┘   │
│                             │  ← 16px gap
│   ┌─────────────────────┐   │
│   │ ✅ Encuesta Social  │   │
│   │ Completada          │   │
│   │ 15 respuestas       │   │
│   │                     │   │
│   │  [Ver detalles]     │   │
│   └─────────────────────┘   │
│                             │
│   📈 Estadísticas           │  ← Otra sección
│                             │
│   ┌──────┬──────┬──────┐   │
│   │  15  │  8   │ 92%  │   │  ← Stats cards
│   │Total │Pend. │Éxito │   │
│   └──────┴──────┴──────┘   │
│                             │
├─────────────────────────────┤
│ 🏠  📊  📋  👤 │  ← Bottom nav
└─────────────────────────────┘
```

---

## 5. 👤 Profile Screen (Referencia de la imagen)

### **Wireframe**

```
┌─────────────────────────────┐
│   Mi perfil           [✏️]  │  ← Header con edit
│                             │
│        ┌─────────┐          │
│        │         │          │  ← Avatar (120px)
│        │  [👤]   │          │
│        │         │          │
│        └─────────┘          │
│                             │
│     Nombre Apellido         │  ← 20px, bold
│  4 años de experiencia      │  ← 14px, secondary
│                             │
│  ┌─────────┐  ┌─────────┐  │
│  │ CV 2.3Mb│  │ Contact │  │  ← CTAs secundarios
│  └─────────┘  └─────────┘  │
│                             │  ← 24px padding
│  Acerca de                  │  ← Sección
│  ┌─────────────────────┐   │
│  │ Brigadista digital  │   │  ← Card con descripción
│  │ con experiencia en  │   │
│  │ censos y encuestas  │   │
│  └─────────────────────┘   │
│                             │
│  Experiencia laboral        │
│  ┌─────────────────────┐   │
│  │ [🏢] INEGI          │   │
│  │ 2024 - Presente     │   │
│  │ Brigadista digital  │   │
│  │                 [⋮] │   │  ← Menu
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ [💼] Freelance      │   │
│  │ 2022 - 2024         │   │
│  │ Encuestador         │   │
│  │                 [⋮] │   │
│  └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│ 🏠  🔍  💾  👤 │  ← Bottom nav
└─────────────────────────────┘
```

---

## 6. ⚠️ Error Offline Screen

### **Wireframe**

```
┌─────────────────────────────┐
│                             │
│                             │
│        ┌─────────┐          │
│        │         │          │
│        │  ☁️❌   │          │  ← Ícono grande
│        │         │          │
│        └─────────┘          │
│                             │
│    Sin conexión a internet  │  ← Título (24px)
│                             │
│  No podemos conectarnos     │  ← Descripción
│  a nuestros servidores.     │
│  Verifica tu conexión.      │
│                             │
│                             │
│   ┌─────────────────────┐   │
│   │   REINTENTAR  🔄    │   │  ← CTA único
│   └─────────────────────┘   │
│                             │
│   Trabajar sin conexión     │  ← Link secundario
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

### **Código Base**

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      onRetry();
    } else {
      // Mostrar toast: "Aún sin conexión"
    }

    setRetrying(false);
  };

  return (
    <View style={styles.container}>
      {/* Ícono */}
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-offline" size={120} color="#FF5722" />
      </View>

      {/* Título */}
      <Text style={styles.title}>Sin conexión a internet</Text>

      {/* Descripción */}
      <Text style={styles.description}>
        No podemos conectarnos a nuestros servidores.{'\n'}
        Verifica tu conexión WiFi o datos móviles.
      </Text>

      {/* CTA */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleRetry}
        disabled={retrying}
      >
        <Text style={styles.buttonText}>
          REINTENTAR {retrying && '🔄'}
        </Text>
      </TouchableOpacity>

      {/* Link secundario */}
      <TouchableOpacity onPress={() => {/* Navigate to offline mode */}}>
        <Text style={styles.linkText}>Trabajar sin conexión</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 📊 Resumen de Componentes

| Pantalla       | CTA Principal  | CTA Secundario   | Estado Especial |
| -------------- | -------------- | ---------------- | --------------- |
| Login          | INICIAR SESIÓN | ¿Olvidaste...?   | Loading, Error  |
| Role Selection | CONTINUAR      | -                | Selected state  |
| Home (empty)   | CREAR ENCUESTA | -                | Empty state     |
| Home (data)    | -              | Multiple cards   | Pull to refresh |
| Profile        | -              | CV, Contact      | Edit mode       |
| Offline        | REINTENTAR     | Trabajar offline | Checking...     |

---

## 🎨 Estilos Compartidos

```typescript
export const sharedStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  // Typography
  logo: {
    fontFamily: "Pacifico",
    fontSize: 48,
    color: "#FF1B8D",
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6C7A89",
    textAlign: "center",
    marginBottom: 48,
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E4E8",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#1A1A2E",
  },
  inputFocused: {
    borderColor: "#FF1B8D",
    shadowColor: "#FF1B8D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inputError: {
    borderColor: "#F44336",
  },
  errorText: {
    fontSize: 12,
    color: "#F44336",
    marginTop: 4,
  },

  // Button
  primaryButton: {
    height: 56,
    backgroundColor: "#FF1B8D",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#FF1B8D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#BDC3C7",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  linkText: {
    fontSize: 16,
    color: "#FF1B8D",
    textAlign: "center",
    marginTop: 16,
  },

  // Footer
  footer: {
    padding: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6C7A89",
  },
});
```

---

## 🔄 Navegación

```typescript
// Navigation Stack
<Stack.Navigator>
  <Stack.Screen name="Splash" component={SplashScreen} />
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="Profile" component={ProfileScreen} />
  <Stack.Screen name="Offline" component={OfflineScreen} />
</Stack.Navigator>
```

---

## ✅ Checklist de Implementación

- [ ] Crear componentes base (Button, Input, Card)
- [ ] Implementar LoginScreen
- [ ] Implementar RoleSelectionScreen
- [ ] Implementar HomeScreen (empty + data)
- [ ] Implementar ProfileScreen
- [ ] Implementar OfflineScreen
- [ ] Conectar con API real
- [ ] Agregar validaciones
- [ ] Test de usabilidad
- [ ] Optimizar performance
- [ ] Agregar analytics

---

**🎯 Próximo paso:** Crear los componentes base reutilizables.
