# ⚡ Quick Start - Splash Screen

## 📥 Descargar Fuente (Manual - 1 minuto)

### Windows PowerShell:

```powershell
# Crear carpeta
New-Item -ItemType Directory -Force -Path "assets\fonts"

# Descargar fuente
Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf" -OutFile "assets\fonts\Pacifico-Regular.ttf"
```

### macOS/Linux:

```bash
# Crear carpeta
mkdir -p assets/fonts

# Descargar fuente
curl -L -o assets/fonts/Pacifico-Regular.ttf https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf
```

### O descarga manual:

1. Click aquí: [Descargar Pacifico](https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf)
2. Guarda como `Pacifico-Regular.ttf` en la carpeta `assets/fonts/`

---

## ✅ Verificar Instalación

```bash
# Debería mostrar el archivo
ls assets/fonts/Pacifico-Regular.ttf
```

---

## 🚀 Ejecutar App

```bash
npx expo start -c
```

**Presiona:**

- `a` para Android
- `i` para iOS
- `w` para Web

---

## 🎨 Ver el Resultado

Deberías ver:

- Logo "brigadaDigital" con fuente elegante
- Gradiente rosa (#FF1B8D → #FF6B9D)
- 3 dots animados
- Mensajes: "🚀 Iniciando...", "📊 Cargando encuestas...", etc.
- Duración: 2-3 segundos

---

## 📚 Más Info

- **Instalación completa**: [`SPLASH_INSTALLATION.md`](./SPLASH_INSTALLATION.md)
- **Personalización**: [`../components/layout/README.md`](../components/layout/README.md)
- **Diseño UX**: [`SCREEN_FLOW_UX.md`](./SCREEN_FLOW_UX.md)

---

**¿Problemas?** Ver: [`SPLASH_INSTALLATION.md`](./SPLASH_INSTALLATION.md) - Sección "Solución de Problemas"
