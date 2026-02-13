# 🎨 Sistema de Esquemas de Colores

Sistema completo para seleccionar y cambiar esquemas de colores en la aplicación sin modificar código.

## 📁 Archivos Creados

### 1. `constants/color-schemes.ts`

Define todos los esquemas de colores disponibles. Cada esquema incluye:

- Variante Light (modo claro)
- Variante Dark (modo oscuro)
- Nombre y descripción
- 20+ propiedades de color (background, text, borders, status, etc.)

**Esquemas incluidos:**

- 🌸 **Rosa Vibrante** (default) - Esquema original rosa enérgico
- 🔵 **Azul Profesional** - Elegante y corporativo
- 🟣 **Púrpura Moderno** - Creativo y sofisticado
- 🟢 **Verde Natural** - Fresco y orgánico
- 🟠 **Naranja Cálido** - Energético y acogedor
- 🔴 **Rojo Intenso** - Poderoso y apasionado
- ⚫ **Oscuro Elegante** - Minimalista y sofisticado
- 🔷 **Índigo Corporativo** - Profesional y confiable
- 🌊 **Aguamarina Premium** - Fresco y moderno

### 2. `contexts/theme-context.tsx` (Actualizado)

Extendido para soportar múltiples esquemas de colores:

**Nuevas propiedades:**

```typescript
interface ThemeContextType {
  // ... propiedades existentes
  colorScheme: string; // ID del esquema actual
  availableSchemes: ColorScheme[]; // Todos los esquemas disponibles
  setColorScheme: (id: string) => void; // Cambiar esquema
}
```

**Persistencia:**

- Tema (light/dark/auto): `@brigada_theme_mode`
- Esquema de colores: `@brigada_color_scheme`

### 3. `components/ui/color-scheme-selector.tsx`

Componente UI para seleccionar esquemas de colores:

- Vista previa de colores (light + dark)
- Scroll horizontal de opciones
- Indicador visual de selección
- Nombres y descripciones de cada esquema

### 4. `app/(tabs)/theme-settings.tsx`

Pantalla completa de personalización que incluye:

- **Selector de modo de tema** (Claro/Oscuro/Auto) con iconos
- **Selector de esquema de colores** (todos los esquemas disponibles)
- **Vista previa en vivo** que muestra:
  - Textos principal y secundario
  - Botones primario y outline
  - Badges de status (éxito, alerta, error, info)

## 🎯 Cómo Usar

### Para el Usuario Final

1. **Acceder a configuración:**
   - Ir a la pantalla de theme-settings
   - También puedes integrar `<ColorSchemeSelector />` en cualquier pantalla de configuración existente

2. **Cambiar modo de tema:**
   - Seleccionar entre Claro, Oscuro o Auto
   - Auto sigue la configuración del sistema

3. **Cambiar esquema de colores:**
   - Deslizar horizontalmente para ver todos los esquemas
   - Tocar el esquema deseado
   - Los cambios se aplican inmediatamente

4. **Ver cambios en toda la app:**
   - La pantalla de Welcome se actualiza con el esquema seleccionado
   - El gradiente de fondo cambia según el color primario
   - Los iconos decorativos se adaptan automáticamente
   - Todas las pantallas de la app reflejan el nuevo esquema

### Para Desarrolladores

#### Agregar el selector a una pantalla existente

```typescript
import { ColorSchemeSelector } from "@/components/ui/color-scheme-selector";

function MySettingsScreen() {
  return (
    <View>
      {/* ... otros settings ... */}
      <ColorSchemeSelector />
    </View>
  );
}
```

#### Usar el hook de tema con esquemas

```typescript
import { useTheme, useThemeColors } from "@/contexts/theme-context";

function MyComponent() {
  const { colorScheme, setColorScheme, availableSchemes } = useTheme();
  const colors = useThemeColors();

  // Cambiar esquema programáticamente
  const switchToBlue = () => setColorScheme("blue");

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>
        Esquema actual: {colorScheme}
      </Text>
    </View>
  );
}
```

#### Agregar un nuevo esquema de colores

En `constants/color-schemes.ts`:

```typescript
const myNewScheme: ColorScheme = {
  id: "myScheme",
  name: "Mi Esquema",
  description: "Descripción de mi esquema",
  light: {
    background: "#FFFFFF",
    // ... todos los colores en modo claro
  },
  dark: {
    background: "#1A1A1A",
    // ... todos los colores en modo oscuro
  },
};

// Agregar al array de esquemas
export const colorSchemes: ColorScheme[] = [
  pinkScheme,
  blueScheme,
  // ...
  myNewScheme, // ← Agregar aquí
];
```

## 🎨 Propiedades de Color en ThemeColors

Cada esquema debe definir estas propiedades para ambos modos (light/dark):

```typescript
interface ThemeColors {
  // Fondos
  background: string; // Fondo principal
  backgroundSecondary: string; // Fondo alternativo
  surface: string; // Superficies elevadas (cards)
  surfaceVariant: string; // Variante de superficie

  // Textos
  text: string; // Texto principal
  textSecondary: string; // Texto secundario
  textTertiary: string; // Texto terciario/sutil

  // Bordes
  border: string; // Borde principal
  borderLight: string; // Borde sutil

  // Colores primarios
  primary: string; // Color primario del esquema
  primaryLight: string; // Variante clara del primario
  primaryDark: string; // Variante oscura del primario

  // Status
  success: string; // Verde para éxito
  warning: string; // Naranja para advertencias
  error: string; // Rojo para errores
  info: string; // Azul para información

  // Overlays
  overlay: string; // Overlay con transparencia
  backdrop: string; // Backdrop para modals
}
```

## 🔄 Migración desde el Sistema Anterior

El sistema anterior solo soportaba un esquema (rosa) con modos light/dark. Ahora:

✅ **Compatible:** Todo el código existente sigue funcionando

- `useTheme()` y `useThemeColors()` funcionan igual
- `toggleTheme()` y `setThemeMode()` sin cambios
- Los colores siguen accesibles de la misma forma

✨ **Nuevas capacidades:**

- Múltiples esquemas de colores
- Selector visual de esquemas
- Persistencia de preferencia de esquema
- Fácil agregar nuevos esquemas

## 📱 Comportamiento de Persistencia

Las preferencias se guardan automáticamente en AsyncStorage:

1. **Modo de tema** (`light`/`dark`/`auto`)
   - Key: `@brigada_theme_mode`
   - Se carga al iniciar la app

2. **Esquema de colores** (`pink`/`blue`/`purple`/etc)
   - Key: `@brigada_color_scheme`
   - Se carga al iniciar la app
   - Default: `pink` (esquema original)

## 🎨 Welcome Screen Dinámico

La pantalla de bienvenida ahora se adapta completamente al esquema de colores seleccionado:

### Elementos que cambian

- **Gradiente de fondo**: Genera automáticamente un gradiente desde `primary` → `primaryDark` → `primary`
- **Logo badge**: Usa `background` como color de fondo y `primary` para el icono
- **Texto de marca**: Se colorea con `background` para contraste sobre el gradiente
- **Iconos decorativos**: Usan `background` con 60% de opacidad para crear profundidad
- **Características**: Los iconos usan `primary` y los textos usan `background`
- **Botón CTA**: Fondo en `background` y texto/icono en `primary`
- **Botón de activación**: Border y texto en `background` con transparencia

### Resultado

Cada esquema de colores crea una experiencia visual completamente diferente en la pantalla de bienvenida, manteniendo la legibilidad y jerarquía visual. Por ejemplo:

- **Rosa Vibrante**: Gradiente rosa con elementos blancos brillantes
- **Azul Profesional**: Gradiente azul corporativo con elementos claros
- **Índigo Corporativo**: Gradiente índigo profundo con blancos limpios
- **Aguamarina Premium**: Gradiente turquesa con elementos frescos

## 🎯 Siguientes Pasos Sugeridos

1. **Integrar en navegación:**
   - Agregar enlace a theme-settings desde el drawer/menu principal
   - O incluir `<ColorSchemeSelector />` en la pantalla de perfil existente

2. **Onboarding:**
   - Mostrar el selector de esquemas en el primer uso
   - Permitir personalización durante el setup inicial
   - La pantalla Welcome ya muestra el esquema seleccionado

3. **Más esquemas:**
   - Agregar esquemas basados en feedback de usuarios
   - Crear esquemas para accesibilidad (alto contraste)
   - Esquemas temáticos (navideño, etc.)
   - Actualmente incluye 9 esquemas predefinidos

4. **Exportar/Importar:**
   - Permitir compartir esquemas personalizados
   - Importar esquemas de la comunidad

## 📝 Notas Técnicas

- **TypeScript:** Todo está completamente tipado
- **Performance:** Los colores se calculan solo cuando cambia el tema/esquema
- **React Native:** Compatible con iOS y Android
- **Expo:** Funciona perfectamente con Expo Go y builds nativos
- **Sin dependencias extras:** Solo usa AsyncStorage y React Native core

## 🐛 Troubleshooting

**Problema:** Los colores no cambian después de setColorScheme()

- **Solución:** Verificar que el schemeId existe en colorSchemes array

**Problema:** La app no recuerda el esquema después de cerrar

- **Solución:** Verificar permisos de AsyncStorage

**Problema:** El esquema se ve raro en modo dark

- **TypeScript:** Todo está completamente tipado
- **Performance:** Los colores se calculan solo cuando cambia el tema/esquema
- **React Native:** Compatible con iOS y Android
- **Expo:** Funciona perfectamente con Expo Go y builds nativos
- **Sin dependencias extras:** Solo usa AsyncStorage y React Native core

## 🐛 Troubleshooting

**Problema:** Los colores no cambian después de setColorScheme()

- **Solución:** Verificar que el schemeId existe en colorSchemes array

**Problema:** La app no recuerda el esquema después de cerrar

- **Solución:** Verificar permisos de AsyncStorage

**Problema:** El esquema se ve raro en modo dark

- **Solución:** Cada esquema debe tener definiciones completas para light Y dark

---

**Creado:** 2025
**Actualizado:** Compatible con todo el código existente
**Backward Compatible:** ✅ Sí
