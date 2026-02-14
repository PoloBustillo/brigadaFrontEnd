# 🔄 Sistema de Notificaciones de Sincronización

## Descripción General

Sistema de badges con animación de pulso que muestra visualmente el estado de sincronización pendiente en las tabs de navegación. Los badges aparecen automáticamente cuando hay items pendientes por sincronizar en cada categoría.

## ✨ Características

### 1. Badges Animados con Pulso

- **Animación continua**: Escala de 1.0 a 1.2 en loop
- **Duración**: 2 segundos por ciclo (1s expand, 1s shrink)
- **Suavidad**: Easing.inOut(Easing.ease) para transiciones naturales

### 2. Contador Visual

- **Número de items**: Muestra cantidad exacta de items pendientes
- **Posición**: Top-right del ícono de la tab
- **Color**: Rojo con borde blanco para máxima visibilidad
- **Tamaño**: Adaptable al número de dígitos

### 3. Mapeo Automático

El sistema mapea automáticamente las rutas a tipos de sincronización:

- `surveys/index` → `pendingByType.surveys`
- `responses/index` → `pendingByType.responses`
- `users/index` → `pendingByType.users`

## 📁 Archivos Clave

### 1. `contexts/sync-context.tsx`

**Propósito**: Gestión del estado de sincronización global

```typescript
interface SyncItem {
  id: string;
  type: "survey" | "response" | "user";
  timestamp: number;
}

interface SyncContextType {
  pendingItems: SyncItem[];
  pendingCount: number;
  pendingByType: {
    surveys: number;
    responses: number;
    users: number;
  };
  addPendingItem: (item: Omit<SyncItem, "timestamp">) => void;
  removePendingItem: (id: string) => void;
  clearPending: () => void;
  syncAll: () => Promise<void>;
  isSyncing: boolean;
}
```

**Métodos clave**:

- `addPendingItem()`: Agrega un item pendiente (timestamp automático)
- `removePendingItem()`: Elimina un item por ID
- `clearPending()`: Limpia todas las pendencias
- `syncAll()`: Sincroniza todo (placeholder para implementación futura)

### 2. `components/ui/custom-tab-bar.tsx`

**Propósito**: Tab bar con badges integrados

**Características del Badge**:

```typescript
// Badge visual
badge: {
  position: "absolute",
  top: -4,
  right: -8,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: "#fff",
}

// Texto del badge
badgeText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "700",
}
```

**Función de mapeo**:

```typescript
const getRouteBadge = (routeName: string): number => {
  if (routeName.includes("surveys")) return pendingByType.surveys;
  if (routeName.includes("responses")) return pendingByType.responses;
  if (routeName.includes("users")) return pendingByType.users;
  return 0;
};
```

### 3. `app/_layout.tsx`

**Propósito**: Proveedor del contexto de sincronización

```tsx
export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <SyncProvider>
          <RootNavigator />
        </SyncProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}
```

## 🎯 Uso en Desarrollo

### Agregar Items Pendientes (Ejemplo)

```typescript
import { useSync } from "@/contexts/sync-context";

function MyComponent() {
  const { addPendingItem, pendingByType } = useSync();

  // Agregar item pendiente
  const handleAddPending = () => {
    addPendingItem({
      id: `survey-${Date.now()}`,
      type: "survey",
    });
  };

  // Ver contadores
  console.log("Pending surveys:", pendingByType.surveys);
}
```

### Eliminar Items Después de Sync

```typescript
const { removePendingItem } = useSync();

// Después de sincronizar exitosamente
const handleSync = async (itemId: string) => {
  try {
    await syncToServer(itemId);
    removePendingItem(itemId); // Elimina el badge
  } catch (error) {
    console.error("Sync failed:", error);
  }
};
```

### Limpiar Todas las Pendencias

```typescript
const { clearPending } = useSync();

// Útil después de sync masivo o logout
clearPending();
```

## 🧪 Testing (Modo Debug)

En `app/(admin)/profile.tsx` hay una sección de debug temporal:

```
🔧 Debug: Probar Sync Badges
Pendientes: Encuestas 0 | Respuestas 0 | Usuarios 0

[+ Encuesta] [+ Respuesta] [+ Usuario] [Limpiar]
```

**Cómo probar**:

1. Ir a perfil de Admin
2. Tocar botones para agregar items de prueba
3. Navegar entre tabs para ver badges animados
4. Usar "Limpiar" para resetear

**Nota**: Esta sección se puede remover en producción eliminando el bloque `debugSection` del profile.tsx.

## 🎨 Personalización

### Cambiar Duración de Pulso

En `custom-tab-bar.tsx`, líneas de animación:

```typescript
Animated.timing(pulseAnim, {
  toValue: 1.2, // Escala máxima
  duration: 1000, // Duración en ms
  easing: Easing.inOut(Easing.ease),
  useNativeDriver: true,
});
```

### Cambiar Color del Badge

```typescript
{hasBadge && (
  <Animated.View
    style={[
      styles.badge,
      {
        backgroundColor: colors.error, // Cambiar aquí
        transform: [{ scale: pulseAnim }],
      },
    ]}
  >
```

### Cambiar Posición del Badge

```typescript
badge: {
  position: "absolute",
  top: -4,    // Ajustar posición vertical
  right: -8,  // Ajustar posición horizontal
  // ...
}
```

## 🔗 Integración con Sincronización Real

Para integrar con un sistema de sync real:

### 1. Al Crear/Modificar Datos Offline

```typescript
// En tu función de crear encuesta/respuesta/usuario
const createSurveyOffline = async (surveyData) => {
  const itemId = uuid();

  // Guardar en SQLite
  await db.insert("surveys", { id: itemId, ...surveyData });

  // Agregar a pendientes
  addPendingItem({
    id: itemId,
    type: "survey",
  });
};
```

### 2. Al Sincronizar

```typescript
const syncPendingItems = async () => {
  const { pendingItems, removePendingItem } = useSync();

  for (const item of pendingItems) {
    try {
      // Sync al servidor
      await api.sync(item.type, item.id);

      // Eliminar de pendientes
      removePendingItem(item.id);
    } catch (error) {
      console.error(`Failed to sync ${item.type}:`, error);
      // Mantener en pendientes para retry
    }
  }
};
```

### 3. Con Network Status

```typescript
import NetInfo from "@react-native-community/netinfo";

const { syncAll } = useSync();

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    // Auto-sync cuando vuelve conexión
    syncAll();
  }
});
```

## 📱 Roles Soportados

El sistema funciona en todos los layouts de tabs:

- ✅ `(admin)/_layout.tsx` - 4 tabs con sync
- ✅ `(brigadista)/_layout.tsx` - Tabs relevantes
- ✅ `(encargado)/_layout.tsx` - Tabs relevantes

Cada layout automáticamente muestra badges en las tabs que tengan contenido pendiente.

## 🚀 Próximas Mejoras

1. **Persistencia**: Guardar pendientes en AsyncStorage
2. **Retry Logic**: Reintentos automáticos con backoff exponencial
3. **Priority Sync**: Sincronizar items críticos primero
4. **Conflict Resolution**: Manejo de conflictos en sync
5. **Progress Tracking**: Barra de progreso durante sync masivo
6. **Network Awareness**: Pausar/reanudar según conectividad
7. **Batch Sync**: Sincronizar múltiples items en una request

## 🎓 Arquitectura

```
┌─────────────────────────────────────────┐
│         SyncProvider (Context)          │
│  ┌────────────────────────────────┐    │
│  │ State: pendingItems[]          │    │
│  │ Computed: pendingByType        │    │
│  │ Methods: add/remove/clear      │    │
│  └────────────────────────────────┘    │
└───────────────┬─────────────────────────┘
                │ provides useSync()
                ↓
┌─────────────────────────────────────────┐
│         CustomTabBar Component          │
│  ┌────────────────────────────────┐    │
│  │ useSync() → pendingByType      │    │
│  │ getRouteBadge(routeName)       │    │
│  │ ↓                              │    │
│  │ TabButton badge={count}        │    │
│  └────────────────────────────────┘    │
└───────────────┬─────────────────────────┘
                │ renders with animation
                ↓
┌─────────────────────────────────────────┐
│           Badge with Pulse              │
│  ┌────────────────────────────────┐    │
│  │ Animated.View                  │    │
│  │ - Loop scale 1.0 → 1.2         │    │
│  │ - Shows count number           │    │
│  │ - Red background + white text  │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## ✅ Checklist de Implementación

- [x] Crear SyncContext con estado global
- [x] Agregar SyncProvider a root layout
- [x] Implementar animación de pulso en badge
- [x] Mapear rutas a tipos de sync
- [x] Integrar useSync en CustomTabBar
- [x] Agregar contador visual en badge
- [x] Crear sección de debug para testing
- [ ] Implementar persistencia en AsyncStorage
- [ ] Conectar con lógica de sync real
- [ ] Agregar manejo de errores
- [ ] Implementar auto-sync con network listener

## 🎉 Estado Actual

**✅ Sistema completamente funcional** con:

- Badges animados con pulso continuo
- Contadores precisos por categoría
- Interfaz de debug para testing
- Integración completa con theme system
- Soporte para todos los roles

El sistema está listo para conectarse con la lógica de sincronización real.
