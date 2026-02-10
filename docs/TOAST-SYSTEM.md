# 🎨 Sistema de Notificaciones Toast

Reemplazo moderno de los `Alert` nativos con **react-native-toast-message**.

## 📦 Instalación Completada

```bash
npm install react-native-toast-message
```

## ✅ Configuración Completada

### 1. Toast Provider en `app/_layout.tsx`

```tsx
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/toast";

// En el return, después del </Stack>:
<Toast config={toastConfig} />;
```

### 2. Helper Component en `components/ui/toast.tsx`

- Configuración personalizada de estilos
- Funciones helper para facilitar uso

## 🚀 Cómo Usar

### Importar

```tsx
import { showToast } from "@/components/ui/toast";
```

### Tipos de Toast

#### ✅ Success (Verde)

```tsx
showToast.success("Título del éxito", "Mensaje descriptivo opcional");

// Ejemplo real:
showToast.success("Código Válido", "Tu cuenta ha sido activada correctamente");
```

#### ❌ Error (Rojo)

```tsx
showToast.error("Título del error", "Mensaje descriptivo del problema");

// Ejemplo real:
showToast.error(
  "Código Inválido",
  "El código ingresado no es válido. Verifica e intenta nuevamente.",
);
```

#### ℹ️ Info (Azul)

```tsx
showToast.info("Título informativo", "Información adicional");

// Ejemplo real:
showToast.info(
  "Código Reenviado",
  "Revisa tu correo electrónico en unos momentos",
);
```

#### ⚠️ Warning (Naranja)

```tsx
showToast.warning("Advertencia", "Mensaje de advertencia");

// Ejemplo real:
showToast.warning(
  "Contraseña débil",
  "Incluye mayúsculas, minúsculas y números para mayor seguridad",
);
```

## 🎯 Ventajas sobre Alert Nativo

| Característica   | Alert Nativo       | Toast Message              |
| ---------------- | ------------------ | -------------------------- |
| **Diseño**       | Básico iOS/Android | Moderno y personalizable   |
| **Posición**     | Centro (modal)     | Top (no bloquea)           |
| **Animaciones**  | Simple fade        | Slide + fade suaves        |
| **Colores**      | Limitados          | Totalmente personalizables |
| **Íconos**       | No nativos         | Íconos integrados          |
| **Auto-dismiss** | No                 | Sí (configurable)          |
| **Stack**        | Bloquea UI         | Multiple toasts            |
| **UX**           | Intrusivo          | No intrusivo               |

## 📐 Configuración de Estilos

### Posición y Duración

```tsx
Toast.show({
  type: "success",
  text1: "Título",
  text2: "Mensaje",
  position: "top", // top, bottom
  visibilityTime: 3000, // ms
  topOffset: 60, // offset desde arriba
});
```

### Colores Personalizados

| Tipo    | Color Border | Significado         |
| ------- | ------------ | ------------------- |
| Success | `#00FF88`    | Verde brillante     |
| Error   | `#FF3333`    | Rojo alerta         |
| Info    | `#0066CC`    | Azul información    |
| Warning | `#FFA726`    | Naranja advertencia |

## 🔄 Migración desde Alert

### Antes (Alert nativo)

```tsx
Alert.alert("Título", "Mensaje", [
  { text: "Cancelar", style: "cancel" },
  { text: "OK", onPress: () => console.log("OK") },
]);
```

### Después (Toast)

```tsx
showToast.success("Título", "Mensaje");
// Acción se ejecuta después del toast
setTimeout(() => {
  console.log("OK");
}, 1500);
```

## 📝 Ejemplos Reales del Proyecto

### 1. Activación Exitosa

```tsx
// En activation.tsx
if (isValid) {
  showToast.success(
    "Código Válido",
    "Tu cuenta ha sido activada correctamente",
  );
  setTimeout(() => {
    router.replace("/(auth)/create-password" as any);
  }, 1500);
}
```

### 2. Error de Validación

```tsx
// En create-password.tsx
if (!email.trim()) {
  showToast.error("Error", "Por favor ingresa tu correo electrónico");
  return;
}
```

### 3. Contraseña Débil

```tsx
// En create-password.tsx
if (passwordStrength.score < 2) {
  showToast.warning(
    "Contraseña débil",
    "Incluye mayúsculas, minúsculas y números para mayor seguridad",
  );
  return;
}
```

## 🎨 Personalización Avanzada

Si necesitas un toast custom completamente:

```tsx
import Toast from "react-native-toast-message";

Toast.show({
  type: "success", // o tu tipo custom
  text1: "Título personalizado",
  text2: "Mensaje largo que puede tener múltiples líneas",
  position: "bottom",
  visibilityTime: 5000,
  autoHide: true,
  onShow: () => console.log("Toast mostrado"),
  onHide: () => console.log("Toast ocultado"),
  onPress: () => console.log("Toast presionado"),
});
```

## 🐛 Troubleshooting

### Toast no aparece

1. Verificar que `<Toast />` esté en `_layout.tsx`
2. Asegurarse de que esté **después** del `</Stack>`
3. Verificar import correcto

### Toast aparece detrás de modales

Ajustar el `zIndex` en la configuración:

```tsx
// En components/ui/toast.tsx
style={{
  zIndex: 9999,
  elevation: 9999,
}}
```

## 📚 Documentación Oficial

[React Native Toast Message](https://github.com/calintamas/react-native-toast-message)

---

**Última actualización:** 10 de febrero, 2026
