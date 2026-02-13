# 🧪 Usuarios de Prueba - Brigada Digital

Esta guía describe todos los usuarios mock disponibles para probar diferentes roles y funcionalidades de la aplicación.

## 📋 Usuarios Disponibles

### 1. 👨‍💼 Administrador

**Credenciales:**

```
Email: admin@brigada.com
Password: admin123
```

**Características:**

- Rol: `ADMIN`
- Estado: `ACTIVE`
- Acceso completo al sistema
- Dashboard con métricas generales
- Gestión de usuarios, encuestas y asignaciones

**Pantallas:**

- Dashboard principal con estadísticas
- Gestión de usuarios
- Gestión de encuestas
- Gestión de asignaciones
- Ver todas las respuestas

---

### 2. 👥 Encargado de Equipo

**Credenciales:**

```
Email: encargado@brigada.com
Password: encargado123
```

**Características:**

- Rol: `ENCARGADO`
- Estado: `ACTIVE`
- Gestiona un equipo de brigadistas
- Asigna encuestas a su equipo
- Monitorea progreso del equipo

**Pantallas:**

- Dashboard con vista del equipo
- Lista de miembros del equipo con progreso
- Encuestas asignadas
- Crear asignaciones
- Ver respuestas del equipo

**Mock Data:**

- 8 miembros en el equipo
- 5 encuestas asignadas
- 124 respuestas totales
- 78% de progreso general

---

### 3. 🚶 Brigadista (Activo)

**Credenciales:**

```
Email: brigadista@brigada.com
Password: brigadista123
```

**Características:**

- Rol: `BRIGADISTA`
- Estado: `ACTIVE`
- Usuario de campo
- Completa encuestas asignadas
- Trabaja offline con sincronización

**Pantallas:**

- Dashboard con encuestas asignadas
- Estado de sincronización
- Lista de asignaciones con prioridades
- Completar respuestas
- Ver mis respuestas

**Mock Data:**

- 18 encuestas completadas
- 5 encuestas pendientes
- 23 encuestas totales
- 2 respuestas sin sincronizar
- 3 asignaciones activas con diferentes prioridades

---

### 4. 🔄 Usuario de Activación (Pruebas)

**Credenciales:**

```
Email: test@brigada.com
Password: cualquiera
```

**Características:**

- Rol: `BRIGADISTA`
- Estado: `INVITED`
- Para probar flujo de activación
- Primera vez: necesita código de activación
- Segunda vez: completa registro

**Uso:**
Este usuario está diseñado para probar el flujo completo de activación de nuevos usuarios.

---

## 🎯 Casos de Uso

### Probar Diferentes Roles

1. **Como Admin:**
   - Login con `admin@brigada.com`
   - Ver dashboard completo
   - Gestionar recursos globales

2. **Como Encargado:**
   - Login con `encargado@brigada.com`
   - Ver tu equipo
   - Asignar encuestas
   - Monitorear progreso

3. **Como Brigadista:**
   - Login con `brigadista@brigada.com`
   - Ver encuestas asignadas
   - Completar respuestas
   - Ver estado de sincronización

### Probar Flujo de Activación

1. Login con `test@brigada.com`
2. Ingresar código de activación
3. Completar perfil
4. Acceder a la app

---

## 🔐 Whitelist

Los siguientes emails están en la whitelist de prueba:

- `admin@brigada.com`
- `encargado@brigada.com`
- `brigadista@brigada.com`
- `test@brigada.com`

Cualquier otro email será rechazado durante el login.

---

## 📱 Navegación por Rol

### Admin (`/(admin)`)

```
├── index.tsx          → Dashboard principal
├── users/            → Gestión de usuarios
├── surveys/          → Gestión de encuestas
├── assignments.tsx   → Asignaciones
└── responses/        → Ver respuestas
```

### Encargado (`/(encargado)`)

```
├── index.tsx          → Dashboard del equipo
├── team/             → Gestión del equipo
├── surveys/          → Encuestas asignadas
├── assignments.tsx   → Crear asignaciones
└── responses/        → Respuestas del equipo
```

### Brigadista (`/(brigadista)`)

```
├── index.tsx          → Mis encuestas
├── my-surveys.tsx    → Lista de asignaciones
├── surveys/          → Completar encuestas
└── responses/        → Mis respuestas
```

---

## 🎨 Características de los Dashboards

### Todos los Dashboards Tienen:

✅ **Design System moderno:** Cards limpios y organizados
✅ **Theme dinámico:** Soporte full para dark/light mode
✅ **Mock data realista:** Datos de prueba significativos
✅ **Refresh:** Pull-to-refresh habilitado
✅ **Haptic feedback:** Retroalimentación táctil
✅ **Navegación:** Links a secciones relevantes

### Características Específicas:

**Admin:**

- Métricas generales del sistema
- Vista de todas las encuestas
- Filtros por estado
- Quick actions

**Encargado:**

- Tarjetas de miembros del equipo
- Indicadores de estado (activo/inactivo/offline)
- Barras de progreso por miembro
- Stats del equipo

**Brigadista:**

- Estado de sincronización prominente
- Tarjetas de encuestas con prioridades
- Indicadores de sync pendiente
- Progreso individual

---

## ⚙️ Configuración de Desarrollo

Para cambiar el rol en modo desarrollo (hardcoded), edita:

```typescript
// contexts/auth-context.tsx (línea ~55)
const mockUser: User = {
  id: 999,
  email: "test@brigada.com",
  name: "Test User",
  role: "ADMIN", // 🔧 Cambiar aquí: "ADMIN" | "ENCARGADO" | "BRIGADISTA"
  state: "ACTIVE",
  created_at: Date.now(),
  updated_at: Date.now(),
};
```

---

## 🚀 Próximos Pasos

- [ ] Conectar con backend real
- [ ] Implementar autenticación JWT
- [ ] Agregar más datos mock realistas
- [ ] Crear base de datos SQLite local
- [ ] Implementar sincronización offline real

---

## 📝 Notas

- Todos los passwords de prueba son simples para facilitar testing
- En producción, se requieren passwords seguros
- La whitelist será reemplazada por verificación en base de datos
- Los datos mock serán reemplazados por datos reales de la API

---

**Última actualización:** 12 de Febrero, 2026
