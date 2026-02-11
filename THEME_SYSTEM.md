# 🌙 Theme System - Modo Claro/Oscuro Integrado

## ✅ Implementación Completada

### Componentes Creados

1. ✅ **ThemeContext** (`contexts/theme-context.tsx`)
   - ThemeProvider para envolver la app
   - Hook `useTheme()` para acceder al tema
   - Hook `useThemeColors()` para obtener colores
   - Persistencia con AsyncStorage
   - Soporte para modo light/dark/auto

2. ✅ **ThemeToggle** (`components/ui/theme-toggle.tsx`)
   - Componente con label completo
   - Versión compacta solo icono (`ThemeToggleIcon`)
   - Animación de rotación al cambiar
   - Animación de escala al presionar

### Integraciones Realizadas

1. ✅ **\_layout.tsx** - ThemeProvider envuelve toda la app
2. ✅ **design-system-examples.tsx** - Demo con theme toggle

---

## 🚀 Cómo Usar el Theme System

### 1. Usar Colores del Tema en Componentes

```tsx
import { useThemeColors } from "@/contexts/theme-context";

function MyComponent() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Este texto se adapta al tema</Text>
      <Text style={{ color: colors.textSecondary }}>Texto secundario</Text>
    </View>
  );
}
```

### 2. Agregar Theme Toggle a Cualquier Pantalla

**Versión con Label:**

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

<ThemeToggle />;
```

**Versión Solo Icono (para headers):**

```tsx
import { ThemeToggleIcon } from "@/components/ui/theme-toggle";

<ThemeToggleIcon />;
```

### 3. Controlar el Tema Programáticamente

```tsx
import { useTheme } from "@/contexts/theme-context";

function SettingsScreen() {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();

  return (
    <View>
      <Text>Tema actual: {theme}</Text>

      {/* Toggle simple */}
      <Button title="Cambiar tema" onPress={toggleTheme} />

      {/* Selector de modo */}
      <Button title="Modo Claro" onPress={() => setThemeMode("light")} />
      <Button title="Modo Oscuro" onPress={() => setThemeMode("dark")} />
      <Button title="Automático" onPress={() => setThemeMode("auto")} />
    </View>
  );
}
```

### 4. Crear Estilos con Tema

**Opción 1: Colores Inline**

```tsx
function MyComponent() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.text, { color: colors.text }]}>Contenido</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
  },
});
```

**Opción 2: Función de Estilos**

```tsx
import { createThemedStyles } from "@/contexts/theme-context";

const getStyles = createThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.background,
    padding: 16,
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
  border: {
    borderColor: colors.border,
    borderWidth: 1,
  },
}));

function MyComponent() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Contenido</Text>
    </View>
  );
}
```

---

## 🎨 Colores Disponibles

### ThemeColors Interface

```typescript
interface ThemeColors {
  // Backgrounds
  background: string; // Fondo principal
  backgroundSecondary: string; // Fondo secundario
  surface: string; // Superficie de cards
  surfaceVariant: string; // Variante de superficie

  // Text
  text: string; // Texto principal
  textSecondary: string; // Texto secundario
  textTertiary: string; // Texto terciario

  // Borders
  border: string; // Borde principal
  borderLight: string; // Borde claro

  // Primary
  primary: string; // Color primario
  primaryLight: string; // Primario claro
  primaryDark: string; // Primario oscuro

  // Status
  success: string; // Verde éxito
  warning: string; // Amarillo advertencia
  error: string; // Rojo error
  info: string; // Azul información

  // Overlays
  overlay: string; // Overlay semi-transparente
  backdrop: string; // Backdrop de modales
}
```

### Modo Light (valores aproximados)

```typescript
{
  background: '#FFFFFF',
  text: '#1F2937',
  primary: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  // ... etc
}
```

### Modo Dark (valores aproximados)

```typescript
{
  background: '#0F172A',
  text: '#F9FAFB',
  primary: '#60A5FA',
  success: '#6EE7B7',
  error: '#FCA5A5',
  // ... etc
}
```

---

## 📱 Integrar en Pantallas Existentes

### Profile Screen

```tsx
// app/profile.tsx
import { useThemeColors } from "@/contexts/theme-context";
import { ThemeToggleIcon } from "@/components/ui/theme-toggle";

export default function ProfileScreen() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      {/* Header con theme toggle */}
      <View style={styles.header}>
        <Text style={{ color: colors.text }}>Mi Perfil</Text>
        <ThemeToggleIcon />
      </View>

      {/* Contenido */}
      <CardEnhanced header={{ title: "Preferencias" }}>
        <ThemeToggle />
      </CardEnhanced>
    </View>
  );
}
```

### Settings Screen (Nuevo)

```tsx
// app/(tabs)/settings.tsx
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { CardEnhanced } from "@/components/ui/card-enhanced";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <CardEnhanced
        header={{
          title: "Apariencia",
          icon: "color-palette-outline",
        }}
      >
        <ThemeToggle />

        {/* Selector de modo */}
        <View style={styles.modeSelector}>
          <ButtonEnhanced
            title="Claro"
            onPress={() => setThemeMode("light")}
            variant={themeMode === "light" ? "primary" : "outline"}
            size="sm"
          />
          <ButtonEnhanced
            title="Oscuro"
            onPress={() => setThemeMode("dark")}
            variant={themeMode === "dark" ? "primary" : "outline"}
            size="sm"
          />
          <ButtonEnhanced
            title="Auto"
            onPress={() => setThemeMode("auto")}
            variant={themeMode === "auto" ? "primary" : "outline"}
            size="sm"
          />
        </View>
      </CardEnhanced>
    </ScrollView>
  );
}
```

### Login Screen (ya tiene gradient, pero puede tener toggle)

```tsx
// app/(auth)/login-enhanced.tsx
import { ThemeToggleIcon } from "@/components/ui/theme-toggle";

// Agregar en el header
<View style={styles.topBar}>
  <ThemeToggleIcon style={{ position: "absolute", top: 20, right: 20 }} />
</View>;
```

---

## 🔧 Persistencia

El tema se guarda automáticamente en AsyncStorage con la key `@brigada_theme_mode`.

**Valores guardados:**

- `'light'` - Modo claro forzado
- `'dark'` - Modo oscuro forzado
- `'auto'` - Sigue el sistema operativo

**Carga al iniciar:**

- El ThemeProvider carga la preferencia guardada automáticamente
- Si no hay preferencia guardada, usa `'auto'` por defecto
- Muestra `null` mientras carga (puedes agregar un loader si quieres)

---

## 🎯 Próximos Pasos

### Inmediato ✅

- [x] ThemeContext creado
- [x] ThemeToggle creado
- [x] Integrado en \_layout.tsx
- [x] Demo en design-system-examples.tsx

### Recomendado 🔶

- [ ] Agregar ThemeToggle al profile screen
- [ ] Crear settings screen con selector de modo
- [ ] Actualizar login screen con theme support
- [ ] Actualizar activation screen con theme support
- [ ] Actualizar create-password screen con theme support

### Opcional ⭕

- [ ] Agregar transición animada al cambiar tema
- [ ] Persistir más configuraciones (idioma, fuente, etc.)
- [ ] Crear themes personalizados (no solo light/dark)
- [ ] Agregar preview de tema en settings

---

## 📊 Modo de Uso por Pantalla

| Pantalla               | Theme Toggle | Use Colors   | Estado       |
| ---------------------- | ------------ | ------------ | ------------ |
| design-system-examples | ✅ Integrado | ✅ Sí        | ✅ Completo  |
| \_layout.tsx           | ✅ Provider  | -            | ✅ Completo  |
| profile                | 🔶 Pendiente | 🔶 Pendiente | 🔶 Parcial   |
| settings               | ⭕ Crear     | ⭕ Crear     | ⭕ No existe |
| login                  | 🔶 Pendiente | 🔶 Pendiente | 🔶 Parcial   |
| activation             | 🔶 Pendiente | 🔶 Pendiente | 🔶 Parcial   |
| create-password        | 🔶 Pendiente | 🔶 Pendiente | 🔶 Parcial   |

---

## 🐛 Troubleshooting

### El tema no cambia

**Solución**: Verifica que `<CustomThemeProvider>` envuelva tu app en `_layout.tsx`.

### Los colores no se actualizan

**Solución**: Asegúrate de usar `useThemeColors()` y aplicar los colores en estilos inline.

### El tema no persiste

**Solución**: Verifica que `@react-native-async-storage/async-storage` esté instalado.

### Error "useTheme must be used within ThemeProvider"

**Solución**: Verifica que el componente esté dentro del árbol de ThemeProvider.

---

## ✨ Características

- ✅ **Persistencia automática** con AsyncStorage
- ✅ **3 modos**: light, dark, auto (sigue sistema)
- ✅ **Animaciones smooth** al cambiar tema
- ✅ **TypeScript completo** con tipos estrictos
- ✅ **Hooks simples** (useTheme, useThemeColors)
- ✅ **Componente toggle** listo para usar
- ✅ **Integración fácil** en cualquier pantalla
- ✅ **Design Tokens compatible** con el sistema existente

---

## 🎉 ¡Listo para Usar!

El sistema de temas está **completamente integrado** y listo para usar en toda la aplicación.

**Para probarlo ahora:**

1. Navega a `/design-system-examples`
2. Presiona el icono de sol/luna en el header
3. El tema cambia instantáneamente
4. La preferencia se guarda automáticamente

**Para agregarlo a otras pantallas:**

1. Importa `useThemeColors()`
2. Usa los colores en tus estilos
3. Opcionalmente agrega `<ThemeToggleIcon />` al header

¡Disfruta del modo oscuro! 🌙
