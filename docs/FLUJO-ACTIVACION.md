# 🔐 Flujo de Activación y Autenticación - Brigada Digital

## 📋 Resumen del Flujo Completo

```
ADMIN crea invitación → Usuario recibe código → Activa cuenta → Crea contraseña → Login
```

---

## 🔄 Proceso Detallado

### **FASE 1: Administrador Crea Invitación**

El administrador crea una entrada en la **whitelist** con:

```typescript
{
  email: "usuario@ejemplo.com",
  invitation_code: "123456", // Código de 6 dígitos generado
  role: "BRIGADISTA" | "ENCARGADO" | "ADMIN",
  created_at: "2026-02-10T10:00:00Z",
  used_at: null,
  expires_at: "2026-02-17T10:00:00Z" // 7 días después
}
```

📧 **El sistema envía un email al usuario con:**

- Código de invitación: `123456`
- Enlace a la app
- Instrucciones

---

### **FASE 2: Usuario Activa su Cuenta**

1. Usuario abre la app por primera vez
2. Ve la pantalla **Welcome**
3. Presiona **"Activar Cuenta"**
4. Ingresa el código de 6 dígitos: `123456`

**🔍 El sistema valida:**

```sql
SELECT * FROM whitelist
WHERE invitation_code = '123456'
  AND used_at IS NULL
  AND expires_at > NOW()
```

Si es válido:

- ✅ Marca el código como usado: `used_at = NOW()`
- ✅ Crea el usuario en la tabla `users`:
  ```typescript
  {
    email: "usuario@ejemplo.com",
    role: "BRIGADISTA",
    state: "PENDING", // Estado inicial
    password_hash: null, // Aún no tiene contraseña
    created_at: NOW()
  }
  ```
- ✅ Navega a **pantalla de creación de contraseña** (próxima a crear)

---

### **FASE 3: Usuario Crea su Contraseña** (Por implementar)

```tsx
// Nueva pantalla: app/(auth)/create-password.tsx
```

Usuario ingresa:

- Email (pre-llenado o editable)
- Contraseña (mínimo 8 caracteres)
- Confirmar contraseña

El sistema:

- Hashea la contraseña con `bcrypt`
- Actualiza el usuario:
  ```typescript
  UPDATE users
  SET password_hash = '$2b$10$...',
      state = 'ACTIVE'
  WHERE email = 'usuario@ejemplo.com'
  ```
- Genera **token offline** (válido 7 días)
- Navega al dashboard según rol

---

### **FASE 4: Login en Sesiones Futuras**

Usuario ya tiene cuenta creada:

1. Abre la app
2. Ve pantalla **Welcome**
3. Presiona **"Iniciar Sesión"**
4. Ingresa email y contraseña
5. Sistema valida:
   ```sql
   SELECT * FROM users
   WHERE email = ?
     AND state = 'ACTIVE'
   ```
6. Compara password con bcrypt
7. Genera nuevo token
8. Navega al dashboard

---

## 🎯 Códigos de Prueba Actuales

Mientras implementamos la BD real, usa estos códigos:

| Código   | Rol        | Email Mock             |
| -------- | ---------- | ---------------------- |
| `123456` | ADMIN      | admin@brigada.com      |
| `234567` | ENCARGADO  | encargado@brigada.com  |
| `345678` | BRIGADISTA | brigadista@brigada.com |

---

## 📊 Estados del Usuario (Regla 1-4)

```typescript
enum UserState {
  PENDING = "PENDING", // Activó código, sin contraseña
  ACTIVE = "ACTIVE", // Usuario completo y funcional
  SUSPENDED = "SUSPENDED", // Temporalmente bloqueado
  DELETED = "DELETED", // Borrado lógicamente
}
```

---

## 🔧 Próximos Pasos de Implementación

### 1. ✅ Crear pantalla de contraseña (COMPLETADO)

```bash
app/(auth)/create-password.tsx ✅
```

**Features implementadas:**

- ✅ Validación de email con regex
- ✅ Indicador de fortaleza de contraseña (5 niveles)
- ✅ Validación de requisitos en tiempo real
- ✅ Confirmación de contraseña con match visual
- ✅ Toggle mostrar/ocultar contraseñas
- ✅ Diseño consistente con otras pantallas
- ✅ Animaciones de entrada suaves
- ✅ Elementos decorativos animados
- ✅ Botón de retroceso funcional

**Validaciones incluidas:**

- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Caracteres especiales (opcional, mejora score)

### 2. **Implementar servicio de activación** 🔌

```typescript
// lib/services/activation-service.ts
export async function validateInvitationCode(code: string) {
  const invitation = await db
    .select()
    .from(whitelistTable)
    .where(
      and(
        eq(whitelistTable.invitationCode, code),
        isNull(whitelistTable.usedAt),
        gt(whitelistTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!invitation) return { valid: false, error: "Código inválido" };

  // Crear usuario pendiente
  const user = await createPendingUser(invitation.email, invitation.role);

  // Marcar código como usado
  await markCodeAsUsed(code);

  return { valid: true, user };
}
```

### 3. ✅ Actualizar flujo de navigation (COMPLETADO)

```typescript
// activation.tsx - línea 297
if (isValid) {
  // Ahora redirige a crear contraseña
  router.replace("/(auth)/create-password" as any);
}
```

**Flujo actualizado:**

```
Welcome → Activar → Código válido → Crear contraseña → Dashboard
```

### 4. **Integrar con base de datos real** 💾

---

## ❓ Preguntas Frecuentes

### **¿Por qué el código no pide email?**

Porque el código YA está asociado a un email en la whitelist. El admin creó la invitación con el email del usuario.

### **¿Qué pasa si ingreso un código inválido?**

El sistema lo rechaza inmediatamente. No se crea ningún usuario.

### **¿Puedo usar el mismo código dos veces?**

No. Una vez usado, el campo `used_at` se marca y el código se invalida.

### **¿Cuánto dura el código?**

7 días desde su creación. Después expira automáticamente.

---

## 🎨 Mejoras UI Pendientes

- [ ] Agregar pantalla de creación de contraseña
- [ ] Mejorar mensaje de "código inválido" con razones específicas
- [ ] Agregar indicador de progreso (paso 1/2, 2/2)
- [ ] Implementar "Reenviar código" funcional
- [ ] Toast notifications en lugar de alerts nativos

---

**Última actualización:** 10 de febrero, 2026
