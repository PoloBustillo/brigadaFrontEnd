# Solución Alternativa: react-native-keyboard-aware-scroll-view

Si el scroll manual no funciona correctamente, usa esta biblioteca popular (16k+ estrellas en GitHub):

## 1. Instalación

```bash
npm install react-native-keyboard-aware-scroll-view
```

## 2. Modificar login-enhanced.tsx

Reemplaza las importaciones:

```typescript
// ANTES
import { ScrollView, ... } from "react-native";

// DESPUÉS
import { View, ... } from "react-native"; // Quita ScrollView
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
```

Reemplaza el ScrollView:

```typescript
// ANTES
<ScrollView
  ref={scrollViewRef}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  scrollEventThrottle={16}
>

// DESPUÉS
<KeyboardAwareScrollView
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  enableOnAndroid={true}
  enableAutomaticScroll={true}
  extraScrollHeight={20}
  keyboardOpeningTime={0}
>
```

## 3. ELIMINAR el código manual

Ya no necesitas:

- `scrollViewRef`
- `emailInputRef`, `passwordInputRef`
- Función `scrollToInput`
- Props `onFocus={() => scrollToInput(...)}`
- Los `<View ref={...}>` envolviendo los inputs

La biblioteca lo maneja automáticamente! 🎯

## 4. Lo mismo para create-password.tsx

Aplica los mismos cambios.

## Ventajas de esta biblioteca:

✅ **Probada en producción** - Miles de apps la usan
✅ **Multiplataforma** - iOS y Android
✅ **Cero configuración** - Funciona automáticamente
✅ **Mantenida activamente** - Updates regulares
✅ **Soporte para todos los inputs** - TextInput, cualquier componente

## Repositorio oficial:

https://github.com/APSL/react-native-keyboard-aware-scroll-view
