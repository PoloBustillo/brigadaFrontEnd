# 📋 Guía: Prevenir que la Tab Bar tape contenido

## ✅ Ya implementado en:

- `app/(admin)/index.tsx` ← Ejemplo de referencia

## 🎯 Hook disponible

Se ha creado el hook `useTabBarHeight` que calcula automáticamente el espacio que ocupa la tab bar.

### Uso básico:

```tsx
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";

export default function TuPantalla() {
  const { contentPadding } = useTabBarHeight();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: contentPadding }}>
      {/* Tu contenido */}
    </ScrollView>
  );
}
```

## 📝 Pantallas que necesitan esta actualización:

### Admin:

- [x] `app/(admin)/index.tsx` ✅ Ya configurado
- [ ] `app/(admin)/surveys/index.tsx`
- [ ] `app/(admin)/users/index.tsx`
- [ ] `app/(admin)/responses/index.tsx`
- [ ] `app/(admin)/profile.tsx`

### Brigadista:

- [ ] `app/(brigadista)/index.tsx`
- [ ] `app/(brigadista)/my-surveys.tsx`
- [ ] `app/(brigadista)/responses/index.tsx`
- [ ] `app/(brigadista)/profile.tsx`

### Encargado:

- [ ] `app/(encargado)/index.tsx`
- [ ] `app/(encargado)/surveys/index.tsx`
- [ ] `app/(encargado)/team.tsx`
- [ ] `app/(encargado)/responses/index.tsx`
- [ ] `app/(encargado)/profile.tsx`

## 🔧 Pasos para aplicar:

### 1. Importar el hook

```tsx
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
```

### 2. Usar el hook en tu componente

```tsx
const { contentPadding } = useTabBarHeight();
```

### 3. Aplicar al ScrollView principal

**Si ya tienes `contentContainerStyle`:**

```tsx
<ScrollView
  contentContainerStyle={[styles.content, { paddingBottom: contentPadding }]}
>
```

**Si no tienes estilos:**

```tsx
<ScrollView
  contentContainerStyle={{ paddingBottom: contentPadding }}
>
```

**Si usas `View` en lugar de `ScrollView`:**

```tsx
<View style={[styles.container, { paddingBottom: contentPadding }]}>
```

### 4. Remover paddingBottom hardcodeado

Si tu estilo tenía `paddingBottom: 100` o similar, puedes removerlo:

```tsx
// Antes:
content: {
  padding: 20,
  paddingBottom: 100, // ❌ Remover
}

// Después:
content: {
  padding: 20, // ✅ Sin paddingBottom fijo
}
```

## 🎨 Tab Bar mejorada

La tab bar ahora es:

- ✅ Más translúcida
- ✅ Ocupa menos espacio vertical
- ✅ Iconos perfectamente centrados
- ✅ Labels dinámicos (solo visible en tab activo)
- ✅ Blur premium iOS-style

## 📊 Hook: Valores disponibles

```tsx
const {
  tabBarHeight, // Altura total de la tab bar
  contentPadding, // Padding recomendado (con margen extra)
  bottomInset, // Safe area bottom del dispositivo
} = useTabBarHeight();
```

Para la mayoría de casos, usa `contentPadding`.
