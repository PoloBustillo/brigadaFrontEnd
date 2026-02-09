# 📝 Sistema de Formularios - Brigada Frontend

## 🎯 Dos Sistemas Diferentes

En Brigada usamos **dos sistemas distintos** para manejar formularios según el caso de uso:

---

## 1. 📋 Encuestas Dinámicas (Sistema Custom)

### ✅ Usar ESTE sistema para:

- Preguntas de encuestas
- Formularios dinámicos desde JSON
- Cualquier formulario con lógica condicional
- Formularios multi-sección/multi-página

### 🏗️ Arquitectura

```
Usuario responde pregunta
         ↓
QuestionRenderer (detecta tipo)
         ↓
Componente específico (TextQuestion, SelectQuestion, etc)
         ↓
onChange → QuestionAnswer
         ↓
useSurveyStore() → setAnswer()
         ↓
SurveyEngine actualiza estado
         ↓
Validación en tiempo real
```

### 💻 Ejemplo de Uso

```typescript
import { QuestionRenderer } from "@/features/questions/components/question-renderer";
import { useSurveyStore } from "@/store/survey-store";

function SurveyScreen() {
  const { currentSchema, setAnswer } = useSurveyStore();
  const questions = currentSchema?.sections[0].questions || [];

  return (
    <>
      {questions.map((question) => (
        <QuestionRenderer
          key={question.id}
          question={question}
          value={answers[question.id]}
          onChange={(answer) => setAnswer(answer.questionId, answer.value)}
        />
      ))}
    </>
  );
}
```

### 🔑 Componentes Clave

1. **QuestionRenderer** (`features/questions/components/question-renderer.tsx`)
   - Factory pattern para renderizar cualquier tipo de pregunta
   - Maneja label, descripción, validación, errores

2. **SurveyEngine** (`features/surveys/utils/survey-engine.ts`)
   - Motor central de lógica de encuestas
   - Lógica condicional (show/hide questions)
   - Cálculo de progreso
   - Validación de completitud

3. **useSurveyStore** (`store/survey-store.ts`)
   - Estado global de encuesta en progreso
   - Persistencia de respuestas
   - Navegación entre secciones

### ✨ Ventajas

- ✅ Render 100% dinámico desde JSON
- ✅ Lógica condicional compleja
- ✅ Multi-sección con progreso
- ✅ Guardado automático en cada cambio
- ✅ Persistencia en SQLite
- ✅ Offline-first
- ✅ Validación customizable por pregunta

### 📦 Dependencias

```bash
# Ya instaladas en el proyecto
npm install zustand        # Estado global
npm install zod           # Validación (opcional)
```

---

## 2. 🔐 Formularios Simples (React Hook Form)

### ✅ Usar ESTE sistema para:

- Login
- Registro
- Cambio de contraseña
- Perfil de usuario
- Configuración
- Formularios estáticos simples

### 🏗️ Arquitectura

```
Usuario llena formulario
         ↓
React Hook Form maneja estado
         ↓
Validación con Zod schema
         ↓
onSubmit → enviar a API
```

### 💻 Ejemplo de Uso

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

function LoginScreen() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    // Llamar a API de login
    await loginUser(data.email, data.password);
  };

  return (
    <View>
      <Input
        label="Email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Contraseña"
        {...register("password")}
        error={errors.password?.message}
        secureTextEntry
      />
      <Button title="Ingresar" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
```

### ✨ Ventajas

- ✅ Menos código boilerplate
- ✅ Validación integrada con Zod
- ✅ Optimizado para performance
- ✅ Re-renders mínimos
- ✅ API estándar conocida

### 📦 Dependencias

```bash
# Instalar SOLO cuando implementes login
npm install react-hook-form @hookform/resolvers
npm install zod  # Si no lo tienes ya
```

---

## 🔀 Tabla Comparativa

| Característica          | Sistema Custom (Encuestas) | React Hook Form (Login) |
| ----------------------- | -------------------------- | ----------------------- |
| **Uso**                 | Encuestas dinámicas        | Formularios simples     |
| **Render dinámico**     | ✅ Desde JSON              | ❌ Estático             |
| **Lógica condicional**  | ✅ Compleja                | ❌ Básica               |
| **Multi-sección**       | ✅ Con progreso            | ❌ Single page          |
| **Guardado automático** | ✅ Por pregunta            | ❌ Al submit            |
| **Persistencia**        | ✅ SQLite                  | ❌ No                   |
| **Offline-first**       | ✅ Sí                      | ⚠️ Parcial              |
| **Validación**          | ✅ Custom por pregunta     | ✅ Zod schema           |
| **Complejidad setup**   | Media                      | Baja                    |
| **Instalar ahora**      | ✅ Sí                      | 🔵 Después              |

---

## 🚫 Anti-Patrones (NO HACER)

### ❌ NO usar React Hook Form para encuestas

```typescript
// ❌ MAL - No hagas esto
function SurveyScreen() {
  const { register, handleSubmit } = useForm();

  return (
    <View>
      {/* Esto NO funciona con render dinámico */}
      <Input {...register("question1")} />
      <Input {...register("question2")} />
    </View>
  );
}
```

**Por qué es malo**:

- No soporta render dinámico desde JSON
- No puede hacer lógica condicional compleja
- Pierde todo el progreso si sales de la pantalla
- No se guarda automáticamente en SQLite

### ✅ BIEN - Usa el sistema custom

```typescript
// ✅ BIEN - Usa QuestionRenderer + SurveyEngine
function SurveyScreen() {
  const { setAnswer } = useSurveyStore();
  const engine = new SurveyEngine(schema);

  return (
    <View>
      {engine.getVisibleQuestions(0).map((question) => (
        <QuestionRenderer
          key={question.id}
          question={question}
          onChange={(answer) => setAnswer(answer.questionId, answer.value)}
        />
      ))}
    </View>
  );
}
```

---

### ❌ NO usar sistema custom para login

```typescript
// ❌ MAL - Overkill para login simple
function LoginScreen() {
  const schema = {
    sections: [{
      questions: [
        { id: "email", type: "text", label: "Email" },
        { id: "password", type: "text", label: "Password" }
      ]
    }]
  };

  return <QuestionRenderer /* ... */ />; // NO
}
```

**Por qué es malo**:

- Overkill para un formulario simple
- Agrega complejidad innecesaria
- React Hook Form es más simple para esto

### ✅ BIEN - Usa React Hook Form

```typescript
// ✅ BIEN - Simple y directo
function LoginScreen() {
  const { register, handleSubmit } = useForm();

  return (
    <View>
      <Input {...register("email")} />
      <Input {...register("password")} secureTextEntry />
      <Button onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
```

---

## 📋 Checklist de Decisión

### ¿Qué sistema usar?

**Pregúntate**:

1. ¿Es un formulario dinámico desde JSON? → Sistema Custom
2. ¿Tiene lógica condicional compleja? → Sistema Custom
3. ¿Tiene múltiples secciones/páginas? → Sistema Custom
4. ¿Necesita guardado automático? → Sistema Custom
5. ¿Necesita funcionar offline? → Sistema Custom
6. ¿Es para encuestas en campo? → Sistema Custom

**Si todas son NO**:

- Es un formulario simple → React Hook Form

---

## 🎓 Recursos

### Para Sistema Custom (Encuestas)

- Ver: `features/questions/components/question-renderer.tsx`
- Ver: `features/surveys/utils/survey-engine.ts`
- Ver: `store/survey-store.ts`
- Leer: `docs/ARCHITECTURE_NEW.md`

### Para React Hook Form (Login)

- Docs oficiales: https://react-hook-form.com
- Integración con Zod: https://github.com/react-hook-form/resolvers
- Instalar solo cuando lo necesites

---

## 🚀 Próximos Pasos

### Ahora (Encuestas):

1. ✅ Sistema custom ya implementado
2. Crear componentes de preguntas (`text-question.tsx`, etc)
3. Implementar validación con Zod en cada componente
4. Crear pantalla de encuesta (`app/survey/[id].tsx`)

### Después (Login):

1. Instalar `react-hook-form` cuando implementes login
2. Crear schema de validación con Zod
3. Crear pantalla de login simple
4. Integrar con API de autenticación

---

**Última actualización**: Febrero 9, 2026
**Resumen**: Dos sistemas, dos propósitos, úsalos correctamente. 🎯
