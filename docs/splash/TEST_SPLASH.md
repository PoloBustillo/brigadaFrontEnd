# ✅ TEST DEL SPLASH SCREEN

## 🚀 Paso a Paso para Probar

### 1. Ejecuta el diagnóstico

```bash
npm run check:splash
```

**Debería mostrar:**

```
✅ Fuente encontrada
✅ Componente encontrado
✅ Import de SplashScreen
✅ preventAutoHideAsync configurado
✅ Callback onLoadComplete configurado
✅ expo-linear-gradient instalado
✅ TODO LISTO!
```

---

### 2. Inicia Expo con caché limpio

```bash
npx expo start -c
```

**IMPORTANTE:** Usa `-c` para limpiar caché.

---

### 3. Abre en Expo Go

- **Android**: Presiona `a` en la terminal
- **iOS**: Presiona `i` en la terminal
- **Manualmente**: Escanea el QR en Expo Go

---

### 4. Observa la consola

Deberías ver estos logs:

```
[Splash] Fonts loaded: true
[Splash] Starting verification...
[Splash] Verification 1/3: Checking session...
[Splash] Verification 2/3: Checking connection...
[Splash] Verification 3/3: Loading surveys...
[Splash] App initialized: { hasSession: true, isOnline: true, surveysLoaded: true }
[App] Splash completed: { hasSession: true, isOnline: true, surveysLoaded: true }
```

**Si ves esto, significa que todo funciona!** ✅

---

## 🎯 Qué Deberías Ver

### Pantalla del Splash:

```
┌─────────────────────────────┐
│ 09:41           📶 🔋      │
│                             │
│  [GRADIENTE ROSA VIBRANTE]  │
│                             │
│    brigadaDigital           │ ← Logo elegante
│                             │
│        ⚪ ⚪ ⚪             │ ← Puntos animados
│                             │
│  🚀 Iniciando...            │ ← Mensaje cambiante
│                             │
│         v1.0.0              │
└─────────────────────────────┘

↓ (2-3 segundos)

[FADE OUT suave]

↓

[TU APP PRINCIPAL]
```

---

## ⏱️ Secuencia Temporal

| Tiempo | Mensaje                    | Qué Pasa                   |
| ------ | -------------------------- | -------------------------- |
| 0.0s   | 🚀 Iniciando...            | Splash aparece con fade in |
| 0.5s   | 🔐 Verificando sesión...   | Verifica AsyncStorage      |
| 1.0s   | 📡 Comprobando conexión... | Verifica internet          |
| 1.5s   | 📊 Cargando encuestas...   | Carga datos locales        |
| 2.0s   | ✅ Listo!                  | Preparando transición      |
| 2.5s   | [FADE OUT]                 | Transición suave a app     |

**Duración total: 2.5 segundos**

---

## ✅ Checklist Visual

Al iniciar la app, verifica:

- [ ] **Fondo**: Gradiente rosa (#FF1B8D → #FF6B9D diagonal)
- [ ] **Logo**: "brigadaDigital" (fuente elegante o negrita)
- [ ] **Animación**: 3 puntos blancos pulsando secuencialmente
- [ ] **Mensajes**: Cambian cada 0.5 segundos
- [ ] **Versión**: "v1.0.0" en la esquina inferior derecha
- [ ] **Duración**: 2-3 segundos
- [ ] **Transición**: Fade out suave (no abrupto)
- [ ] **App**: Aparece después del splash

---

## 🐛 Si No Funciona

### Problema: Pantalla blanca

**Solución:**

```bash
# 1. Verifica la fuente
npm run check:splash

# 2. Si falta la fuente, descárgala
npm run setup:splash-font

# 3. Limpia caché y reinicia
npx expo start -c
```

### Problema: Logo con fuente normal (no elegante)

**Esto es OK!** Significa que está usando el fallback del sistema. Verifica en la consola:

```
[Splash] Font error: ...
[Splash] Font timeout, using system font
```

Para arreglarlo:

1. Verifica que exista: `assets/fonts/Pacifico-Regular.ttf`
2. Reinicia: `npx expo start -c`

### Problema: No aparece nada

**Debug:**

1. Revisa la consola, busca `[Splash]`
2. Si no hay logs, el componente no se está renderizando
3. Verifica que `app/_layout.tsx` tenga la integración:

```tsx
import { SplashScreen } from "@/components/layout";

// ...
if (!appReady) {
  return <SplashScreen onLoadComplete={handleLoadComplete} />;
}
```

---

## 📸 Captura de Pantalla

Si funciona, deberías poder capturar esto:

1. Gradiente rosa vibrante
2. Logo "brigadaDigital" centrado
3. 3 puntos animados
4. Mensaje "Cargando encuestas..."
5. Versión "v1.0.0" abajo

---

## ✅ Resultado Esperado

**En 2-3 segundos:**

- ✅ Splash aparece con animación
- ✅ Logo elegante o fuente del sistema
- ✅ Puntos animados
- ✅ Mensajes cambiantes
- ✅ Fade out suave
- ✅ App principal aparece

**Si todo esto pasa, ¡ÉXITO!** 🎉

---

## 📞 Soporte

Si después de seguir todos los pasos aún no funciona:

1. Ejecuta: `npm run check:splash`
2. Revisa: `docs/SPLASH_TROUBLESHOOTING.md`
3. Verifica logs en consola
4. Comparte los logs que ves en `[Splash]`

---

**¡Disfruta tu nuevo Splash Screen!** 🚀✨
