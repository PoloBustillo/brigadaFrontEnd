# 📦 Dependencias Recomendadas para Brigada Frontend

## 🎯 Esenciales para el Proyecto

### Estado Global

```bash
npm install zustand
```

- **Zustand**: Estado global lightweight y sin boilerplate

### Validación

```bash
npm install zod
npm install react-hook-form
```

- **Zod**: Validación de schemas TypeScript-first
- **React Hook Form**: Solo para login y formularios simples (NO para encuestas dinámicas)

> ⚠️ **Nota importante**: Las preguntas de encuestas NO usan React Hook Form.  
> Usan el sistema custom con `QuestionRenderer` + `SurveyEngine` + `useSurveyStore()`.

### Red y Conectividad

```bash
npx expo install @react-native-community/netinfo
```

- **NetInfo**: Detectar estado de la red (WiFi/cellular/offline)

### HTTP Client

```bash
npm install axios
```

- **Axios**: Cliente HTTP con interceptores y reintentos

### Caché y Sincronización

```bash
npm install @tanstack/react-query
```

- **React Query**: Cache, sincronización y estado del servidor

### Fechas

```bash
npm install date-fns
```

- **date-fns**: Manejo de fechas moderno y tree-shakeable

### Permisos y Sensores

```bash
npx expo install expo-location
npx expo install expo-image-picker
npx expo install expo-camera
```

- **expo-location**: GPS para preguntas de ubicación
- **expo-image-picker**: Cámara y galería para preguntas de foto
- **expo-camera**: Control avanzado de cámara

### UI y Animaciones

```bash
npm install react-native-reanimated
npm install react-native-gesture-handler
```

- **Reanimated**: Animaciones de 60fps nativas
- **Gesture Handler**: Gestos táctiles optimizados

### Iconos

```bash
npx expo install @expo/vector-icons
```

- **Vector Icons**: Íconos de Material, FontAwesome, etc.

## 📋 Comando de Instalación Completo

```bash
# Instalar todas las dependencias de una vez
npm install zustand zod axios @tanstack/react-query date-fns

# React Hook Form - SOLO para login y formularios simples (opcional)
npm install react-hook-form

# Instalar dependencias de Expo
npx expo install @react-native-community/netinfo expo-location expo-image-picker expo-camera @expo/vector-icons react-native-reanimated react-native-gesture-handler
```

> 💡 **Tip**: Puedes omitir `react-hook-form` inicialmente y agregarlo solo cuando implementes login.

## 🔧 Configuración Post-Instalación

### 1. React Native Reanimated

Agregar plugin en `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"], // ← Agregar esto
  };
};
```

### 2. Permisos en app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to access your location for survey geolocation."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera for survey photos."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos for survey attachments."
        }
      ]
    ]
  }
}
```

## 📊 Dependencias Actuales vs Recomendadas

| Categoría           | Actual              | Recomendado          | Estado      |
| ------------------- | ------------------- | -------------------- | ----------- |
| Estado Global       | ❌ Ninguno          | ✅ Zustand           | ⚠️ Instalar |
| Validación          | ❌ Ninguno          | ✅ Zod               | ⚠️ Instalar |
| Forms (login)       | ❌ Ninguno          | ✅ RHF (opcional)    | 🔵 Después  |
| Red                 | ❌ Ninguno          | ✅ NetInfo           | ⚠️ Instalar |
| HTTP                | ❌ fetch nativo     | ✅ Axios             | ⚠️ Instalar |
| Cache               | ❌ Ninguno          | ✅ React Query       | ⚠️ Instalar |
| Fechas              | ❌ Date nativo      | ✅ date-fns          | ⚠️ Instalar |
| GPS                 | ❌ Ninguno          | ✅ expo-location     | ⚠️ Instalar |
| Cámara              | ❌ Ninguno          | ✅ expo-image-picker | ⚠️ Instalar |
| Base de datos       | ✅ Drizzle + SQLite | ✅ Drizzle + SQLite  | ✅ Listo    |
| Encuestas dinámicas | ❌ Ninguno          | ✅ Custom System     | ✅ Listo    |

> **Leyenda**:
>
> - ✅ Listo = Ya implementado
> - ⚠️ Instalar = Necesario ahora
> - 🔵 Después = Instalar cuando implementes esa feature

## 🚀 Orden de Implementación Sugerido

### Fase 1: Fundación (Semana 1)

1. ✅ Instalar Zustand
2. ✅ Instalar date-fns
3. ✅ Crear stores básicos

### Fase 2: Validación (Semana 1-2)

4. Instalar Zod
5. Implementar validadores de preguntas (usar utils/validation.ts)
6. Integrar validación en question-renderer

> ⚠️ **React Hook Form**: NO instalar ahora. Solo cuando implementes login/registro.

### Fase 3: Sincronización (Semana 2-3)

7. Instalar NetInfo
8. Instalar Axios
9. Instalar React Query
10. Implementar sync-engine

### Fase 4: Multimedia (Semana 3-4)

11. Instalar expo-location
12. Instalar expo-image-picker
13. Implementar location-question y photo-question

### Fase 5: UI/UX (Semana 4)

14. Instalar Reanimated
15. Mejorar animaciones de transiciones
16. Pulir experiencia de usuario

## 🔗 Referencias

- **Zustand**: https://docs.pmnd.rs/zustand
- **Zod**: https://zod.dev
- **React Hook Form**: https://react-hook-form.com
- **React Query**: https://tanstack.com/query/latest
- **date-fns**: https://date-fns.org
- **Expo Location**: https://docs.expo.dev/versions/latest/sdk/location/
- **Expo Image Picker**: https://docs.expo.dev/versions/latest/sdk/imagepicker/

---

**Última actualización**: Febrero 2026
