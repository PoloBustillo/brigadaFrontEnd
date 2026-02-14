# Regla 3 — Estado de Respuesta (Response Status)

## 📋 Definición

Una respuesta de encuesta puede estar en 4 estados diferentes que determinan su editabilidad y comportamiento en la aplicación.

## 🎯 Estados de Respuesta

### 1. `draft` (Borrador Local)

- **Descripción**: Respuesta guardada localmente pero no completada
- **Color**: Gris (`#94A3B8`)
- **Ícono**: `create-outline`
- **Editabilidad**: ✅ Siempre editable
- **Caso de uso**: Brigadista comenzó la encuesta pero no la terminó
- **Acción del botón**: "Continuar Borrador"

### 2. `completed` (Lista para Enviar)

- **Descripción**: Respuesta completada localmente, lista para sincronizar
- **Color**: Verde (`#06D6A0`)
- **Ícono**: `checkmark-done-outline`
- **Editabilidad**: ✅ Editable antes de sincronizar
- **Caso de uso**: Encuesta completada pero aún no enviada al servidor
- **Acción del botón**: "Editar Respuesta"

### 3. `synced` (Ya Enviada)

- **Descripción**: Respuesta sincronizada al servidor
- **Color**: Azul (`#00B4D8`)
- **Ícono**: `cloud-done-outline`
- **Editabilidad**: ❌ Solo lectura
- **Caso de uso**: Respuesta ya enviada y registrada en el servidor
- **Acción del botón**: "Ver Respuesta"

### 4. `rejected` (Requiere Corrección)

- **Descripción**: Respuesta rechazada por el supervisor
- **Color**: Rojo (`#EF4444`)
- **Ícono**: `alert-circle-outline`
- **Editabilidad**: ⚠️ Depende de `allowRejectedEdit`
  - Si `allowRejectedEdit === true`: ✅ Puede editar
  - Si `allowRejectedEdit === false`: ❌ No puede editar
- **Caso de uso**: Supervisor encontró errores y solicita corrección
- **Acción del botón**:
  - Si puede editar: "Corregir Respuesta"
  - Si no puede editar: "Esperando Aprobación"

## 🔒 Lógica de Editabilidad

```typescript
function canEditResponse(survey: MySurvey): boolean {
  // No hay estado = nueva respuesta = puede iniciar
  if (!survey.responseStatus) return true;

  const status = survey.responseStatus;

  // Draft: Siempre editable
  if (status === "draft") return true;

  // Completed: Puede editar antes de sincronizar
  if (status === "completed") return true;

  // Synced: Nunca editable (ya enviada)
  if (status === "synced") return false;

  // Rejected: Solo si supervisor lo permite
  if (status === "rejected") {
    return survey.allowRejectedEdit === true;
  }

  return false;
}
```

## 📊 Flujo de Estados

```
        [Brigadista inicia]
                ↓
        ┌─────────────┐
        │   draft     │ ← Guardado local parcial
        └──────┬──────┘
               ↓ [Completa encuesta]
        ┌─────────────┐
        │  completed  │ ← Completada, lista para enviar
        └──────┬──────┘
               ↓ [Sincroniza]
        ┌─────────────┐
        │   synced    │ ← Enviada al servidor
        └──────┬──────┘
               ↓ [Supervisor revisa]
        ┌─────────────┐
        │  rejected   │ ← Requiere corrección
        │ (opcional)  │
        └──────┬──────┘
               ↓ [allowRejectedEdit]
        Si true: Vuelve a draft/completed
        Si false: Bloqueada hasta aprobación
```

## 🎨 Interfaz de Usuario

### Badges de Estado

Cada encuesta activa muestra su estado de respuesta actual con:

- **Badge coloreado** con ícono y label
- **Posición**: Después del badge de status y deadline
- **Visibilidad**: Solo si `responseStatus` existe

### Botón de Acción

El botón principal se adapta según el estado:

| Estado                                  | Color   | Ícono                      | Texto                  | Deshabilitado |
| --------------------------------------- | ------- | -------------------------- | ---------------------- | ------------- |
| No iniciada                             | Verde   | `add-circle`               | "Llenar Encuesta"      | ❌            |
| `draft`                                 | Verde   | `create-outline`           | "Continuar Borrador"   | ❌            |
| `completed`                             | Verde   | `checkmark-circle-outline` | "Editar Respuesta"     | ❌            |
| `synced`                                | Azul    | `eye-outline`              | "Ver Respuesta"        | ✅            |
| `rejected` + `allowRejectedEdit: true`  | Naranja | `hammer-outline`           | "Corregir Respuesta"   | ❌            |
| `rejected` + `allowRejectedEdit: false` | Gris    | `lock-closed-outline`      | "Esperando Aprobación" | ✅            |

## 📝 Datos Mock

Los datos mock incluyen ejemplos de todos los estados:

```typescript
// DRAFT - En progreso
{
  id: 1,
  responseStatus: "draft",
  // ... puede editar
}

// COMPLETED - Lista para enviar
{
  id: 4,
  responseStatus: "completed",
  // ... puede editar antes de sincronizar
}

// SYNCED - Ya enviada
{
  id: 3,
  responseStatus: "synced",
  // ... solo lectura
}

// REJECTED - Con permiso de edición
{
  id: 8,
  responseStatus: "rejected",
  allowRejectedEdit: true,
  // ... puede corregir
}

// REJECTED - Sin permiso de edición
{
  id: 9,
  responseStatus: "rejected",
  allowRejectedEdit: false,
  // ... bloqueada
}
```

## 🔄 Integración con Otras Reglas

### Regla 1 (Filtrado de Encuestas)

- Estado de respuesta no afecta el filtrado
- Solo encuestas ACTIVAS se muestran, independiente del estado de respuesta

### Regla 2 (Ventana de Tiempo)

- **Upcoming**: No puede tener estado de respuesta (no iniciada)
- **Active**: Puede tener cualquier estado
- **Expired**: Generalmente `synced`, eventualmente `draft` o `completed` no enviadas

## 🚀 Comportamiento en `handleStartSurvey`

```typescript
function handleStartSurvey(survey: MySurvey, timeWindow: TimeWindowStatus) {
  const isEditable = canEditResponse(survey);

  // Check time window
  if (timeWindow === "upcoming") {
    // Preview only
    return;
  }

  if (timeWindow === "expired") {
    // Read-only
    return;
  }

  // Check response status
  if (!isEditable) {
    if (survey.responseStatus === "synced") {
      // Navigate to read-only view
      return;
    }
    if (survey.responseStatus === "rejected" && !survey.allowRejectedEdit) {
      // Show waiting message
      return;
    }
  }

  // Navigate to edit/fill screen
  // Mode depends on responseStatus (new, draft, completed, rejected)
}
```

## ✅ Checklist de Implementación

- [x] Definir tipo `ResponseStatus`
- [x] Crear `RESPONSE_STATUS_CONFIG` con colores e íconos
- [x] Agregar `responseStatus` y `allowRejectedEdit` a interfaz `MySurvey`
- [x] Implementar función `canEditResponse()`
- [x] Actualizar datos mock con todos los estados
- [x] Mostrar badge de estado en tarjetas activas
- [x] Actualizar lógica del botón de acción
- [x] Modificar `handleStartSurvey` para considerar editabilidad
- [x] Agregar estilos para badges de estado
- [ ] Implementar pantalla de corrección de respuestas rechazadas
- [ ] Agregar notificaciones cuando una respuesta es rechazada
- [ ] Implementar sincronización de estados con backend

## 📱 Experiencia de Usuario

1. **Brigadista llena encuesta**:
   - Sin estado → "Llenar Encuesta" (verde)
   - Guarda progreso → `draft` "Continuar Borrador" (verde)
   - Completa → `completed` "Editar Respuesta" (verde)

2. **Sincronización**:
   - App sincroniza → `synced` "Ver Respuesta" (azul, deshabilitado)
3. **Rechazo por supervisor** (opcional):
   - Supervisor rechaza → `rejected`
   - Si permite edición: "Corregir Respuesta" (naranja)
   - Si no permite: "Esperando Aprobación" (gris, deshabilitado)

4. **Corrección**:
   - Brigadista corrige → vuelve a `draft`
   - Completa corrección → `completed`
   - Re-sincroniza → `synced`

## 🔐 Consideraciones de Seguridad

- **Validación de permisos**: Verificar en backend que `allowRejectedEdit` es autorizado
- **Integridad de datos**: Prevenir modificación de respuestas `synced` incluso si se hackea el frontend
- **Auditoría**: Registrar todos los cambios de estado y quién los realizó
- **Conflictos**: Manejar caso donde supervisor rechaza mientras brigadista está editando

## 🎯 Beneficios

1. **Claridad**: Usuario siempre sabe en qué estado está su respuesta
2. **Control**: Supervisores pueden solicitar correcciones controladas
3. **Seguridad**: Respuestas sincronizadas no se pueden modificar accidentalmente
4. **Flexibilidad**: Borradores permiten trabajo en progreso
5. **Trazabilidad**: Estados claros facilitan auditoría y debugging
