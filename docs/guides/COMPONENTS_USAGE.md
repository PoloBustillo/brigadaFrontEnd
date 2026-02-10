# 🧩 Guía de Uso - Componentes UI

## 📦 Importación

```typescript
// Importar componentes individuales
import { Button, Input, Card } from "@/components/ui";

// O importar uno por uno
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
```

---

## 🔘 Button Component

### **Variantes**

#### **Primary (Default)**

```typescript
<Button
  title="Iniciar sesión"
  onPress={handleLogin}
/>
```

#### **Secondary**

```typescript
<Button
  title="Cancelar"
  onPress={handleCancel}
  variant="secondary"
/>
```

#### **Outline**

```typescript
<Button
  title="Ver detalles"
  onPress={handleViewDetails}
  variant="outline"
/>
```

#### **Text**

```typescript
<Button
  title="¿Olvidaste tu contraseña?"
  onPress={handleForgotPassword}
  variant="text"
  size="medium"
/>
```

### **Con Loading**

```typescript
<Button
  title="Guardar"
  onPress={handleSave}
  loading={isSaving}
/>
```

### **Con Icono**

```typescript
<Button
  title="Descargar CV"
  onPress={handleDownload}
  icon="download-outline"
  variant="secondary"
/>
```

### **Disabled**

```typescript
<Button
  title="Continuar"
  onPress={handleContinue}
  disabled={!isFormValid}
/>
```

### **Tamaños**

```typescript
<Button title="Grande" size="large" onPress={() => {}} />
<Button title="Medio" size="medium" onPress={() => {}} />
<Button title="Pequeño" size="small" onPress={() => {}} />
```

---

## 📝 Input Component

### **Email Input**

```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

<Input
  label="Correo electrónico"
  icon="📧"
  type="email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  showSuccess
  onClear={() => setEmail('')}
  placeholder="tu@email.com"
/>
```

### **Password Input**

```typescript
const [password, setPassword] = useState('');

<Input
  label="Contraseña"
  icon="🔒"
  type="password"
  value={password}
  onChangeText={setPassword}
  helperText="Mínimo 6 caracteres"
/>
```

### **Number Input**

```typescript
<Input
  label="Teléfono"
  icon="📱"
  type="number"
  value={phone}
  onChangeText={setPhone}
/>
```

### **Text Input con Validación**

```typescript
const [name, setName] = useState('');
const [nameError, setNameError] = useState('');

<Input
  label="Nombre completo"
  icon="👤"
  value={name}
  onChangeText={(text) => {
    setName(text);
    if (text.length < 3) {
      setNameError('El nombre debe tener al menos 3 caracteres');
    } else {
      setNameError('');
    }
  }}
  error={nameError}
  showSuccess
/>
```

---

## 📄 Card Component

### **Default Card**

```typescript
<Card>
  <Text style={styles.cardTitle}>Mi Encuesta</Text>
  <Text style={styles.cardSubtitle}>En progreso</Text>
</Card>
```

### **Elevated Card (con sombra)**

```typescript
<Card variant="elevated" onPress={handleCardPress}>
  <View style={styles.cardHeader}>
    <Text style={styles.cardTitle}>Censo 2024</Text>
    <Badge label="Activa" variant="success" />
  </View>
  <ProgressBar progress={65} />
</Card>
```

### **Outlined Card (seleccionable)**

```typescript
<Card
  variant="outlined"
  selected={selectedRole === 'brigadista'}
  onPress={() => setSelectedRole('brigadista')}
>
  <View style={styles.roleCard}>
    <Text style={styles.roleIcon}>👮</Text>
    <Text style={styles.roleTitle}>Brigadista</Text>
    <Text style={styles.roleDescription}>Realizar encuestas</Text>
  </View>
</Card>
```

### **Card con Padding Personalizado**

```typescript
<Card padding={24} variant="elevated">
  <Text>Contenido con más padding</Text>
</Card>
```

---

## 🎯 Badge Component

### **Estados**

```typescript
<Badge label="Completada" variant="success" />
<Badge label="Error" variant="error" />
<Badge label="Pendiente" variant="warning" />
<Badge label="Info" variant="info" />
<Badge label="Neutral" variant="neutral" />
```

### **Tamaños**

```typescript
<Badge label="Grande" size="medium" variant="success" />
<Badge label="Pequeño" size="small" variant="info" />
```

### **En Cards**

```typescript
<Card variant="elevated">
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text style={styles.title}>Mi Encuesta</Text>
    <Badge label="En progreso" variant="warning" />
  </View>
</Card>
```

---

## ⚠️ Alert Component

### **Success Alert**

```typescript
<Alert
  variant="success"
  title="¡Éxito!"
  message="Encuesta enviada correctamente"
/>
```

### **Error Alert**

```typescript
<Alert
  variant="error"
  title="Error de conexión"
  message="No se pudo conectar con el servidor. Verifica tu conexión."
/>
```

### **Warning Alert**

```typescript
<Alert
  variant="warning"
  title="Advertencia"
  message="Tienes cambios sin guardar"
/>
```

### **Info Alert**

```typescript
<Alert
  variant="info"
  message="Recuerda completar todos los campos obligatorios"
/>
```

### **Sin Título**

```typescript
<Alert
  variant="success"
  message="Operación completada"
/>
```

---

## 📊 ProgressBar Component

### **Basic**

```typescript
<ProgressBar progress={65} />
```

### **Sin Label**

```typescript
<ProgressBar progress={80} showLabel={false} />
```

### **Color Personalizado**

```typescript
<ProgressBar
  progress={100}
  color="#4CAF50"
/>
```

### **Altura Personalizada**

```typescript
<ProgressBar
  progress={45}
  height={4}
/>
```

### **En Cards**

```typescript
<Card variant="elevated">
  <Text style={styles.cardTitle}>Censo 2024</Text>
  <Text style={styles.cardSubtitle}>15 de 23 completadas</Text>
  <ProgressBar progress={65} color="#FF1B8D" />
</Card>
```

---

## 🎨 Ejemplo Completo: Login Screen

```typescript
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Input, Alert } from '@/components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleLogin = async () => {
    // Validar
    if (!validateEmail(email)) {
      setEmailError('Formato de email inválido');
      return;
    }

    setLoading(true);

    try {
      // Simular login
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowAlert(true);
    } catch (error) {
      setEmailError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      {showAlert && (
        <Alert
          variant="success"
          message="Inicio de sesión exitoso"
        />
      )}

      <Input
        label="Correo electrónico"
        icon="📧"
        type="email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) setEmailError('');
        }}
        error={emailError}
        showSuccess
        onClear={() => setEmail('')}
      />

      <Input
        label="Contraseña"
        icon="🔒"
        type="password"
        value={password}
        onChangeText={setPassword}
        helperText="Mínimo 6 caracteres"
      />

      <Button
        title="Iniciar sesión"
        onPress={handleLogin}
        loading={loading}
        disabled={!email || !password}
      />

      <Button
        title="¿Olvidaste tu contraseña?"
        onPress={() => {}}
        variant="text"
        size="medium"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
});
```

---

## 🎨 Ejemplo: Role Selection

```typescript
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '@/components/ui';

const roles = [
  { id: 'brigadista', icon: '👮', title: 'Brigadista', description: 'Realizar encuestas' },
  { id: 'supervisor', icon: '👔', title: 'Supervisor', description: 'Revisar y aprobar' },
  { id: 'admin', icon: '📊', title: 'Administrador', description: 'Gestionar sistema' },
];

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona tu rol</Text>

      {roles.map(role => (
        <Card
          key={role.id}
          variant="outlined"
          selected={selectedRole === role.id}
          onPress={() => setSelectedRole(role.id)}
          style={styles.roleCard}
        >
          <Text style={styles.roleIcon}>{role.icon}</Text>
          <Text style={styles.roleTitle}>{role.title}</Text>
          <Text style={styles.roleDescription}>{role.description}</Text>
        </Card>
      ))}

      <Button
        title="Continuar"
        onPress={() => {}}
        disabled={!selectedRole}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  roleCard: {
    marginBottom: 16,
  },
  roleIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
  },
});
```

---

## 🎯 Tips de Uso

### **1. Validación en Tiempo Real**

```typescript
const [value, setValue] = useState('');
const [error, setError] = useState('');

<Input
  value={value}
  onChangeText={(text) => {
    setValue(text);
    // Limpiar error al escribir
    if (error) setError('');
  }}
  onBlur={() => {
    // Validar al perder foco
    if (value.length < 3) {
      setError('Muy corto');
    }
  }}
  error={error}
/>
```

### **2. Loading States**

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await doSomething();
  } finally {
    setLoading(false);
  }
};

<Button
  title="Guardar"
  loading={loading}
  onPress={handleAction}
/>
```

### **3. Feedback Inmediato**

```typescript
const [showSuccess, setShowSuccess] = useState(false);

const handleSubmit = async () => {
  await submitForm();
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 3000);
};

{showSuccess && (
  <Alert variant="success" message="¡Guardado!" />
)}
```

---

## 📚 Recursos

- 📄 **UX Guidelines**: `docs/guides/UX_GUIDELINES.md`
- 🎨 **Colors**: `constants/colors.ts`
- 📝 **Typography**: `constants/typography.ts`
- 📐 **Spacing**: `constants/spacing.ts`

🚀 **¡Listo para construir pantallas profesionales!**
