# 🧪 Datos de Prueba - Brigada Digital

## 📋 Usuarios Mock

### 1. 👨‍💼 Usuario Admin (Estado: ACTIVE)

```
Email: admin@brigada.com
Password: admin123
Rol: ADMIN
Estado: ACTIVE
```

**Flujo esperado:**

1. Ingresar en pantalla de login
2. Al iniciar sesión → Te lleva directamente al **Dashboard Admin**
3. Dashboard muestra métricas generales del sistema

---

### 2. 👥 Usuario Encargado (Estado: ACTIVE)

```
Email: encargado@brigada.com
Password: encargado123
Rol: ENCARGADO
Estado: ACTIVE
```

**Flujo esperado:**

1. Ingresar en pantalla de login
2. Al iniciar sesión → Te lleva al **Dashboard del Encargado**
3. Dashboard muestra equipo y encuestas asignadas

---

### 3. 🚶 Usuario Brigadista (Estado: ACTIVE)

```
Email: brigadista@brigada.com
Password: brigadista123
Rol: BRIGADISTA
Estado: ACTIVE
```

**Flujo esperado:**

1. Ingresar en pantalla de login
2. Al iniciar sesión → Te lleva al **Dashboard del Brigadista**
3. Dashboard muestra encuestas asignadas y estado de sync

---

### 4. 🔄 Usuario Primera Vez (Estado: INVITED)

```
Email: test@brigada.com
Password: cualquier contraseña
Rol: BRIGADISTA
Estado: INVITED
```

**Flujo esperado:**

1. Ingresar en pantalla de login
2. Al iniciar sesión → Te lleva a pantalla de **Activación**
3. Usar código de activación: `123456`
4. Continuar a crear contraseña

---

## 🔐 Códigos de Activación

### Código válido:

```
123456
```

**Nota:** En la pantalla de activación, ingresa este código de 6 dígitos. El teclado numérico se abrirá automáticamente.

---

## 📝 Notas Importantes

### Whitelist Mock

Solo los siguientes emails están en la whitelist de prueba:

- `admin@brigada.com` - Admin activo
- `encargado@brigada.com` - Encargado activo
- `brigadista@brigada.com` - Brigadista activo
- `test@brigada.com` - Para probar activación

**Cualquier otro email será rechazado con mensaje:**

> "Email no autorizado. Debes estar en la whitelist para acceder."

### Estados de Usuario

- **INVITED**: Usuario invitado, necesita activación
- **ACTIVE**: Usuario activo, puede acceder normalmente
- **PENDING**: Cuenta creada pero perfil incompleto (no implementado aún)
- **DISABLED**: Cuenta deshabilitada por admin (no implementado aún)

---

## 🚀 Flujo Completo de Primera Vez

1. **Welcome Screen**
   - Opción 1: Tap "Iniciar Sesión" (si ya tienes usuario)
   - Opción 2: Tap "Usa tu código de activación" (primera vez)

2. **Si elegiste "Iniciar Sesión":**
   - Email: `test@brigada.com`
   - Password: cualquier cosa (ej: `test123`)
   - Tap "Iniciar Sesión"
   - ✅ Te detecta como INVITED
   - ✅ Mensaje: "Tu cuenta aún no ha sido activada"
   - ✅ **Guarda tu email automáticamente**
   - ✅ Te redirige a activación en 2 segundos

3. **Si elegiste "Usa tu código de activación":**
   - ✅ Va directo a pantalla de activación
   - ⚠️ **No tendrás email guardado** (tendrás que ingresarlo manualmente)

4. **Activación** (automático desde login o manual)
   - Si vienes desde login: **Email bloqueado** (test@brigada.com)
   - Si vienes desde welcome: Email vacío (debes ingresar)
   - Ingresa código: `123456`
   - ✅ Validación exitosa

5. **Crear Contraseña**
   - **Email bloqueado** si vienes desde activación con login
   - Define tu contraseña (mínimo 8 caracteres)
   - Confirma contraseña
   - Tap "Crear cuenta"

6. **Dashboard**
   - Ya estás dentro de la app!

---

## 🐛 Para Testing

### Probar validación de whitelist:

```
Email: noautorizado@test.com
Password: cualquiera
```

**Resultado esperado:** Error "Email no autorizado"

### Probar código de activación inválido:

```
Código: 999999
```

**Resultado esperado:** Error "Código inválido"

---

## 📍 Archivos Modificados

### ✅ Sistema de Email Pendiente

- `contexts/auth-context.tsx` - Nuevo campo `pendingEmail` y `setPendingEmail`
- `app/(auth)/login-enhanced.tsx` - Guarda email cuando detecta estado INVITED
- `app/(auth)/activation.tsx` - Muestra email guardado
- `app/(auth)/create-password.tsx` - **Email bloqueado** si viene de activación

### ✅ Flujo de Activación

El email se guarda automáticamente cuando:

1. Inicias sesión con un usuario en estado INVITED
2. Se pasa a la pantalla de activación
3. Se pasa a crear contraseña **con el email bloqueado**

### ⚠️ Importante

- Si vas directo a activación desde welcome (botón "Usa tu código"), **NO** se guarda email
- Solo se guarda si pasas por login primero
- El email guardado se limpia al crear la contraseña exitosamente

### ✅ Fixes Recientes

- **Glitch de teclado**: Solucionado en login, activation y create-password
- **Rutas de tabs**: Corregidas referencias a `surveys/index` y `responses/index` en todos los layouts

---

**Última actualización:** 10 de febrero de 2026
