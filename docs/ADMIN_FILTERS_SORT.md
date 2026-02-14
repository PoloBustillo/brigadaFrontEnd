# Admin Dashboard - Filtros y Ordenamiento

## 📋 Descripción General

Se agregaron funcionalidades de **filtros avanzados** y **ordenamiento** al dashboard de administración. La interfaz está completamente implementada y funcional, pero **la lógica de filtrado y ordenamiento real está pendiente**.

---

## 🎯 Funcionalidades Implementadas

### 1. **Modal de Filtros**

- ✅ Botón "Filtros" con badge de conteo de filtros activos
- ✅ Modal animado desde abajo con categorías seleccionables
- ✅ Sistema de chips para seleccionar múltiples categorías
- ✅ Placeholders para filtros adicionales:
  - 🚧 Rango de fechas (por implementar)
  - 🚧 Rango de respuestas (min-max) (por implementar)
- ✅ Botones "Limpiar" y "Aplicar filtros"
- ✅ Estado persistente de filtros seleccionados

### 2. **Modal de Ordenamiento**

- ✅ Botón "Ordenar" que abre modal de opciones
- ✅ 6 opciones de ordenamiento disponibles:
  - Más recientes primero (`date-desc`)
  - Más antiguos primero (`date-asc`)
  - Nombre A-Z (`name-asc`)
  - Nombre Z-A (`name-desc`)
  - Más respuestas (`responses-desc`)
  - Menos respuestas (`responses-asc`)
- ✅ Indicación visual de opción seleccionada
- ✅ Selección persiste tras cerrar modal

---

## 📦 Estado Agregado

```typescript
// Controles de modales
const [showFiltersModal, setShowFiltersModal] = useState(false);
const [showSortModal, setShowSortModal] = useState(false);

// Ordenamiento seleccionado
const [selectedSort, setSelectedSort] = useState<SortOption>("date-desc");

// Filtros activos
const [filters, setFilters] = useState<FilterOptions>({
  categories: [],
  dateRange: { start: null, end: null },
  responseRange: { min: null, max: null },
});
```

---

## 🔄 Flujo de Usuario

### **Filtros:**

1. Usuario toca botón "Filtros"
2. Modal se desliza desde abajo
3. Usuario selecciona categorías (toggle múltiple)
4. Usuario puede limpiar o aplicar filtros
5. Badge muestra número de categorías seleccionadas

### **Ordenamiento:**

1. Usuario toca botón "Ordenar"
2. Modal muestra 6 opciones con checkmark en selección actual
3. Al tocar una opción, se actualiza y cierra el modal automáticamente
4. Selección persiste visualmente

---

## 🚧 Pendiente de Implementación

### **Lógica de Filtrado (TODO en línea ~320)**

```typescript
// TODO: Apply advanced filters from FilterOptions
// - Filter by categories: filters.categories
// - Filter by date range: filters.dateRange.start and filters.dateRange.end
// - Filter by response range: filters.responseRange.min and filters.responseRange.max
```

**Donde implementar:**

- Modificar `filteredSurveys` para aplicar `filters.categories`
- Agregar lógica de filtrado por fecha usando `filters.dateRange`
- Agregar lógica de filtrado por respuestas usando `filters.responseRange`

### **Lógica de Ordenamiento (TODO en línea ~327)**

```typescript
// TODO: Apply sorting based on selectedSort
// - "date-desc": Sort by date, newest first
// - "date-asc": Sort by date, oldest first
// - "name-asc": Sort alphabetically A-Z
// - "name-desc": Sort alphabetically Z-A
// - "responses-desc": Sort by responses, highest first
// - "responses-asc": Sort by responses, lowest first
```

**Donde implementar:**

- Agregar función `sortSurveys(surveys, selectedSort)` que retorne array ordenado
- Aplicar después de filtrado: `const sortedSurveys = sortSurveys(filteredSurveys, selectedSort)`

### **Filtros Adicionales (UI Placeholder)**

- 🚧 **Selector de rango de fechas**: Requiere date picker component
- 🚧 **Selector de rango de respuestas**: Requiere range slider o inputs numéricos

---

## 🎨 Componentes UI Agregados

### **Modal de Filtros**

- Header con título y botón de cerrar
- Sección de categorías con chips interactivos
- Placeholders para futuros filtros
- Footer con botones de acción

### **Modal de Ordenamiento**

- Header con título y botón de cerrar
- Lista de opciones con selección única
- Checkmark visual en opción activa
- Auto-cierre al seleccionar

---

## 📝 Ejemplo de Implementación Futura

### **Aplicar Filtros:**

```typescript
let result = surveys;

// Filtrar por categorías
if (filters.categories.length > 0) {
  result = result.filter((s) => filters.categories.includes(s.category));
}

// Filtrar por rango de fechas
if (filters.dateRange.start || filters.dateRange.end) {
  result = result.filter((s) => {
    const surveyDate = new Date(s.date);
    if (
      filters.dateRange.start &&
      surveyDate < new Date(filters.dateRange.start)
    )
      return false;
    if (filters.dateRange.end && surveyDate > new Date(filters.dateRange.end))
      return false;
    return true;
  });
}

// Filtrar por rango de respuestas
if (filters.responseRange.min !== null || filters.responseRange.max !== null) {
  result = result.filter((s) => {
    if (
      filters.responseRange.min !== null &&
      s.responses < filters.responseRange.min
    )
      return false;
    if (
      filters.responseRange.max !== null &&
      s.responses > filters.responseRange.max
    )
      return false;
    return true;
  });
}
```

### **Aplicar Ordenamiento:**

```typescript
const sortSurveys = (surveys: SurveyCardProps[], sortBy: SortOption) => {
  const sorted = [...surveys];

  switch (sortBy) {
    case "date-desc":
      return sorted.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    case "date-asc":
      return sorted.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    case "name-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "name-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "responses-desc":
      return sorted.sort((a, b) => b.responses - a.responses);
    case "responses-asc":
      return sorted.sort((a, b) => a.responses - b.responses);
    default:
      return sorted;
  }
};
```

---

## ✨ Características de UX

- ✅ **Haptic feedback** en todas las interacciones
- ✅ **Animaciones suaves** al abrir/cerrar modales
- ✅ **Indicadores visuales** de estado seleccionado
- ✅ **Diseño responsive** con tema dinámico
- ✅ **Accesibilidad**: Botón de cerrar en todos los modales
- ✅ **Badge de conteo** en filtros activos

---

## 📍 Archivos Modificados

- `app/(admin)/index.tsx` - Dashboard principal con modales de filtros y ordenamiento

---

## 🔜 Próximos Pasos

1. **Implementar lógica de filtrado** en `filteredSurveys`
2. **Implementar lógica de ordenamiento** con función helper
3. **Agregar date picker** para rango de fechas
4. **Agregar range slider** para número de respuestas
5. **Conectar con datos reales** desde API/Supabase
6. **Agregar persistencia** de filtros/ordenamiento (AsyncStorage o estado global)

---

## 📚 Referencias

- Tipo `FilterOptions` define estructura de filtros
- Tipo `SortOption` define opciones de ordenamiento disponibles
- Categorías disponibles en `availableCategories` array
- TODOs marcados claramente en el código para implementación futura
