# 🔍 Checklist de Verificación del Splash Screen

## ✅ Pasos para Verificar

### 1. Verificar que el archivo de fuente existe

```bash
# Windows PowerShell
Test-Path "assets\fonts\Pacifico-Regular.ttf"
# Debe retornar: True

# macOS/Linux
ls -la assets/fonts/Pacifico-Regular.ttf
# Debe mostrar el archivo
```

**Si no existe:**

```bash
# Windows
Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf" -OutFile "assets\fonts\Pacifico-Regular.ttf"

# macOS/Linux
curl -L -o assets/fonts/Pacifico-Regular.ttf https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf
```

---

### 2. Verificar integración en app/\_layout.tsx

Abre `app/_layout.tsx` y verifica que tenga:

```tsx
import { SplashScreen } from "@/components/layout";
import * as ExpoSplashScreen from "expo-splash-screen";

// Debe tener esto al inicio
ExpoSplashScreen.preventAutoHideAsync();

// Y en el componente:
if (!appReady) {
  return <SplashScreen onLoadComplete={handleLoadComplete} />;
}
```

**Si no está integrado:** Copia el código del archivo `docs/SPLASH_INSTALLATION.md` sección 4️⃣.

---

### 3. Limpiar caché de Expo

```bash
npx expo start -c
```

**IMPORTANTE:** Siempre usa `-c` la primera vez después de instalar el splash.

---

### 4. Verificar en consola

Al ejecutar la app, deberías ver en la consola:

```
[Splash] Fonts loaded: true
[Splash] App initialized: { session: {...}, connection: {...}, surveys: {...} }
[App] Splash completed: { hasSession: true, isOnline: true, surveysLoaded: true }
```

**Si ves:**

```
[Splash] Font error: ...
[Splash] Font timeout, using system font
```

Significa que la fuente no se encontró, pero el splash usará una fuente del sistema como fallback.

---

### 5. Verificar visualmente

Deberías ver:

1. **Pantalla con gradiente rosa** (#FF1B8D → #FF6B9D)
2. **Texto "brigadaDigital"** en el centro (con fuente elegante o en negrita si usa fallback)
3. **3 puntos blancos animados** debajo del texto
4. **Mensajes cambiantes**: "🚀 Iniciando...", "📊 Cargando encuestas...", etc.
5. **Duración**: 2-3 segundos
6. **Transición suave** (fade out) a la pantalla principal

---

## 🐛 Problemas Comunes

### Problema 1: No se ve nada, pantalla blanca

**Causa:** Fuente no cargó y componente retorna `null` antes del timeout

**Solución:**

```bash
# Verificar que la fuente existe
ls assets/fonts/Pacifico-Regular.ttf

# Si no existe, descargarla
npm run setup:splash-font

# Limpiar caché
npx expo start -c
```

**Solución alternativa:** El componente ahora tiene un fallback que usa fuente del sistema después de 1 segundo.

---

### Problema 2: Logo con fuente normal (no elegante)

**Causa:** Fuente Pacifico no se cargó, usando fallback

**Esperado:** Esto es normal si la fuente no existe. El splash se muestra de todos modos con fuente del sistema.

**Para arreglar:**

1. Verifica que `Pacifico-Regular.ttf` existe en `assets/fonts/`
2. Reinicia con `npx expo start -c`

---

### Problema 3: Error "Unable to resolve module expo-linear-gradient"

**Solución:**

```bash
npx expo install expo-linear-gradient
npm install
npx expo start -c
```

---

### Problema 4: Splash no desaparece

**Causa:** `onLoadComplete` no se llama

**Debug:** Abre la consola y busca:

```
[Splash] App initialized: ...
[App] Splash completed: ...
```

Si NO ves estos logs, el callback no está conectado.

**Solución:** Verifica que en `app/_layout.tsx` tengas:

```tsx
const handleLoadComplete = (state) => {
  console.log("[App] Splash completed:", state);
  setAppReady(true);
};
```

---

### Problema 5: Error en Expo Go

**Nota:** El splash funciona en Expo Go. Si no se ve:

1. Asegúrate de usar Expo Go actualizado
2. Limpia caché: `npx expo start -c`
3. Recarga la app en Expo Go (shake device → Reload)

---

## ✅ Checklist Final

Antes de continuar, verifica:

- [ ] Fuente existe: `assets/fonts/Pacifico-Regular.ttf` ✅
- [ ] `expo-linear-gradient` instalado ✅
- [ ] `app/_layout.tsx` integrado correctamente ✅
- [ ] Ejecutado con `npx expo start -c` ✅
- [ ] Se ven logs en consola ✅
- [ ] Splash aparece por 2-3 segundos ✅
- [ ] Transición suave a la app ✅

---

## 🎯 Resultado Esperado

```
┌────────────────────────────────┐
│ 09:41              📶 🔋       │
│                                │
│    [GRADIENTE ROSA VIBRANTE]   │
│                                │
│      brigadaDigital            │ ← Logo
│                                │
│         ⚪⚪⚪                   │ ← Animación
│                                │
│    Cargando encuestas...       │ ← Mensaje
│                                │
│           v1.0.0               │ ← Versión
└────────────────────────────────┘

↓ (2-3 segundos)

[FADE OUT] → [TU APP]
```

---

## 📞 ¿Aún no funciona?

1. **Verifica logs:** Busca `[Splash]` en la consola
2. **Prueba sin fuente:** Si ves `[Splash] Font timeout, using system font`, está funcionando con fallback
3. **Revisa integración:** Asegúrate de que `app/_layout.tsx` tiene el código correcto
4. **Limpia todo:**
   ```bash
   rm -rf node_modules
   npm install
   npx expo start -c
   ```

---

**Si todo está bien, deberías ver el splash en 2-3 segundos al iniciar la app!** 🎉
