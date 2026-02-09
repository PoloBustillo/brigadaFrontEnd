# 🎯 GUÍA PASO A PASO: Tu Primer Build

## ✅ Progreso Actual

- ✅ Node.js v20.18.0 instalado
- ✅ EAS CLI v16.32.0 instalado
- ✅ eas.json configurado
- ✅ app.json configurado con package y bundleIdentifier

**¡Ya casi estás listo!** Solo faltan 3 pasos. ⏱️ 10 minutos

---

## 📋 Paso 1: Login a Expo (2 min)

### Opción A: Ya tienes cuenta

Ejecuta en la terminal:

```bash
eas login
```

Te pedirá:

- Email o username
- Password

### Opción B: Crear cuenta nueva (gratis)

```bash
eas register
```

Te pedirá:

- Email
- Username
- Password

**Después de login, verifica:**

```bash
eas whoami
```

Deberías ver tu username.

---

## 📋 Paso 2: Configurar Proyecto (OPCIONAL - ya está hecho)

Tu proyecto ya está configurado, pero si quieres verificar:

```bash
eas build:configure
```

Si pregunta algo, acepta los defaults (Enter).

---

## 📋 Paso 3: Crear Build (15 min)

### Android (recomendado para primera vez):

```bash
eas build --profile development --platform android
```

### iOS (requiere Apple Developer account):

```bash
eas build --profile development --platform ios
```

### Ambos:

```bash
eas build --profile development --platform all
```

---

## 🎬 Lo que Va a Pasar

1. **Análisis del proyecto** (30 seg)
   - Verifica dependencias
   - Genera configuración nativa

2. **Subida de código** (1-2 min)
   - Comprime y sube tu proyecto
   - Muestra progreso

3. **Build en la nube** (10-15 min)
   - Instala dependencias
   - Compila código nativo
   - Genera APK/IPA
4. **Resultado**
   - ✅ Link de descarga
   - 📦 APK/IPA listo para instalar

---

## 📱 Paso 4: Instalar en tu Dispositivo

Una vez termine el build:

### Android:

1. Abre el link en tu teléfono
2. Descarga el APK
3. Instala (permite "Fuentes desconocidas" si te lo pide)
4. ¡Abre la app!

### iOS:

1. Descarga el IPA
2. Instala con TestFlight o Apple Configurator
3. ¡Abre la app!

---

## ✨ Lo que Verás

```
┌────────────────────────────────┐
│ 09:41              📶 🔋       │
│                                │
│  [GRADIENTE ROSA VIBRANTE]     │
│     #FF1B8D → #FF6B9D          │
│                                │
│      brigadaDigital            │ ← Fuente Pacifico
│                                │
│         ⚪⚪⚪                   │ ← Pulsando
│                                │
│    🚀 Iniciando...             │
│    🔐 Verificando sesión...    │ ← Cambiando
│    📡 Comprobando conexión...  │
│    📊 Cargando encuestas...    │
│    ✅ Listo!                   │
│                                │
│           v1.0.0               │
└────────────────────────────────┘

↓ (2-3 segundos con animación suave)

[TU APP PRINCIPAL]
```

**¡Funcionando perfectamente!** 🎉

---

## 🎯 Comandos en Orden

Ejecuta estos comandos UNO POR UNO:

```bash
# 1. Login (si no lo has hecho)
eas login

# 2. Verificar login
eas whoami

# 3. Crear build
eas build --profile development --platform android

# 4. Esperar ~15 minutos

# 5. Descargar e instalar APK
```

---

## 📊 Monitoreo del Build

Mientras esperas, puedes:

### Ver progreso en la web:

El comando te da un link como:

```
🚀 Build details: https://expo.dev/accounts/tuusername/projects/brigada2026/builds/xxx
```

Ábrelo en tu navegador para ver:

- Progreso en tiempo real
- Logs del build
- Tiempo restante estimado

### Ver todos tus builds:

```bash
eas build:list
```

---

## 🐛 Posibles Problemas

### "You are not logged in"

```bash
eas login
```

### "Project not configured"

```bash
eas build:configure
```

### "Package name already in use"

Ya lo configuré con: `com.brigadadigital.app`

Si da error, puedes cambiar en `app.json`:

```json
"android": {
  "package": "com.tuempresa.brigadadigital"
}
```

### Build falla

Revisa los logs en el link que te da. Usualmente es:

- Dependencia faltante → `npm install`
- Configuración → Verifica app.json

---

## ✅ Checklist Pre-Build

Antes de ejecutar el build, verifica:

- [ ] EAS CLI instalado (`eas --version`) ✅
- [ ] Login correcto (`eas whoami`)
- [ ] eas.json existe ✅
- [ ] app.json tiene package/bundleIdentifier únicos ✅
- [ ] Fuente Pacifico en assets/fonts/ ✅
- [ ] Internet estable

---

## 🎯 Siguiente Paso AHORA

Ejecuta en tu terminal:

```bash
eas login
```

**Después de login exitoso, ejecuta:**

```bash
eas build --profile development --platform android
```

---

## ⏱️ Timeline

| Acción           | Tiempo      |
| ---------------- | ----------- |
| Login            | 1 min       |
| Comando build    | 30 seg      |
| Subida de código | 2 min       |
| Build en la nube | 10-15 min   |
| Descarga         | 1 min       |
| Instalación      | 1 min       |
| **TOTAL**        | **~20 min** |

---

## 💡 Tips

1. **Primera vez**: Android es más rápido que iOS
2. **Caché**: Builds posteriores son más rápidos
3. **Local build**: Si tienes Android Studio, usa `--local` para builds instantáneos
4. **WiFi**: Usa conexión rápida para subir código

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:

1. Copia el mensaje de error
2. Comparte el link del build
3. Revisa `docs/SPLASH_TROUBLESHOOTING.md`

---

**¡Listo! Ahora ejecuta: `eas login` y luego `eas build`** 🚀

**En 20 minutos tendrás tu splash funcionando!** ✨
