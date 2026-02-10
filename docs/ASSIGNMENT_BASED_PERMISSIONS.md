# 🔐 Sistema de Permisos Basado en Asignaciones

## 📋 Principio Fundamental

**Regla de Oro:** El acceso se determina por **ROL + ASIGNACIÓN EXPLÍCITA**, no solo por rol.

```
Acceso = Role Permission ∩ Assignment Scope
```

---

## 👥 Roles y Responsabilidades

### 1️⃣ ADMIN (Superusuario)

**Alcance:** Global - Ve y controla TODO

**Capacidades:**

- ✅ Crear/editar/archivar cualquier encuesta
- ✅ Asignar encuestas a Encargados
- ✅ Ver todas las respuestas de todas las encuestas
- ✅ Crear usuarios (Admin, Encargado, Brigadista)
- ✅ Gestionar equipos
- ✅ Revocar asignaciones
- ✅ Ver métricas globales

**Restricciones:**

- ❌ Ninguna (acceso total)

---

### 2️⃣ ENCARGADO (Supervisor)

**Alcance:** Limitado a encuestas asignadas explícitamente

**Capacidades:**

- ✅ Ver SOLO encuestas que le fueron asignadas
- ✅ Asignar SUS encuestas a SUS Brigadistas
- ✅ Ver respuestas de SUS encuestas (completadas por SUS Brigadistas)
- ✅ Agregar Brigadistas a su equipo (si Admin lo permite)
- ✅ Ver métricas de SUS encuestas

**Restricciones:**

- ❌ NO puede ver encuestas no asignadas
- ❌ NO puede asignar encuestas que no tiene asignadas
- ❌ NO puede ver Brigadistas de otros Encargados
- ❌ NO puede crear encuestas (solo Admin)
- ❌ NO puede asignar encuestas a otros Encargados

---

### 3️⃣ BRIGADISTA (Operador)

**Alcance:** Limitado a encuestas asignadas por SU Encargado

**Capacidades:**

- ✅ Ver SOLO encuestas asignadas por su Encargado
- ✅ Llenar/completar encuestas asignadas
- ✅ Ver sus propias respuestas
- ✅ Editar respuestas en progreso
- ✅ Ver su progreso y metas

**Restricciones:**

- ❌ NO puede ver encuestas no asignadas
- ❌ NO puede ver respuestas de otros Brigadistas
- ❌ NO puede asignar encuestas
- ❌ NO puede crear encuestas
- ❌ NO puede ver lista de otros usuarios

---

## 📊 Matriz de Permisos Detallada

### Gestión de Encuestas

| Acción            | Admin    | Encargado         | Brigadista        |
| ----------------- | -------- | ----------------- | ----------------- |
| Crear encuesta    | ✅       | ❌                | ❌                |
| Ver encuesta      | ✅ Todas | ✅ Solo asignadas | ✅ Solo asignadas |
| Editar encuesta   | ✅       | ❌                | ❌                |
| Archivar encuesta | ✅       | ❌                | ❌                |
| Duplicar encuesta | ✅       | ❌                | ❌                |
| Ver esquema JSON  | ✅       | ✅ Solo asignadas | ❌                |

### Asignaciones

| Acción                           | Admin | Encargado                | Brigadista |
| -------------------------------- | ----- | ------------------------ | ---------- |
| Asignar encuesta a Encargado     | ✅    | ❌                       | ❌         |
| Revocar asignación de Encargado  | ✅    | ❌                       | ❌         |
| Asignar encuesta a Brigadista    | ✅    | ✅ Solo SUS encuestas    | ❌         |
| Revocar asignación de Brigadista | ✅    | ✅ Solo SUS asignaciones | ❌         |
| Ver sus asignaciones             | ✅    | ✅                       | ✅         |

### Gestión de Usuarios

| Acción                   | Admin | Encargado           | Brigadista |
| ------------------------ | ----- | ------------------- | ---------- |
| Crear Admin              | ✅    | ❌                  | ❌         |
| Crear Encargado          | ✅    | ❌                  | ❌         |
| Crear Brigadista         | ✅    | ✅ Para su equipo\* | ❌         |
| Ver lista de Admins      | ✅    | ❌                  | ❌         |
| Ver lista de Encargados  | ✅    | ❌                  | ❌         |
| Ver lista de Brigadistas | ✅    | ✅ Solo su equipo   | ❌         |
| Deshabilitar usuario     | ✅    | ❌                  | ❌         |

\*Nota: Si Admin permite auto-registro de Brigadistas por Encargados

### Gestión de Equipos

| Acción                              | Admin    | Encargado         | Brigadista |
| ----------------------------------- | -------- | ----------------- | ---------- |
| Agregar Brigadista a equipo         | ✅       | ✅ A su equipo    | ❌         |
| Remover Brigadista de equipo        | ✅       | ✅ De su equipo   | ❌         |
| Ver miembros de equipo              | ✅ Todos | ✅ Solo su equipo | ❌         |
| Transferir Brigadista a otro equipo | ✅       | ❌                | ❌         |

### Respuestas de Encuestas

| Acción                      | Admin | Encargado             | Brigadista        |
| --------------------------- | ----- | --------------------- | ----------------- |
| Llenar encuesta             | ✅    | ✅ Solo asignadas     | ✅ Solo asignadas |
| Ver respuestas propias      | ✅    | ✅                    | ✅                |
| Ver respuestas de su equipo | ✅    | ✅ Solo SUS encuestas | ❌                |
| Ver respuestas de todos     | ✅    | ❌                    | ❌                |
| Editar respuesta ajena      | ✅    | ❌                    | ❌                |
| Eliminar respuesta          | ✅    | ❌                    | ❌                |
| Validar respuesta           | ✅    | ✅ Solo SUS encuestas | ❌                |
| Exportar respuestas         | ✅    | ✅ Solo SUS encuestas | ❌                |

### Reportes y Métricas

| Acción                        | Admin   | Encargado             | Brigadista |
| ----------------------------- | ------- | --------------------- | ---------- |
| Ver dashboard global          | ✅      | ❌                    | ❌         |
| Ver métricas de sus encuestas | ✅      | ✅                    | ❌         |
| Ver progreso individual       | ✅      | ✅ De su equipo       | ✅ Propio  |
| Exportar reportes             | ✅ Todo | ✅ Solo SUS encuestas | ❌         |

---

## 🔄 Relaciones de Asignación

### Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────┐
│                        ADMIN                             │
│  • Crea encuestas                                       │
│  • Crea usuarios (Admin, Encargado, Brigadista)        │
└─────────────────────────────────────────────────────────┘
                │                    │
                │ asigna             │ crea
                ▼                    ▼
    ┌──────────────────┐    ┌──────────────────┐
    │   ENCUESTA A     │    │   ENCARGADO 1    │
    └──────────────────┘    └──────────────────┘
                │                    │
                └──────────┬─────────┘
                           │ survey_assignment
                           ▼
                ┌──────────────────────────────┐
                │ ENCARGADO 1 puede gestionar │
                │      ENCUESTA A              │
                └──────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
       agrega a equipo         asigna encuesta
                │                     │
                ▼                     ▼
    ┌──────────────────┐    ┌──────────────────────┐
    │  BRIGADISTA 1    │    │ brigadista_assignment │
    │  (team_member)   │◄───│  Encuesta A →        │
    └──────────────────┘    │  Brigadista 1        │
                            └──────────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │ BRIGADISTA 1 puede   │
                         │ llenar ENCUESTA A    │
                         └──────────────────────┘
```

### Tabla: survey_assignments

```sql
id | survey_schema_id | encargado_id | assigned_by | assigned_at | is_active
---|------------------|--------------|-------------|-------------|----------
1  | survey-123       | encargado-1  | admin-1     | 2024-01-15  | true
2  | survey-123       | encargado-2  | admin-1     | 2024-01-16  | true
3  | survey-456       | encargado-1  | admin-1     | 2024-01-20  | true
```

**Interpretación:**

- Encargado 1 puede gestionar Survey-123 y Survey-456
- Encargado 2 SOLO puede gestionar Survey-123
- Encargado 2 NO ve Survey-456 en ninguna parte de su UI

### Tabla: team_memberships

```sql
id | encargado_id | brigadista_id | added_by    | added_at   | is_active
---|--------------|---------------|-------------|------------|----------
1  | encargado-1  | brigadista-1  | admin-1     | 2024-01-10 | true
2  | encargado-1  | brigadista-2  | encargado-1 | 2024-01-12 | true
3  | encargado-2  | brigadista-3  | admin-1     | 2024-01-15 | true
```

**Interpretación:**

- Encargado 1 tiene equipo: [Brigadista 1, Brigadista 2]
- Encargado 2 tiene equipo: [Brigadista 3]
- Encargado 1 NO puede ver ni asignar nada a Brigadista 3

### Tabla: brigadista_assignments

```sql
id | survey_schema_id | brigadista_id | encargado_id | assigned_by | is_active
---|------------------|---------------|--------------|-------------|----------
1  | survey-123       | brigadista-1  | encargado-1  | encargado-1 | true
2  | survey-456       | brigadista-1  | encargado-1  | encargado-1 | true
3  | survey-123       | brigadista-2  | encargado-1  | encargado-1 | true
4  | survey-123       | brigadista-3  | encargado-2  | encargado-2 | true
```

**Interpretación:**

- Brigadista 1 puede llenar Survey-123 y Survey-456 (ambas asignadas por Encargado 1)
- Brigadista 2 SOLO puede llenar Survey-123
- Brigadista 3 puede llenar Survey-123 (asignada por Encargado 2)
- Brigadista 1 y 3 trabajan en Survey-123 pero NO se ven entre sí

---

## 🔍 Queries de Validación de Permisos

### 1. Verificar si Encargado puede ver una encuesta

```sql
SELECT EXISTS(
  SELECT 1 FROM survey_assignments
  WHERE survey_schema_id = ?
    AND encargado_id = ?
    AND is_active = 1
) AS can_access;
```

### 2. Obtener encuestas disponibles para Encargado

```sql
SELECT s.* FROM survey_schemas s
INNER JOIN survey_assignments sa ON s.id = sa.survey_schema_id
WHERE sa.encargado_id = ?
  AND sa.is_active = 1
  AND s.status = 'active'
ORDER BY s.created_at DESC;
```

### 3. Verificar si Brigadista puede llenar una encuesta

```sql
SELECT EXISTS(
  SELECT 1 FROM brigadista_assignments
  WHERE survey_schema_id = ?
    AND brigadista_id = ?
    AND is_active = 1
) AS can_fill;
```

### 4. Obtener encuestas disponibles para Brigadista

```sql
SELECT s.* FROM survey_schemas s
INNER JOIN brigadista_assignments ba ON s.id = ba.survey_schema_id
WHERE ba.brigadista_id = ?
  AND ba.is_active = 1
  AND s.status = 'active'
ORDER BY ba.assigned_at DESC;
```

### 5. Obtener Brigadistas del equipo de un Encargado

```sql
SELECT u.* FROM users u
INNER JOIN team_memberships tm ON u.id = tm.brigadista_id
WHERE tm.encargado_id = ?
  AND tm.is_active = 1
  AND u.state = 'ACTIVE'
ORDER BY u.full_name;
```

### 6. Verificar si Encargado puede asignar encuesta a Brigadista

```sql
-- Primero: ¿Tiene la encuesta asignada?
SELECT EXISTS(
  SELECT 1 FROM survey_assignments
  WHERE survey_schema_id = ?
    AND encargado_id = ?
    AND is_active = 1
) AS has_survey;

-- Segundo: ¿El Brigadista está en su equipo?
SELECT EXISTS(
  SELECT 1 FROM team_memberships
  WHERE encargado_id = ?
    AND brigadista_id = ?
    AND is_active = 1
) AS is_team_member;

-- Ambos deben ser TRUE
```

### 7. Obtener respuestas visibles para Encargado

```sql
SELECT sr.* FROM survey_responses sr
INNER JOIN survey_assignments sa ON sr.schema_id = sa.survey_schema_id
INNER JOIN team_memberships tm ON sr.collected_by = tm.brigadista_id
WHERE sa.encargado_id = ?
  AND sa.is_active = 1
  AND tm.encargado_id = ?
  AND tm.is_active = 1
ORDER BY sr.started_at DESC;
```

---

## 🚦 Ciclo de Vida de Asignaciones

### Flujo: Admin asigna encuesta a Encargado

```
1. Admin crea encuesta "Censo 2024"
   └─ Estado: draft

2. Admin publica encuesta
   └─ Estado: active

3. Admin asigna a Encargado 1
   └─ INSERT INTO survey_assignments
      (survey_schema_id, encargado_id, assigned_by)
   └─ Encargado 1 ahora VE la encuesta en su dashboard

4. Encargado 1 puede ahora:
   ✅ Ver la encuesta
   ✅ Asignarla a sus Brigadistas
   ✅ Ver respuestas de sus Brigadistas
```

### Flujo: Encargado asigna encuesta a Brigadista

```
1. Encargado 1 accede a "Censo 2024" (tiene permiso)

2. Encargado 1 va a "Asignar a equipo"
   └─ Ve lista de SUS Brigadistas:
      • Brigadista 1
      • Brigadista 2

3. Encargado 1 selecciona Brigadista 1
   └─ INSERT INTO brigadista_assignments
      (survey_schema_id, brigadista_id, encargado_id, assigned_by)

4. Brigadista 1 ahora VE "Censo 2024" en su app
   ✅ Puede comenzar a llenar encuestas
```

### Flujo: Revocar asignación

```
1. Admin/Encargado revoca asignación
   └─ UPDATE brigadista_assignments
      SET is_active = 0, revoked_at = NOW()
      WHERE id = ?

2. Brigadista YA NO VE la encuesta
   ❌ Encuestas en progreso quedan en estado "suspended"
   ❌ No puede crear nuevas respuestas
```

---

## 📱 Implicaciones de UI por Rol

### Dashboard de ADMIN

```typescript
interface AdminDashboard {
  sections: [
    {
      title: "Todas las Encuestas";
      items: Survey[]; // SIN filtro
      actions: ["Crear", "Editar", "Archivar", "Asignar"];
    },
    {
      title: "Todos los Usuarios";
      items: User[]; // Admins, Encargados, Brigadistas
      actions: ["Crear", "Editar", "Deshabilitar"];
    },
    {
      title: "Asignaciones Globales";
      items: Assignment[];
      actions: ["Asignar", "Revocar"];
    },
    {
      title: "Métricas Globales";
      stats: GlobalStats;
    },
  ];
}
```

### Dashboard de ENCARGADO

```typescript
interface EncargadoDashboard {
  sections: [
    {
      title: "Mis Encuestas"; // SOLO asignadas
      items: Survey[]; // WHERE survey_assignments.encargado_id = currentUserId
      actions: ["Ver", "Asignar a equipo"];
    },
    {
      title: "Mi Equipo";
      items: Brigadista[]; // WHERE team_memberships.encargado_id = currentUserId
      actions: ["Agregar", "Remover", "Ver progreso"];
    },
    {
      title: "Respuestas de mi Equipo";
      items: Response[]; // Solo de SUS encuestas + SUS brigadistas
      filters: ["Por encuesta", "Por brigadista", "Por fecha"];
    },
    {
      title: "Métricas de mis Encuestas";
      stats: MyTeamStats;
    },
  ];
}
```

### Dashboard de BRIGADISTA

```typescript
interface BrigadistaDashboard {
  sections: [
    {
      title: "Encuestas Asignadas"; // SOLO asignadas
      items: Survey[]; // WHERE brigadista_assignments.brigadista_id = currentUserId
      actions: ["Llenar", "Ver progreso"];
    },
    {
      title: "Mis Respuestas";
      items: Response[]; // WHERE collected_by = currentUserId
      actions: ["Ver", "Editar borrador", "Eliminar borrador"];
    },
    {
      title: "Mi Progreso";
      stats: {
        assigned: number;
        completed: number;
        pending: number;
        target: number;
      };
    },
  ];
}
```

---

## 🌐 Comportamiento Offline

### Sincronización de Asignaciones

```typescript
interface OfflineSync {
  onLogin: {
    download: [
      "survey_assignments (for Encargado)",
      "brigadista_assignments (for Brigadista)",
      "team_memberships (for Encargado)",
    ];
    cache: "Store in SQLite locally";
  };

  periodicSync: {
    interval: "Every 4 hours or on app resume";
    action: "Check for new assignments or revocations";
  };

  onRevocation: {
    behavior: "Mark local data as revoked";
    ui: "Hide survey from lists immediately";
    data: "Keep responses for sync, prevent new ones";
  };
}
```

### Escenarios Offline

#### 1. Brigadista pierde conexión mientras llena encuesta

```
✅ Permitido: Continuar llenando
✅ Permitido: Guardar respuestas localmente
✅ Permitido: Completar encuesta offline
❌ Bloqueado: Acceder a encuestas NO descargadas previamente
```

#### 2. Encargado pierde conexión

```
✅ Permitido: Ver encuestas previamente sincronizadas
✅ Permitido: Ver respuestas ya descargadas
❌ Bloqueado: Asignar encuestas nuevas (requiere conexión)
❌ Bloqueado: Agregar Brigadistas al equipo
⚠️  Advertencia: "Algunas funciones requieren conexión"
```

#### 3. Admin revoca asignación mientras usuario offline

```
Server: Revoca asignación
  └─ brigadista_assignments.is_active = 0

Usuario offline:
  └─ Aún tiene acceso local (datos en caché)
  └─ Al reconectar:
     1. Sync detecta revocación
     2. Actualiza is_active = 0
     3. UI oculta encuesta
     4. Respuestas en progreso → "suspended"
```

---

## ⚠️ Edge Cases y Soluciones

### Edge Case 1: Brigadista en múltiples equipos

**Problema:** ¿Puede un Brigadista pertenecer a 2 Encargados?

**Solución:**

```sql
-- SÍ, permitir múltiples membresías
-- Un Brigadista puede tener 2+ Encargados
-- Restricción: Cada Encargado solo ve sus propias asignaciones

SELECT * FROM team_memberships
WHERE brigadista_id = 'brig-1';

-- Resultado:
encargado_id | brigadista_id | is_active
-------------|---------------|----------
encargado-1  | brig-1        | true
encargado-2  | brig-1        | true
```

**Regla:** Las asignaciones son independientes por Encargado.

### Edge Case 2: Misma encuesta asignada por 2 Encargados

**Problema:** Brigadista recibe Survey-123 de Encargado 1 Y Encargado 2

**Solución:**

```sql
-- Permitido: Brigadista puede tener asignación duplicada
-- Cada asignación es independiente

SELECT * FROM brigadista_assignments
WHERE brigadista_id = 'brig-1' AND survey_schema_id = 'survey-123';

-- Resultado:
id | encargado_id | target_count
---|--------------|-------------
1  | encargado-1  | 50
2  | encargado-2  | 30
```

**UI para Brigadista:**

- Muestra "Survey-123" UNA SOLA VEZ
- Meta acumulada: 80 encuestas
- Respuestas cuentan para AMBOS Encargados

### Edge Case 3: Transferir Brigadista entre equipos

**Problema:** ¿Qué pasa con respuestas previas al transferir?

**Solución:**

```typescript
// Mantener respuestas con Encargado original
// NO transferir historial automáticamente

async function transferBrigadista(
  brigadistaId: string,
  fromEncargado: string,
  toEncargado: string
) {
  // 1. Desactivar membresía anterior
  await db.runAsync(`
    UPDATE team_memberships
    SET is_active = 0, removed_at = datetime('now')
    WHERE encargado_id = ? AND brigadista_id = ?
  `, [fromEncargado, brigadistaId]);

  // 2. Crear nueva membresía
  await db.runAsync(`
    INSERT INTO team_memberships (...)
    VALUES (?, ?, ...)
  `, [toEncargado, brigadistaId, ...]);

  // 3. Respuestas antiguas mantienen collected_by + encargado_id original
  // 4. Nuevas respuestas se asocian con nuevo Encargado
}
```

### Edge Case 4: Encargado renuncia

**Problema:** ¿Qué pasa con sus Brigadistas y asignaciones?

**Solución:**

```typescript
async function handleEncargadoExit(encargadoId: string) {
  // Opción A: Reasignar a otro Encargado (Admin lo hace)
  await reassignTeam(encargadoId, newEncargadoId);

  // Opción B: Liberar Brigadistas (vuelven a pool disponible)
  await db.runAsync(
    `
    UPDATE team_memberships
    SET is_active = 0, removed_at = datetime('now')
    WHERE encargado_id = ?
  `,
    [encargadoId],
  );

  // Opción C: Mantener datos históricos
  // NO eliminar respuestas previas
  // Marcar survey_assignments como inactivas
}
```

### Edge Case 5: Brigadista completa encuesta sin conexión, luego se revoca

**Problema:** Respuesta completada offline, pero asignación revocada online

**Solución:**

```typescript
async function syncResponse(response: Response) {
  // Verificar asignación en servidor
  const isStillAssigned = await checkAssignment(
    response.schemaId,
    response.collectedBy,
  );

  if (!isStillAssigned) {
    // Marcar como "órfana" pero NO eliminar
    await db.runAsync(
      `
      UPDATE survey_responses
      SET status = 'orphaned',
          sync_error = 'Assignment revoked'
      WHERE id = ?
    `,
      [response.id],
    );

    // Admin decide qué hacer:
    // - Aceptar respuesta (válida)
    // - Rechazar respuesta (inválida)
  }
}
```

---

## 🎨 Implementación en Código

### Hook: usePermissions

```typescript
import { useAuth } from "@/contexts/auth-context";
import { getDatabase } from "@/lib/db";

export function usePermissions() {
  const { user } = useAuth();

  async function canAccessSurvey(surveyId: string): Promise<boolean> {
    if (user.role === "ADMIN") return true;

    if (user.role === "ENCARGADO") {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ exists: number }>(
        `
        SELECT EXISTS(
          SELECT 1 FROM survey_assignments
          WHERE survey_schema_id = ? AND encargado_id = ? AND is_active = 1
        ) AS exists
      `,
        [surveyId, user.id],
      );

      return result?.exists === 1;
    }

    if (user.role === "BRIGADISTA") {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ exists: number }>(
        `
        SELECT EXISTS(
          SELECT 1 FROM brigadista_assignments
          WHERE survey_schema_id = ? AND brigadista_id = ? AND is_active = 1
        ) AS exists
      `,
        [surveyId, user.id],
      );

      return result?.exists === 1;
    }

    return false;
  }

  async function canAssignSurveyToBrigadista(
    surveyId: string,
    brigadistaId: string,
  ): Promise<boolean> {
    if (user.role !== "ENCARGADO" && user.role !== "ADMIN") return false;

    const db = await getDatabase();

    // Verificar que tenga la encuesta asignada
    const hasSurvey = await db.getFirstAsync<{ exists: number }>(
      `
      SELECT EXISTS(
        SELECT 1 FROM survey_assignments
        WHERE survey_schema_id = ? AND encargado_id = ? AND is_active = 1
      ) AS exists
    `,
      [surveyId, user.id],
    );

    if (!hasSurvey || hasSurvey.exists === 0) return false;

    // Verificar que el Brigadista esté en su equipo
    const isTeamMember = await db.getFirstAsync<{ exists: number }>(
      `
      SELECT EXISTS(
        SELECT 1 FROM team_memberships
        WHERE encargado_id = ? AND brigadista_id = ? AND is_active = 1
      ) AS exists
    `,
      [user.id, brigadistaId],
    );

    return isTeamMember?.exists === 1;
  }

  return {
    canAccessSurvey,
    canAssignSurveyToBrigadista,
    isAdmin: user.role === "ADMIN",
    isEncargado: user.role === "ENCARGADO",
    isBrigadista: user.role === "BRIGADISTA",
  };
}
```

### Componente: SurveyList

```typescript
import { usePermissions } from "@/hooks/use-permissions";

export function SurveyList() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    async function loadSurveys() {
      const db = await getDatabase();

      if (user.role === "ADMIN") {
        // Ver TODAS
        const all = await db.getAllAsync<Survey>(`
          SELECT * FROM survey_schemas WHERE status = 'active'
        `);
        setSurveys(all);
      }

      else if (user.role === "ENCARGADO") {
        // Solo ASIGNADAS
        const assigned = await db.getAllAsync<Survey>(`
          SELECT s.* FROM survey_schemas s
          INNER JOIN survey_assignments sa ON s.id = sa.survey_schema_id
          WHERE sa.encargado_id = ? AND sa.is_active = 1 AND s.status = 'active'
        `, [user.id]);
        setSurveys(assigned);
      }

      else if (user.role === "BRIGADISTA") {
        // Solo ASIGNADAS por Encargado
        const assigned = await db.getAllAsync<Survey>(`
          SELECT s.* FROM survey_schemas s
          INNER JOIN brigadista_assignments ba ON s.id = ba.survey_schema_id
          WHERE ba.brigadista_id = ? AND ba.is_active = 1 AND s.status = 'active'
        `, [user.id]);
        setSurveys(assigned);
      }
    }

    loadSurveys();
  }, [user]);

  return (
    <FlatList
      data={surveys}
      renderItem={({ item }) => <SurveyCard survey={item} />}
    />
  );
}
```

---

## ✅ Checklist de Implementación

### Base de Datos

- [x] Tabla `survey_assignments`
- [x] Tabla `brigadista_assignments`
- [x] Tabla `team_memberships`
- [x] Índices para queries de permisos
- [x] Foreign keys correctas
- [ ] Triggers para auditoría de asignaciones

### Backend/Servicios

- [ ] `AssignmentService.assignSurveyToEncargado()`
- [ ] `AssignmentService.assignSurveyToBrigadista()`
- [ ] `AssignmentService.revokeAssignment()`
- [ ] `TeamService.addBrigadistaToTeam()`
- [ ] `TeamService.removeBrigadistaFromTeam()`
- [ ] `PermissionService.canAccessSurvey()`

### UI/UX

- [ ] Dashboard específico por rol
- [ ] Filtros de encuestas por asignación
- [ ] Pantalla de asignación para Admins
- [ ] Pantalla de asignación para Encargados
- [ ] Indicador visual de "Sin asignaciones"
- [ ] Notificaciones de nuevas asignaciones

### Offline

- [ ] Sincronizar asignaciones al login
- [ ] Cache local de asignaciones
- [ ] Detectar revocaciones al reconectar
- [ ] Manejo de respuestas "órfanas"

### Testing

- [ ] Tests de queries de permisos
- [ ] Tests de edge cases
- [ ] Tests de sincronización offline
- [ ] Tests de UI por rol

---

## 📚 Conclusión

Este sistema de permisos basado en asignaciones proporciona:

✅ **Flexibilidad:** Encargados pueden gestionar múltiples encuestas independientes  
✅ **Seguridad:** Acceso estricto basado en asignaciones explícitas  
✅ **Escalabilidad:** Agregar Encargados/Brigadistas sin conflictos  
✅ **Auditoría:** Trazabilidad completa de quién asignó qué a quién  
✅ **Offline-first:** Funciona sin conexión con datos sincronizados

**Próximo paso:** Implementar servicios y UI basados en estos principios.
