# ✅ Login Screen - Testing Checklist

## 🎯 ACCESIBILIDAD

### VoiceOver (iOS) / TalkBack (Android)

- [ ] Activar screen reader
- [ ] Botón "Regresar" se anuncia correctamente
- [ ] Inputs de email y password son navegables
- [ ] Error alert se anuncia inmediatamente cuando aparece
- [ ] Info box se lee correctamente
- [ ] Botón "Iniciar sesión" indica si está disabled
- [ ] Link del footer "Activa tu cuenta" es anunciado como link
- [ ] Navegación con gestos funciona (swipe left/right)

### Áreas Táctiles

- [ ] Botón back (44x44 mínimo) - fácil de presionar
- [ ] Footer link tiene hitSlop - fácil de presionar
- [ ] Todos los botones son fácilmente presionables

---

## 📳 HAPTIC FEEDBACK

### Vibraciones

- [ ] **Login button**: Vibración medium al presionar
- [ ] **Back button**: Vibración light al presionar
- [ ] **Forgot password**: Vibración light al presionar
- [ ] **Footer link**: Vibración light al presionar
- [ ] **Error (shake)**: Vibración de error al mostrar error
- [ ] **Login exitoso**: Vibración de success al completar

**Nota:** Si no sientes vibraciones, verifica que el dispositivo no esté en modo silencio.

---

## 🌐 NETWORK ERROR HANDLING

### Sin Conexión (WiFi/Datos OFF)

1. [ ] Desactivar WiFi y datos móviles
2. [ ] Intentar login
3. [ ] **Esperado**: Mensaje "Sin conexión a internet. Verifica tu WiFi o datos móviles..."
4. [ ] **Esperado**: NO hace request al servidor
5. [ ] **Esperado**: Shake animation + vibración de error

### Modo Avión

1. [ ] Activar modo avión
2. [ ] Intentar login
3. [ ] **Esperado**: Mismo comportamiento que "Sin conexión"

### Conexión Inestable (Simulación)

**Opción 1: Network Link Conditioner (iOS)**

1. Descargar "Additional Tools for Xcode"
2. Abrir Network Link Conditioner
3. Seleccionar perfil "Very Bad Network" o "3G"
4. Intentar login
5. [ ] **Esperado**: Retry automático (ver logs en consola)
6. [ ] **Esperado**: Si falla después de 3 intentos, muestra error

**Opción 2: Charles Proxy / Proxyman**

1. Configurar proxy para simular timeout
2. Intentar login
3. [ ] **Esperado**: Retry automático con delays (1s, 2s)
4. [ ] Ver en consola: "Retry attempt 1/2 after 1000ms"

---

## 🔄 RETRY LOGIC

### Errores que NO deben reintentar

1. [ ] **Email no en whitelist**: Email incorrecto → NO reintenta
2. [ ] **Password incorrecto**: Credenciales inválidas → NO reintenta
3. [ ] **Cuenta desactivada**: Estado DISABLED → NO reintenta

### Errores que SÍ deben reintentar

1. [ ] **Timeout**: Simular con proxy → Reintenta 2 veces
2. [ ] **Error 500**: Simular error de servidor → Reintenta 2 veces
3. [ ] **ECONNREFUSED**: Servidor caído → Reintenta 2 veces

**Verificar en Console:**

```
Retry attempt 1/2 after 1000ms
Retry attempt 2/2 after 2000ms
```

---

## 🎨 FEEDBACK VISUAL

### Estados del Botón de Login

- [ ] **Form inválido**: Botón disabled (gris)
- [ ] **Form válido**: Botón enabled (gradiente)
- [ ] **Loading**: Spinner + texto del botón
- [ ] **Error**: Shake animation + alert roja
- [ ] **Success**: Navegación a dashboard

### Mensajes de Error

- [ ] Email vacío → "El email es requerido"
- [ ] Email inválido → "Formato de email inválido"
- [ ] Password vacío → "La contraseña es requerida"
- [ ] Password corto → "La contraseña debe tener al menos 6 caracteres"
- [ ] Sin conexión → "Sin conexión a internet..."
- [ ] Whitelist → "Email no autorizado..."
- [ ] Credenciales → "Usuario o contraseña incorrectos"
- [ ] Server error → "Error del servidor..."

---

## 🧪 CASOS DE PRUEBA

### Test 1: Login Exitoso (Admin)

1. [ ] Email: `admin@brigada.com`
2. [ ] Password: `admin123`
3. [ ] Presionar "Iniciar sesión"
4. [ ] **Esperado**: Vibración success + navegación a dashboard admin

### Test 2: Login INVITED (Primera vez)

1. [ ] Email: `test@brigada.com`
2. [ ] Password: cualquiera
3. [ ] Presionar "Iniciar sesión"
4. [ ] **Esperado**: Mensaje "Tu cuenta aún no ha sido activada..."
5. [ ] **Esperado**: Navegación a pantalla de activación después de 2s

### Test 3: Email No Autorizado

1. [ ] Email: `noexiste@email.com`
2. [ ] Password: cualquiera
3. [ ] Presionar "Iniciar sesión"
4. [ ] **Esperado**: Error "Email no autorizado. Debes estar en la whitelist..."
5. [ ] **Esperado**: Shake + vibración error
6. [ ] **Esperado**: NO reintenta (client error)

### Test 4: Credenciales Incorrectas

1. [ ] Email: `admin@brigada.com`
2. [ ] Password: `wrong123`
3. [ ] Presionar "Iniciar sesión"
4. [ ] **Esperado**: Error "Usuario o contraseña incorrectos"
5. [ ] **Esperado**: Shake + vibración error
6. [ ] **Esperado**: NO reintenta

### Test 5: Sin Conexión

1. [ ] Desactivar WiFi/datos
2. [ ] Email: `admin@brigada.com`
3. [ ] Password: `admin123`
4. [ ] Presionar "Iniciar sesión"
5. [ ] **Esperado**: Error "Sin conexión a internet..."
6. [ ] **Esperado**: Shake + vibración error
7. [ ] **Esperado**: NO hace request

### Test 6: Navegación

- [ ] Presionar botón "Back" → Vibración light + vuelve atrás
- [ ] Presionar "¿Olvidaste tu contraseña?" → Vibración light + console log
- [ ] Presionar footer "Activa tu cuenta aquí" → Vibración light + navega a activation

---

## 📊 RESULTADOS ESPERADOS

### Performance

- [ ] No lag al escribir en inputs
- [ ] Animaciones fluidas (60fps)
- [ ] Respuesta inmediata al presionar botones
- [ ] Network check no bloquea UI

### Logging (Console)

- [ ] Network state changes aparecen en consola
- [ ] Retry attempts se loguean correctamente
- [ ] Errores incluyen email ofuscado (ej: "adm\*\*\*")
- [ ] Timestamp en formato ISO

### UX

- [ ] Feedback háptico se siente natural
- [ ] Mensajes de error son claros y accionables
- [ ] Loading states son evidentes
- [ ] No hay estados confusos o ambiguos

---

## 🐛 BUGS CONOCIDOS / LIMITACIONES

### Haptics

- ⚠️ **iOS**: Vibraciones NO funcionan en simulador (probar en dispositivo real)
- ⚠️ **Android**: Verificar que "Vibration" esté habilitada en ajustes

### Network Monitoring

- ⚠️ `NetInfo` puede tener delay de 1-2s al detectar cambios
- ⚠️ En iOS, requiere permisos de red

### Retry Logic

- ⚠️ Si el servidor responde 4xx, NO reintenta (by design)
- ⚠️ Máximo 3 intentos (configurable en código)

---

## ✅ CHECKLIST FINAL

Antes de marcar como "DONE", verificar:

- [ ] Todas las pruebas de accesibilidad pasan
- [ ] Haptic feedback funciona en dispositivo real
- [ ] Manejo de errores de red funciona correctamente
- [ ] Retry logic se comporta como esperado
- [ ] No hay console errors o warnings
- [ ] Performance es aceptable (no lag)
- [ ] Documentación está actualizada
- [ ] Código está limpio (no TODOs críticos)

---

## 🎯 MÉTRICAS DE ÉXITO

- ✅ **Accesibilidad**: Score 100% en React Native Accessibility Inspector
- ✅ **Haptics**: 6/6 interacciones con feedback
- ✅ **Network**: 100% de errores de red manejados
- ✅ **Retry**: 80%+ de success rate en conexiones inestables
- ✅ **UX**: 0 quejas de usuarios sobre feedback

---

**📝 Notas:**

- Probar en dispositivo real, no solo simulador
- Probar en ambos iOS y Android
- Probar con diferentes velocidades de conexión
- Probar con screen readers activados

**🚀 ¡Happy Testing!**
