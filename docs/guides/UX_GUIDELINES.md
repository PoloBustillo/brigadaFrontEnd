# 📱 UX Guidelines - Brigada Digital

## 🎯 Principios de Diseño

### 1. **Un Solo CTA por Pantalla** 🎯

- Cada pantalla debe tener **una acción principal clara**
- El CTA debe ser visible y destacado
- CTAs secundarios en estilo outline o text

### 2. **Inputs Grandes** 📝

- Mínimo: **56px de altura**
- Padding interno: **16px horizontal, 18px vertical**
- Border radius: **12-16px**
- Font size: **16-18px** (evita zoom en iOS)

### 3. **Feedback Inmediato** ⚡

- Validación en tiempo real
- Estados visuales claros (loading, success, error)
- Animaciones suaves (200-300ms)
- Mensajes de error contextuales

---

## 📊 Sistema de Colores

```typescript
export const colors = {
  // Brand
  primary: "#FF1B8D", // Rosa principal
  primaryLight: "#FF6B9D", // Rosa claro
  primaryDark: "#D01670", // Rosa oscuro

  // Feedback
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",

  // Neutrales
  background: "#F5F7FA",
  surface: "#FFFFFF",
  border: "#E0E4E8",
  text: "#1A1A2E",
  textSecondary: "#6C7A89",
  textDisabled: "#BDC3C7",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.5)",
  backdrop: "rgba(0, 0, 0, 0.3)",
};
```

---

## 🎨 Tipografía

```typescript
export const typography = {
  // Headings
  h1: { fontSize: 32, fontWeight: "700", lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "700", lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "600", lineHeight: 28 },

  // Body
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  bodyLarge: { fontSize: 18, fontWeight: "400", lineHeight: 26 },
  bodySmall: { fontSize: 14, fontWeight: "400", lineHeight: 20 },

  // Buttons
  button: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
  buttonSmall: { fontSize: 16, fontWeight: "600", lineHeight: 20 },

  // Inputs
  input: { fontSize: 17, fontWeight: "400", lineHeight: 24 },
  label: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  helper: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
};
```

---

## 📏 Espaciado

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

---

## 🔘 Componentes Base

### **Button - CTA Principal**

```typescript
<TouchableOpacity style={styles.primaryButton}>
  <Text style={styles.buttonText}>Iniciar sesión</Text>
</TouchableOpacity>

styles = {
  primaryButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  }
}
```

### **Input Grande**

```typescript
<View style={styles.inputContainer}>
  <Text style={styles.label}>Correo electrónico</Text>
  <TextInput
    style={[styles.input, isFocused && styles.inputFocused]}
    placeholder="tu@email.com"
    placeholderTextColor={colors.textDisabled}
  />
  {error && (
    <Text style={styles.errorText}>❌ {error}</Text>
  )}
</View>

styles = {
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 17, // Importante: evita zoom en iOS
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorText: {
    ...typography.helper,
    color: colors.error,
    marginTop: spacing.xs,
  }
}
```

---

## 🎬 Animaciones

### **Loading Button**

```typescript
const [loading, setLoading] = useState(false);
const spinValue = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (loading) {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }
}, [loading]);

<TouchableOpacity
  style={[styles.primaryButton, loading && styles.buttonLoading]}
  disabled={loading}
>
  {loading ? (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Ionicons name="sync" size={24} color="#FFF" />
    </Animated.View>
  ) : (
    <Text style={styles.buttonText}>Iniciar sesión</Text>
  )}
</TouchableOpacity>
```

### **Error Shake**

```typescript
const shakeAnimation = useRef(new Animated.Value(0)).current;

const shake = () => {
  Animated.sequence([
    Animated.timing(shakeAnimation, { toValue: 10, duration: 100 }),
    Animated.timing(shakeAnimation, { toValue: -10, duration: 100 }),
    Animated.timing(shakeAnimation, { toValue: 10, duration: 100 }),
    Animated.timing(shakeAnimation, { toValue: 0, duration: 100 }),
  ]).start();
};
```

---

## 📱 Estados del Input

### **Estados Visuales**

1. **Default**: Border gris, sin sombra
2. **Focus**: Border primary, sombra suave
3. **Filled**: Background ligeramente más oscuro
4. **Error**: Border rojo, texto de error visible
5. **Success**: Border verde, ícono de check
6. **Disabled**: Opacidad 0.5, cursor not-allowed

---

## ⚡ Validación en Tiempo Real

```typescript
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const [email, setEmail] = useState("");
const [emailError, setEmailError] = useState("");

const handleEmailChange = (text: string) => {
  setEmail(text);

  // Validación inmediata
  if (text.length > 0 && !validateEmail(text)) {
    setEmailError("Formato de email inválido");
  } else {
    setEmailError("");
  }
};
```

---

## 🎯 Reglas de Oro

### **DO's ✅**

- ✅ Validar en tiempo real (después de 1er blur)
- ✅ Mostrar loading durante peticiones
- ✅ Feedback inmediato en cada acción
- ✅ Inputs grandes (56px mínimo)
- ✅ Un CTA principal por pantalla
- ✅ Labels claros y descriptivos
- ✅ Placeholders como ejemplos
- ✅ Animaciones suaves (200-300ms)
- ✅ Estados disabled visibles
- ✅ Mensajes de error específicos

### **DON'Ts ❌**

- ❌ Validar en cada keystroke (molesto)
- ❌ Inputs pequeños (<48px)
- ❌ Múltiples CTAs del mismo peso
- ❌ Animaciones lentas (>500ms)
- ❌ Mensajes de error genéricos
- ❌ Placeholders como labels
- ❌ Font size <16px en inputs (zoom iOS)
- ❌ Botones sin estados de loading
- ❌ Acciones sin confirmación
- ❌ Navegación sin transiciones

---

## 📐 Layout Patterns

### **Form Layout**

```
┌─────────────────────────────┐
│                             │
│      [Logo/Title]           │  ← 48px padding
│                             │
│   ┌─────────────────────┐   │
│   │ Label               │   │  ← 14px label
│   │ ┌─────────────────┐ │   │
│   │ │ Input (56px)    │ │   │  ← 56px input
│   │ └─────────────────┘ │   │
│   │ ❌ Error message    │   │  ← 12px helper
│   └─────────────────────┘   │
│                             │  ← 16px gap
│   ┌─────────────────────┐   │
│   │ Label               │   │
│   │ ┌─────────────────┐ │   │
│   │ │ Input (56px)    │ │   │
│   │ └─────────────────┘ │   │
│   └─────────────────────┘   │
│                             │  ← 32px gap
│   ┌─────────────────────┐   │
│   │   CTA Button (56px) │   │  ← Primario
│   └─────────────────────┘   │
│                             │  ← 16px gap
│      Secondary Action       │  ← Texto/Link
│                             │
└─────────────────────────────┘
```

---

## 🎨 Visual Hierarchy

### **Peso Visual**

1. **CTA Principal**: Color primary, sombra, 56px
2. **Inputs**: 56px, borde sutil
3. **Labels**: 14px, semi-bold
4. **Helpers**: 12px, regular
5. **Links**: 16px, primary color, sin fondo

---

## 🔄 Estados de Carga

### **Skeleton Loader**

```typescript
<View style={styles.skeleton}>
  <Animated.View style={[styles.skeletonShimmer, { opacity: shimmer }]} />
</View>

// Animación shimmer
Animated.loop(
  Animated.sequence([
    Animated.timing(shimmer, { toValue: 1, duration: 1000 }),
    Animated.timing(shimmer, { toValue: 0.3, duration: 1000 }),
  ])
).start();
```

---

## 📱 Responsive

### **Breakpoints**

```typescript
const isSmallDevice = Dimensions.get("window").width < 375;
const isMediumDevice = Dimensions.get("window").width < 768;

// Ajustar spacing
const adaptiveSpacing = isSmallDevice ? spacing.md : spacing.lg;

// Ajustar font sizes
const adaptiveFontSize = isSmallDevice ? 16 : 18;
```

---

## ♿ Accesibilidad

### **Contraste Mínimo**

- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

### **Touch Targets**

- Mínimo: **48x48px**
- Recomendado: **56x56px**
- Spacing entre targets: **8px mínimo**

### **Screen Readers**

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Iniciar sesión"
  accessibilityHint="Toca para iniciar sesión con tu cuenta"
  accessibilityRole="button"
>
  <Text>Iniciar sesión</Text>
</TouchableOpacity>
```

---

## 🎯 Checklist por Pantalla

### **Login Screen**

- [ ] Logo visible (32-48px padding top)
- [ ] Título claro ("Iniciar sesión")
- [ ] Email input (56px)
- [ ] Password input (56px)
- [ ] Toggle password visibility
- [ ] Un CTA principal ("Iniciar sesión")
- [ ] Link secundario ("¿Olvidaste tu contraseña?")
- [ ] Validación en tiempo real
- [ ] Estado de loading
- [ ] Manejo de errores visible

### **Profile Screen**

- [ ] Avatar circular (80-120px)
- [ ] Nombre del usuario (24px, bold)
- [ ] Subtítulo/rol (16px, secondary)
- [ ] Cards de información con sombra
- [ ] CTAs secundarios (outline)
- [ ] Bottom navigation visible
- [ ] Pull to refresh
- [ ] Skeleton loading

---

## 🚀 Performance

### **Optimizaciones**

- ✅ useNativeDriver en todas las animaciones
- ✅ Debounce en validaciones (300ms)
- ✅ Memoize componentes pesados
- ✅ Lazy load de imágenes
- ✅ Throttle en scroll events
- ✅ Cache de requests comunes

---

## 📊 Métricas de Éxito

### **UX Metrics**

- Time to Interactive: <3s
- First Input Delay: <100ms
- Form completion rate: >80%
- Error rate: <5%
- User satisfaction: >4.5/5

---

## 🎨 Inspiración

### **Referencias de Diseño**

- Lemonade (Insurance)
- N26 (Banking)
- Duolingo (Education)
- Airbnb (Travel)
- Notion (Productivity)

---

**Próximos pasos:**

1. Implementar componentes base
2. Crear pantallas siguiendo guidelines
3. Test de usabilidad
4. Iterar basado en feedback

🎯 **Objetivo: UX de 5 estrellas** ⭐⭐⭐⭐⭐
