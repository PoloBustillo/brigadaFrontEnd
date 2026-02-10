# 🧹 Limpieza y Organización - Brigada Digital

## 📋 Archivos a Eliminar

### ❌ **Duplicados - Raíz de /app**

Estos archivos están duplicados y ya existen en carpetas organizadas:

1. ✅ **app/welcome.tsx** → Ya existe en `app/(auth)/welcome.tsx`
2. ✅ **app/profile.tsx** → Ya existe en `app/(auth)/profile.tsx`
3. ✅ **app/modal.tsx** → Archivo de ejemplo, no se usa
4. ❌ **app/auth/login.tsx** → Duplicado, usar `app/(auth)/login.tsx`

### 📁 **Archivos de Ejemplo (No Usados)**

Archivos del template de Expo que no se usan en la app:

1. ❌ **app/(tabs)/explore.tsx** → Página de ejemplo
2. ❌ **app/(tabs)/index.tsx** → Página de ejemplo (home)

### 🖼️ **Imágenes No Usadas**

1. ❌ **partial-react-logo.png** → Logo de React de ejemplo
2. ❌ **react-logo.png** → Logo de React 1x
3. ❌ **react-logo@2x.png** → Logo de React 2x
4. ❌ **react-logo@3x.png** → Logo de React 3x

---

## ✅ Archivos a Mantener

### 📱 **Estructura de Navegación**

```
app/
├── (auth)/                  ← Grupo de autenticación
│   ├── welcome.tsx         ← Pantalla de bienvenida ✅
│   ├── login.tsx           ← Login screen ✅
│   └── profile.tsx         ← Profile dashboard ✅
├── (tabs)/                 ← Grupo de tabs
│   └── _layout.tsx         ← Layout de tabs ✅
├── components-demo.tsx     ← Demo de componentes UI ✅
└── _layout.tsx             ← Root layout ✅
```

### 🖼️ **Imágenes Necesarias**

```
assets/images/
├── icono.png                           ← Ícono principal ✅
├── icon.png                            ← Ícono genérico (cambiar por icono.png)
├── splash-icon.png                     ← Ícono del splash ✅
├── favicon.png                         ← Favicon web ✅
├── android-icon-foreground.png         ← Android foreground ✅
├── android-icon-background.png         ← Android background ✅
└── android-icon-monochrome.png         ← Android monochrome ✅
```

---

## 🔧 Acciones a Realizar

### 1. Eliminar Archivos Duplicados

```powershell
# Eliminar archivos raíz duplicados
Remove-Item .\app\welcome.tsx
Remove-Item .\app\profile.tsx
Remove-Item .\app\modal.tsx

# Eliminar carpeta auth antigua
Remove-Item -Recurse .\app\auth\
```

### 2. Eliminar Archivos de Ejemplo

```powershell
# Eliminar páginas de ejemplo
Remove-Item .\app\(tabs)\explore.tsx
Remove-Item .\app\(tabs)\index.tsx
```

### 3. Eliminar Imágenes No Usadas

```powershell
# Eliminar logos de React
Remove-Item .\assets\images\partial-react-logo.png
Remove-Item .\assets\images\react-logo.png
Remove-Item .\assets\images\react-logo@2x.png
Remove-Item .\assets\images\react-logo@3x.png
```

### 4. Configurar icono.png como Ícono Principal

```powershell
# Reemplazar icon.png con icono.png
Copy-Item .\assets\images\icono.png .\assets\images\icon.png -Force
```

---

## 📝 Actualizar app.json

### Configuración de Íconos

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "backgroundColor": "#FF1B8D"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png",
        "backgroundColor": "#FF1B8D"
      }
    }
  }
}
```

---

## 📊 Antes vs Después

### **Antes**

```
app/
├── (auth)/
│   ├── welcome.tsx
│   ├── login.tsx
│   └── profile.tsx
├── auth/                    ← DUPLICADO
│   └── login.tsx
├── (tabs)/
│   ├── explore.tsx          ← EJEMPLO
│   ├── index.tsx            ← EJEMPLO
│   └── _layout.tsx
├── welcome.tsx              ← DUPLICADO
├── profile.tsx              ← DUPLICADO
├── modal.tsx                ← NO USADO
├── components-demo.tsx
└── _layout.tsx

assets/images/
├── icono.png                ← PRINCIPAL
├── icon.png                 ← GENÉRICO
├── partial-react-logo.png   ← NO USADO
├── react-logo.png           ← NO USADO
├── react-logo@2x.png        ← NO USADO
├── react-logo@3x.png        ← NO USADO
└── ...
```

### **Después**

```
app/
├── (auth)/
│   ├── welcome.tsx          ← ✅
│   ├── login.tsx            ← ✅
│   └── profile.tsx          ← ✅
├── (tabs)/
│   └── _layout.tsx          ← ✅
├── components-demo.tsx      ← ✅
└── _layout.tsx              ← ✅

assets/images/
├── icon.png                 ← (= icono.png) ✅
├── splash-icon.png          ← ✅
├── favicon.png              ← ✅
├── android-icon-*.png       ← ✅
└── icono.png                ← ✅ (backup)
```

---

## 🎯 Estructura Final

### **Navegación**

```
Root (_layout.tsx)
├── (auth) - Autenticación
│   ├── welcome → "/"
│   ├── login → "/login"
│   └── profile → "/profile"
├── (tabs) - Navegación principal
│   └── (Vacío - listo para agregar tabs)
└── components-demo → "/components-demo"
```

### **Archivos Core**

- ✅ 3 pantallas de auth (welcome, login, profile)
- ✅ 1 demo de componentes
- ✅ 2 layouts (root + tabs)
- ✅ Íconos configurados correctamente

---

## ✅ Beneficios

1. **Organización Clara**
   - Sin duplicados
   - Estructura por features (auth, tabs)
   - Fácil de navegar

2. **Menos Confusión**
   - Un solo lugar por archivo
   - Nombres descriptivos
   - Grupos lógicos

3. **Mejor Performance**
   - Menos archivos innecesarios
   - Imágenes optimizadas
   - Bundle más pequeño

4. **Mantenimiento**
   - Fácil encontrar archivos
   - Evita errores de importación
   - Escalable

---

## 🚀 Próximos Pasos

1. ✅ Ejecutar comandos de limpieza
2. ✅ Actualizar app.json con icono.png
3. ✅ Verificar que la navegación funcione
4. ✅ Probar en emulador
5. ✅ Rebuild para aplicar cambios de iconos

---

**Ejecuta los comandos en orden:**

```powershell
# 1. Limpiar duplicados
Remove-Item .\app\welcome.tsx -ErrorAction SilentlyContinue
Remove-Item .\app\profile.tsx -ErrorAction SilentlyContinue
Remove-Item .\app\modal.tsx -ErrorAction SilentlyContinue
Remove-Item -Recurse .\app\auth\ -ErrorAction SilentlyContinue

# 2. Limpiar ejemplos
Remove-Item .\app\(tabs)\explore.tsx -ErrorAction SilentlyContinue
Remove-Item .\app\(tabs)\index.tsx -ErrorAction SilentlyContinue

# 3. Limpiar imágenes
Remove-Item .\assets\images\partial-react-logo.png -ErrorAction SilentlyContinue
Remove-Item .\assets\images\react-logo*.png -ErrorAction SilentlyContinue

# 4. Configurar ícono principal
Copy-Item .\assets\images\icono.png .\assets\images\icon.png -Force

# 5. Verificar estructura
Get-ChildItem -Recurse -Path .\app\*.tsx | Select-Object FullName
```
