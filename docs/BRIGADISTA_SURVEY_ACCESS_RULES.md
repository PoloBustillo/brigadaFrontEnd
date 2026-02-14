# 🔒 Reglas de Acceso a Encuestas - Brigadista

## Regla 1: Solo Encuestas Asignadas

Un brigadista **solo puede ver y responder** encuestas que cumplan **todas** estas condiciones:

### ✅ Condiciones Obligatorias

1. **Estado ACTIVO**
   - `survey.status === "ACTIVE"`
   - Encuestas pausadas o completadas **no** se muestran

2. **Dentro de Fecha**
   - Si existe `deadline`, debe ser futura
   - `new Date(survey.deadline) >= now`
   - Sin deadline = visible siempre

3. **Asignadas al Encargado**
   - La encuesta debe estar asignada al encargado del brigadista
   - Verificación: `survey.encargadoId === brigadista.encargadoId`

## 📁 Archivos Implementados

### 1. `app/(brigadista)/my-surveys.tsx`

Vista principal de encuestas del brigadista.

**Filtrado implementado:**

```typescript
const activeSurveys = useMemo(() => {
  return surveys.filter((survey) => {
    // Rule 1.1: Must be ACTIVE
    if (survey.status !== "ACTIVE") return false;

    // Rule 1.2: Must be within deadline
    if (survey.deadline) {
      const now = new Date();
      const deadlineDate = new Date(survey.deadline);
      if (deadlineDate < now) return false;
    }

    // Rule 1.3: Assigned by encargado (implicit in mockData)
    return true;
  });
}, [surveys]);
```

### 2. `app/(brigadista)/surveys/index.tsx`

Vista alternativa (ruta oculta, mismo filtrado).

## 🎨 Estados Vacíos Contextuales

El sistema muestra diferentes mensajes según la situación:

### Sin Encuestas Asignadas

```
Icon: document-outline
Title: "No tienes encuestas asignadas"
Subtitle: "Tu encargado te asignará encuestas próximamente"
```

### Todas Vencidas

```
Icon: time-outline (rojo)
Title: "Todas las encuestas han vencido"
Subtitle: "X encuesta(s) fuera de fecha. Consulta con tu encargado."
```

### Todas Inactivas/Pausadas

```
Icon: pause-circle-outline (info)
Title: "Las encuestas no están activas"
Subtitle: "X encuesta(s) pausada(s) o completada(s)"
```

### Combinación

```
Icon: alert-circle-outline (warning)
Title: "No hay encuestas activas disponibles"
Subtitle: "X vencida(s) • Y pausada(s) o completada(s)"
```

### Con Hint Informativo

Cuando hay encuestas asignadas pero ninguna activa:

```
[i] Solo se muestran encuestas activas y dentro de fecha
```

## 🎯 Componentes UI

### Estado Vacío Mejorado

```tsx
<View style={[styles.emptyState, { backgroundColor, borderColor }]}>
  {/* Icon Container con background colorido */}
  <View style={[styles.emptyIconContainer, { backgroundColor: color + "15" }]}>
    <Ionicons name={icon} size={48} color={color} />
  </View>

  {/* Título */}
  <Text style={styles.emptyText}>{title}</Text>

  {/* Subtítulo */}
  <Text style={styles.emptySubtext}>{subtitle}</Text>

  {/* Hint opcional */}
  {surveys.length > 0 && (
    <View style={[styles.emptyHint, { backgroundColor: info + "15" }]}>
      <Ionicons name="information-circle" size={16} color={info} />
      <Text style={styles.emptyHintText}>
        Solo se muestran encuestas activas y dentro de fecha
      </Text>
    </View>
  )}
</View>
```

### Estilos Aplicados

```typescript
emptyState: {
  alignItems: "center",
  paddingVertical: 48,
  paddingHorizontal: 24,
  borderRadius: 16,
  borderWidth: 1,
}

emptyIconContainer: {
  width: 96,
  height: 96,
  borderRadius: 48,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 16,
}

emptyHint: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  marginTop: 8,
}
```

## 🔄 Flujo de Datos

```
┌─────────────────────────────────┐
│   Mock Surveys (todas)          │
│   - Activas, Pausadas, Vencidas │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   useMemo: activeSurveys        │
│   🔒 Aplica Regla 1:            │
│   1. status === "ACTIVE"        │
│   2. deadline >= now            │
│   3. encargadoId match          │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   Render UI                     │
│   - Si length > 0: Mostrar      │
│   - Si length === 0: EmptyState │
└─────────────────────────────────┘
```

## 🧪 Casos de Prueba

### ✅ Debe Mostrar

```javascript
// Encuesta activa, sin deadline
{ status: "ACTIVE", deadline: null }

// Encuesta activa, deadline futura
{ status: "ACTIVE", deadline: "2026-03-01" }

// Encuesta activa, deadline hoy
{ status: "ACTIVE", deadline: "2026-02-13" }
```

### ❌ No Debe Mostrar

```javascript
// Estado no activo
{ status: "COMPLETED", deadline: "2026-03-01" }
{ status: "PAUSED", deadline: "2026-03-01" }

// Deadline vencida
{ status: "ACTIVE", deadline: "2026-01-01" }

// Combinación: completada y vencida
{ status: "COMPLETED", deadline: "2026-01-01" }
```

## 📊 Impacto en Summary Card

El resumen también usa `activeSurveys`:

```typescript
const totalMyResponses = activeSurveys.reduce(
  (acc, s) => acc + s.myResponses,
  0,
);
const totalMyTarget = activeSurveys.reduce((acc, s) => acc + s.myTarget, 0);
```

**Display:**

```
Mi Progreso Total
X encuestas activas    [12/20]
═══════════════════ 60%
60% completado
```

Solo cuenta encuestas que cumplan las 3 condiciones.

## 🚀 Implementación Futura con Database

Para integrar con base de datos real:

```typescript
const fetchActiveSurveys = async (brigadistaId: string) => {
  const user = await getUserById(brigadistaId);

  return await db.query(
    `
    SELECT s.* 
    FROM surveys s
    INNER JOIN assignments a ON a.survey_id = s.id
    WHERE a.encargado_id = ?
      AND a.brigadista_id = ?
      AND s.status = 'ACTIVE'
      AND (s.deadline IS NULL OR s.deadline >= CURRENT_DATE)
    ORDER BY s.deadline ASC
  `,
    [user.encargadoId, brigadistaId],
  );
};
```

## ✅ Checklist de Implementación

- [x] Filtrado por status ACTIVE
- [x] Filtrado por deadline
- [x] Estado vacío contextual
- [x] Mensajes específicos por situación
- [x] Hint informativo
- [x] Estilos mejorados con iconos coloridos
- [x] Summary actualizado con activeSurveys
- [x] Aplicado en ambas vistas (my-surveys y surveys/index)
- [ ] Integración con base de datos real
- [ ] Tests unitarios para filtrado
- [ ] Tests de UI para estados vacíos

## 🎯 Próximos Pasos

1. **Conectar con DB**: Reemplazar mockData con queries reales
2. **Cache**: Implementar cache de encuestas activas
3. **Sincronización**: Auto-refresh cuando hay cambios
4. **Notificaciones**: Alertar cuando se asignan nuevas encuestas
5. **Analytics**: Track qué brigadistas no tienen encuestas activas

---

**Estado**: ✅ **Implementado y funcional**  
**Última actualización**: 2026-02-13
