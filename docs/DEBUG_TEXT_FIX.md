# 🔍 Debug: Texto "brigadaDigital" Cortado

## Estado Actual de los Cambios

### Splash Screen (splash-screen.tsx)

```typescript
logoContainer: {
  paddingHorizontal: 50, // 100px total
}
logo: {
  fontSize: 46,
  letterSpacing: -0.5, // NEGATIVO
}
// En el componente:
<Text ...>brigadaDigital{' '}</Text> // Espacio extra
```

### Login (login-enhanced.tsx)

```typescript
header: {
  paddingHorizontal: 50, // 100px total
}
logo: {
  fontSize: 46,
  letterSpacing: -0.5, // NEGATIVO
}
// En el componente:
<Text ...>brigadaDigital{' '}</Text> // Espacio extra
```

## 🧪 Si el Texto AÚN Se Corta

### Opción 1: Reducir MÁS el fontSize

```typescript
logo: {
  fontSize: 44, // o incluso 42
  letterSpacing: -0.5,
}
```

### Opción 2: Usar `scale` en transform

```typescript
logo: {
  fontSize: 52, // tamaño original
  transform: [{ scaleX: 0.9 }], // Comprimir horizontalmente
}
```

### Opción 3: Cambiar a fuente del sistema

Si Pacifico simplemente no funciona, usa:

```typescript
logo: {
  fontFamily: Platform.select({
    ios: "Avenir-Heavy",
    android: "sans-serif-medium",
  }),
  fontSize: 52,
  fontStyle: "italic",
}
```

### Opción 4: Texto más corto

```typescript
<Text ...>brigada Digital</Text> // Con espacio en medio
// o
<Text ...>brigada</Text>
<Text ...>Digital</Text> // Dos líneas
```

## 📱 Cómo Verificar

1. Abre la app en tu dispositivo/simulador
2. Ve al splash screen primero
3. Luego ve a login
4. Toma screenshot de AMBOS
5. Comparte los screenshots

Si se sigue cortando después de estos cambios, el problema es la fuente Pacifico en sí.
