# 🚀 BRIGADA - Próximos Pasos y Resumen Ejecutivo

## 📊 Resumen del Sistema

Has construido la base de un **sistema de encuestas offline-first** extremadamente robusto:

### ✅ Lo que ya tienes (FASE 1 - Fundamentos)

1. **Schema de Base de Datos** (SQLite)
   - 8 tablas principales
   - Relaciones bien definidas
   - Índices optimizados
   - Soporte para versionado

2. **Sistema de Migraciones**
   - Automático y versionado
   - Safe rollout
   - Tracking de versiones

3. **Repository Pattern**
   - `SurveyRepository` completo
   - Guardado inmediato de preguntas
   - Cálculo automático de progreso
   - Queries optimizadas

4. **Utilidades Core**
   - Generación de UUIDs
   - Validaciones (CURP, INE, email)
   - Retry con backoff exponencial
   - Helpers de timestamp

5. **Documentación Completa**
   - Arquitectura detallada
   - Ejemplos de schemas
   - Patrones de código
   - Roadmap por fases

---

## 🎯 Estado Actual

```
📦 FASE 1: FUNDAMENTOS ████████░░ 80%
├─ ✅ Database Schema
├─ ✅ Migrations System
├─ ✅ Repository Layer
├─ ✅ Utils & Helpers
├─ ⏳ App Initialization
├─ ⏳ Basic UI Components
└─ ⏳ Testing

📦 FASE 2: CAPTURA AVANZADA ░░░░░░░░░░ 0%
📦 FASE 3: SINCRONIZACIÓN ░░░░░░░░░░ 0%
📦 FASE 4: SCHEMAS DINÁMICOS ░░░░░░░░░░ 0%
📦 FASE 5: ROLES Y PERMISOS ░░░░░░░░░░ 0%
📦 FASE 6: PRODUCCIÓN ░░░░░░░░░░ 0%
```

---

## 🔥 Próximos Pasos INMEDIATOS (Completar Fase 1)

### Paso 1: Inicializar Base de Datos en App Entry Point

**Archivo**: `app/_layout.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { initDatabase } from '@/lib/db';
import { runMigrations } from '@/lib/db/migrations';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setupDatabase() {
      try {
        console.log('🔧 Initializing database...');

        // 1. Inicializar SQLite
        initDatabase();

        // 2. Ejecutar migraciones
        runMigrations();

        console.log('✅ Database ready');
        setDbReady(true);
      } catch (error) {
        console.error('❌ Database setup failed:', error);
        // TODO: Mostrar error al usuario
      }
    }

    setupDatabase();
  }, []);

  if (!dbReady) {
    return null; // o un splash screen
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

---

### Paso 2: Crear Seed Data (Para Testing)

**Archivo**: `lib/db/seed.ts`

```typescript
import { getDatabase } from "./index";
import { users, surveySchemas } from "./schema";
import { generateId } from "../utils";

export async function seedDatabase() {
  const db = getDatabase();

  console.log("🌱 Seeding database...");

  // 1. Crear usuario de prueba
  const userId = generateId();
  await db.insert(users).values({
    id: userId,
    role: "brigadista",
    name: "Juan Pérez",
    email: "juan.perez@brigada.com",
    phone: "5512345678",
    isActive: true,
  });

  // 2. Crear schema de encuesta simple
  const schemaId = generateId();
  await db.insert(surveySchemas).values({
    id: schemaId,
    name: "Encuesta de Prueba",
    description: "Encuesta de prueba para desarrollo",
    version: 1,
    status: "active",
    schema: JSON.stringify({
      version: 1,
      title: "Encuesta de Prueba",
      sections: [
        {
          id: "datos_basicos",
          title: "Datos Básicos",
          order: 1,
          questions: [
            {
              id: "nombre",
              type: "text",
              label: "Nombre completo",
              required: true,
              order: 1,
            },
            {
              id: "edad",
              type: "number",
              label: "Edad",
              required: true,
              order: 2,
              validation: { min: 18, max: 120 },
            },
            {
              id: "acepta_terminos",
              type: "boolean",
              label: "¿Acepta términos y condiciones?",
              required: true,
              order: 3,
            },
          ],
        },
      ],
    }),
    createdBy: userId,
  });

  console.log("✅ Database seeded");
  console.log(`User ID: ${userId}`);
  console.log(`Schema ID: ${schemaId}`);

  return { userId, schemaId };
}
```

---

### Paso 3: Crear Hook para Usuario Actual

**Archivo**: `lib/hooks/use-current-user.ts`

```typescript
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_KEY = "@brigada:current_user";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "encargado" | "brigadista";
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (data) {
        setUser(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function setCurrentUser(userData: CurrentUser) {
    try {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  }

  async function clearCurrentUser() {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    } catch (error) {
      console.error("Failed to clear user:", error);
    }
  }

  return {
    user,
    loading,
    setCurrentUser,
    clearCurrentUser,
  };
}
```

---

### Paso 4: Crear Pantalla de Lista de Encuestas

**Archivo**: `app/(tabs)/index.tsx`

```typescript
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SurveyRepository } from '@/lib/repositories/survey-repository';
import { useCurrentUser } from '@/lib/hooks/use-current-user';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSurveys();
    }
  }, [user]);

  async function loadSurveys() {
    try {
      const data = await SurveyRepository.listResponses(user!.id);
      setSurveys(data);
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateSurvey() {
    router.push('/survey/new');
  }

  function handleOpenSurvey(surveyId: string) {
    router.push(`/survey/${surveyId}`);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Encuestas</Text>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateSurvey}
      >
        <Text style={styles.createButtonText}>+ Nueva Encuesta</Text>
      </TouchableOpacity>

      <FlatList
        data={surveys}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.surveyCard}
            onPress={() => handleOpenSurvey(item.id)}
          >
            <Text style={styles.surveyName}>{item.schemaName}</Text>
            <Text style={styles.surveyStatus}>
              {item.status === 'completed' ? '✅ Completada' : '⏳ En progreso'}
            </Text>
            <Text style={styles.surveyProgress}>
              Progreso: {Math.round(item.progress * 100)}%
            </Text>
            <Text style={styles.surveyDate}>
              {new Date(item.startedAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No hay encuestas. Crea una nueva para empezar.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  surveyCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  surveyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  surveyStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  surveyProgress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  surveyDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 50,
  },
});
```

---

### Paso 5: Test Básico de Flujo

**Archivo**: `__tests__/survey-flow.test.ts`

```typescript
import { initDatabase, getDatabase } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrations";
import { SurveyRepository } from "@/lib/repositories/survey-repository";
import { generateId } from "@/lib/utils";

describe("Survey Flow", () => {
  beforeAll(() => {
    initDatabase();
    runMigrations();
  });

  it("should create a survey response and save answers", async () => {
    const userId = generateId();
    const schemaId = generateId();

    // 1. Crear respuesta de encuesta
    const responseId = await SurveyRepository.createResponse({
      schemaId,
      schemaVersion: 1,
      collectedBy: userId,
    });

    expect(responseId).toBeTruthy();

    // 2. Guardar primera respuesta
    await SurveyRepository.saveQuestionAnswer({
      responseId,
      questionId: "nombre",
      questionPath: "datos.nombre",
      questionType: "text",
      value: "Juan Pérez",
    });

    // 3. Verificar que se guardó
    const answer1 = await SurveyRepository.getQuestionAnswer(
      responseId,
      "nombre",
    );
    expect(answer1?.value).toBe("Juan Pérez");

    // 4. Guardar segunda respuesta
    await SurveyRepository.saveQuestionAnswer({
      responseId,
      questionId: "edad",
      questionPath: "datos.edad",
      questionType: "number",
      value: 30,
    });

    // 5. Verificar progreso
    const response = await SurveyRepository.getResponseById(responseId);
    expect(response?.progress).toBeGreaterThan(0);

    // 6. Completar encuesta
    await SurveyRepository.completeResponse(responseId);

    const completedResponse =
      await SurveyRepository.getResponseById(responseId);
    expect(completedResponse?.status).toBe("completed");
    expect(completedResponse?.completedAt).toBeTruthy();
  });
});
```

---

## 📋 Checklist de Tareas (Completar Fase 1)

- [ ] Inicializar DB en `app/_layout.tsx`
- [ ] Crear función de seed en `lib/db/seed.ts`
- [ ] Crear hook `useCurrentUser`
- [ ] Crear pantalla de lista de encuestas
- [ ] Crear test de flujo completo
- [ ] Ejecutar seed en modo desarrollo
- [ ] Verificar que todo funciona offline

---

## 🎓 Conceptos Clave para el Equipo

### 1. **SQLite es la Fuente de Verdad**

```
❌ NO: Zustand.setState({ answers: [...] })
✅ SÍ: await SurveyRepository.saveQuestionAnswer({...})
```

### 2. **Guardado Inmediato**

```typescript
// ❌ MAL: Guardar al final
<Button onPress={saveAllAnswers}>Guardar Encuesta</Button>

// ✅ BIEN: Guardar cada input
<TextInput
  onChangeText={(text) => {
    setValue(text);
  }}
  onBlur={() => {
    SurveyRepository.saveQuestionAnswer({...}); // ⬅️ Inmediato
  }}
/>
```

### 3. **Schemas son Dinámicos**

```typescript
// No hardcodear UI
// ❌ MAL
<View>
  <TextInput placeholder="Nombre" />
  <TextInput placeholder="Edad" />
</View>

// ✅ BIEN: Generar desde schema
{schema.sections.map(section => (
  section.questions.map(question => (
    <QuestionRenderer question={question} key={question.id} />
  ))
))}
```

---

## 🚀 Después de Fase 1

### FASE 2: Captura Avanzada (2-3 semanas)

- Integrar expo-camera
- Implementar OCR de INE
- Crear canvas de firma
- Compresión de imágenes

### FASE 3: Sincronización (1-2 semanas)

- Background sync service
- Cola de sincronización
- Backoff exponencial
- UI de estado

### FASE 4: Schemas Dinámicos (1 semana)

- Descarga de schemas
- Versionado
- Cache local

### FASE 5: Roles (1 semana)

- JWT offline
- Permisos
- Dashboard admin

### FASE 6: Producción (2 semanas)

- Testing
- Optimizaciones
- Deploy con EAS

---

## 📚 Recursos de Referencia

### Documentación del Proyecto

- `ARCHITECTURE.md` - Visión general del sistema
- `SCHEMAS_EXAMPLES.md` - Ejemplos de encuestas
- `lib/db/schema.ts` - Schema completo de DB
- `lib/repositories/survey-repository.ts` - Lógica de negocio

### Documentación Externa

- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Offline-First Guide](https://offlinefirst.org/)

---

## 💡 Consejos Finales

1. **Empieza Simple**: No agregues funcionalidades hasta completar Fase 1
2. **Prueba Offline**: Desactiva WiFi/datos y verifica que funciona
3. **Commits Pequeños**: Un commit por feature
4. **Testing Continuo**: Prueba cada Repository method
5. **Documenta Decisiones**: Actualiza `ARCHITECTURE.md` si cambias algo

---

## ✅ Validación de Fase 1 Completa

La Fase 1 está completa cuando puedas:

1. ✅ Abrir la app
2. ✅ Ver lista de encuestas (vacía al inicio)
3. ✅ Crear nueva encuesta
4. ✅ Responder preguntas básicas (text, number, boolean)
5. ✅ Ver progreso en tiempo real
6. ✅ Completar encuesta
7. ✅ Cerrar app y reabrir (datos persisten)
8. ✅ Todo funciona SIN INTERNET

---

**¡Manos a la obra!** 🚀

Tienes una base sólida. Los próximos pasos son implementar la UI básica y conectarla con el Repository. El sistema de datos ya está listo.
