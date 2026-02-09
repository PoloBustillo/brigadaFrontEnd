# Instalación de Fuentes para Splash Screen

## Fuente Principal: Pacifico

La pantalla de Splash utiliza la fuente **Pacifico** de Google Fonts para el logo "brigadaDigital".

### Pasos de Instalación

#### 1. Descargar la Fuente

Visita: https://fonts.google.com/specimen/Pacifico

O descarga directamente: https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf

#### 2. Crear Carpeta de Fuentes

```bash
mkdir -p assets/fonts
```

#### 3. Colocar el Archivo

Coloca `Pacifico-Regular.ttf` en:

```
assets/fonts/Pacifico-Regular.ttf
```

#### 4. Configurar expo-font

El archivo ya está configurado en `splash-screen.tsx`:

```tsx
const [fontsLoaded] = useFonts({
  Pacifico: require("../../assets/fonts/Pacifico-Regular.ttf"),
});
```

### Fuentes Alternativas (Opcional)

Si prefieres otra fuente similar a Lemonade, también puedes usar:

#### Satisfy

- URL: https://fonts.google.com/specimen/Satisfy
- Más elegante y cursiva

#### Cookie

- URL: https://fonts.google.com/specimen/Cookie
- Casual y moderna

#### Dancing Script

- URL: https://fonts.google.com/specimen/Dancing+Script
- Popular para branding

### Cambiar la Fuente

Para cambiar a otra fuente, edita en `splash-screen.tsx`:

```tsx
// Cambiar de Pacifico a Satisfy
const [fontsLoaded] = useFonts({
  'MyLogo': require('../../assets/fonts/Satisfy-Regular.ttf'),
});

// Y actualiza el estilo
logo: {
  fontFamily: 'MyLogo', // <- Cambiar aquí también
  fontSize: 48,
  // ...
}
```

### Verificar Instalación

La fuente se cargará automáticamente al iniciar la app. Si hay un error, verás un warning en la consola:

```
Unable to load font: Pacifico
```

### Troubleshooting

#### Problema: Fuente no se muestra

**Solución 1**: Verifica que el archivo existe en la ruta correcta

```bash
ls -la assets/fonts/Pacifico-Regular.ttf
```

**Solución 2**: Limpia la caché de Expo

```bash
npx expo start -c
```

**Solución 3**: Verifica que el path en el require() es correcto

- Desde `components/layout/splash-screen.tsx`
- Path relativo: `../../assets/fonts/Pacifico-Regular.ttf`

#### Problema: App se queda en blanco

El componente espera a que la fuente cargue. Si falla, retorna `null`.

Puedes agregar un fallback:

```tsx
if (!fontsLoaded) {
  return <ActivityIndicator />; // En lugar de null
}
```

### Licencia

Pacifico es una fuente de código abierto bajo licencia **SIL Open Font License**.

✅ Uso comercial permitido  
✅ Modificación permitida  
✅ Distribución permitida

Más info: https://scripts.sil.org/OFL
