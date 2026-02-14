# 🔄 FORZAR RECARGA DE CAMBIOS - URGENTE

## Problema

Los cambios en el botón gradient no se ven reflejados en la app.

## Solución - Sigue ESTOS pasos en orden:

### 1. ✅ Verifica que guardaste los archivos

```
Ctrl + S (o Cmd + S en Mac)
```

### 2. 🔥 Cierra y reinicia Metro Bundler

En la terminal donde corre Expo:

```bash
# Presiona Ctrl + C para detener
# Luego ejecuta:
npx expo start --clear
```

### 3. 🔄 Recarga la app

Cuando Metro esté corriendo de nuevo:

- **Opción 1:** Presiona `r` en la terminal de Metro
- **Opción 2:** En la app, sacude el teléfono y selecciona "Reload"
- **Opción 3:** En el emulador: Ctrl + M (Android) o Cmd + D (iOS) → "Reload"

### 4. 🧹 Si aún no funciona, limpia caché completo:

```bash
# Detén Metro (Ctrl + C)
# Ejecuta:
npx expo start --clear
npx expo start --dev-client --clear

# O más agresivo:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### 5. 🔍 Verifica en la consola

Busca este mensaje:

```
🎨 GRADIENT BUTTON RENDERING - Theme: dark Colors: ["#8B0A3D", "#5C0727"]
```

o

```
🎨 GRADIENT BUTTON RENDERING - Theme: light Colors: ["#FF0080", "#E6006F"]
```

## Colores que DEBERÍAS ver:

### Light Mode:

- **Gradiente:** Rosa neón brillante (#FF0080 → #E6006F)
- **Texto:** Blanco
- **Muy visible** sobre fondo blanco

### Dark Mode:

- **Gradiente:** Rosa borgoña/vino oscuro (#8B0A3D → #5C0727)
- **Texto:** Blanco
- **Muy oscuro** sobre fondo rosa vibrante

## 🚨 Si TODAVÍA no ves cambios:

### Opción A: Reinstala dependencias

```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Opción B: Verifica que el archivo es el correcto

```bash
# En PowerShell:
Get-Content "components\ui\button-enhanced.tsx" | Select-String -Pattern "8B0A3D"
```

Debería mostrar la línea con el color borgoña.

### Opción C: Verifica imports en login-enhanced.tsx

Línea ~3:

```tsx
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
```

Debe importar desde la ruta correcta.

---

## 📋 Checklist Rápido

- [ ] Guardé button-enhanced.tsx (Ctrl+S)
- [ ] Detuve Metro (Ctrl+C)
- [ ] Ejecuté `npx expo start --clear`
- [ ] Recargué la app (R o Reload)
- [ ] Busqué el log "🎨 GRADIENT BUTTON RENDERING" en consola
- [ ] El botón ahora es rosa neón (light) o borgoña (dark)

---

**Si después de TODO esto no funciona, es posible que:**

1. Estés viendo una versión cacheada
2. El archivo no se guardó correctamente
3. Hay un error de compilación silencioso

**Envíame:**

- Screenshot de la consola de Metro
- Screenshot del botón actual
- Resultado del comando de verificación
