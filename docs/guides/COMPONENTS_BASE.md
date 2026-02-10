# 🧩 Componentes Base - Brigada Digital

## 📦 Componentes Reutilizables

### 1. 🔘 Button Component

```typescript
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}: ButtonProps) {
  const getButtonStyle = () => {
    const base = {
      height: size === 'large' ? 56 : size === 'medium' ? 48 : 40,
      borderRadius: 16,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      paddingHorizontal: 24,
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: disabled ? '#BDC3C7' : '#FF1B8D',
          shadowColor: '#FF1B8D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: disabled ? 0 : 0.3,
          shadowRadius: 8,
          elevation: disabled ? 0 : 8,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: disabled ? '#E0E4E8' : '#FFFFFF',
          borderWidth: 2,
          borderColor: disabled ? '#E0E4E8' : '#FF1B8D',
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? '#BDC3C7' : '#FF1B8D',
        };
      case 'text':
        return {
          ...base,
          backgroundColor: 'transparent',
          height: 'auto' as any,
        };
      default:
        return base;
    }
  };

  const getTextStyle = () => {
    const base = {
      fontSize: size === 'large' ? 18 : size === 'medium' ? 16 : 14,
      fontWeight: '600' as const,
    };

    switch (variant) {
      case 'primary':
        return { ...base, color: '#FFFFFF' };
      case 'secondary':
      case 'outline':
      case 'text':
        return { ...base, color: disabled ? '#BDC3C7' : '#FF1B8D' };
      default:
        return base;
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator
            color={variant === 'primary' ? '#FFFFFF' : '#FF1B8D'}
          />
          <Text style={getTextStyle()}>Cargando...</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color={getTextStyle().color}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

**Uso:**

```typescript
<Button
  title="Iniciar sesión"
  onPress={handleLogin}
  loading={isLoading}
/>

<Button
  title="Cancelar"
  onPress={handleCancel}
  variant="outline"
/>

<Button
  title="Ver más"
  onPress={handleViewMore}
  variant="text"
  size="medium"
/>
```

---

### 2. 📝 Input Component

```typescript
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  icon?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  showSuccess?: boolean;
  onClear?: () => void;
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  type = 'text',
  showSuccess = false,
  onClear,
  value,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const hasValue = value && value.length > 0;

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>
        {icon && `${icon} `}{label}
      </Text>

      {/* Input Container */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            focused && styles.inputFocused,
            error && styles.inputError,
            showSuccess && hasValue && styles.inputSuccess,
          ]}
          placeholder={props.placeholder || label}
          placeholderTextColor="#BDC3C7"
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={getKeyboardType()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          secureTextEntry={type === 'password' && !showPassword}
          {...props}
        />

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          {/* Clear Button */}
          {hasValue && onClear && (
            <TouchableOpacity onPress={onClear} style={styles.iconButton}>
              <Ionicons name="close-circle" size={20} color="#BDC3C7" />
            </TouchableOpacity>
          )}

          {/* Password Toggle */}
          {type === 'password' && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconButton}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={24}
                color="#6C7A89"
              />
            </TouchableOpacity>
          )}

          {/* Success Check */}
          {showSuccess && hasValue && !error && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}

          {/* Error Icon */}
          {error && (
            <Ionicons name="alert-circle" size={24} color="#F44336" />
          )}
        </View>
      </View>

      {/* Helper/Error Text */}
      {error && (
        <Text style={styles.errorText}>❌ {error}</Text>
      )}
      {!error && helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E4E8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingRight: 48, // Space for right icons
    fontSize: 17,
    color: '#1A1A2E',
  },
  inputFocused: {
    borderColor: '#FF1B8D',
    shadowColor: '#FF1B8D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inputError: {
    borderColor: '#F44336',
  },
  inputSuccess: {
    borderColor: '#4CAF50',
  },
  rightIcons: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6C7A89',
    marginTop: 4,
  },
});
```

**Uso:**

```typescript
<Input
  label="Correo electrónico"
  icon="📧"
  type="email"
  value={email}
  onChangeText={setEmail}
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
```

---

### 3. 📄 Card Component

```typescript
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
  selected?: boolean;
}

export default function Card({
  children,
  onPress,
  variant = 'default',
  padding = 16,
  selected = false,
}: CardProps) {
  const getCardStyle = () => {
    const base = {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 2,
          borderColor: selected ? '#FF1B8D' : '#E0E4E8',
          backgroundColor: selected ? '#FFF0F7' : '#FFFFFF',
        };
      default:
        return {
          ...base,
          borderWidth: 1,
          borderColor: '#F0F0F0',
        };
    }
  };

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={getCardStyle()}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Wrapper>
  );
}
```

**Uso:**

```typescript
<Card variant="elevated" onPress={handleCardPress}>
  <Text style={styles.cardTitle}>Mi Encuesta</Text>
  <Text style={styles.cardSubtitle}>En progreso</Text>
</Card>

<Card variant="outlined" selected={isSelected}>
  <Text>👮 Brigadista</Text>
  <Text>Realizar encuestas</Text>
</Card>
```

---

### 4. 🎯 Badge Component

```typescript
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'small' | 'medium';
}

export default function Badge({
  label,
  variant = 'neutral',
  size = 'medium'
}: BadgeProps) {
  const getStyle = () => {
    const colors = {
      success: { bg: '#E8F5E9', text: '#2E7D32' },
      error: { bg: '#FFEBEE', text: '#C62828' },
      warning: { bg: '#FFF3E0', text: '#E65100' },
      info: { bg: '#E3F2FD', text: '#1565C0' },
      neutral: { bg: '#F5F5F5', text: '#616161' },
    };

    return {
      container: {
        backgroundColor: colors[variant].bg,
        paddingHorizontal: size === 'small' ? 8 : 12,
        paddingVertical: size === 'small' ? 4 : 6,
        borderRadius: 12,
        alignSelf: 'flex-start' as const,
      },
      text: {
        fontSize: size === 'small' ? 11 : 13,
        fontWeight: '600' as const,
        color: colors[variant].text,
      },
    };
  };

  const styles = getStyle();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}
```

**Uso:**

```typescript
<Badge label="En progreso" variant="warning" />
<Badge label="Completada" variant="success" />
<Badge label="Pendiente" variant="neutral" size="small" />
```

---

### 5. ⚠️ Alert Component

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AlertProps {
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

export default function Alert({ title, message, variant = 'info' }: AlertProps) {
  const config = {
    success: {
      icon: 'checkmark-circle',
      color: '#4CAF50',
      bg: '#E8F5E9'
    },
    error: {
      icon: 'close-circle',
      color: '#F44336',
      bg: '#FFEBEE'
    },
    warning: {
      icon: 'warning',
      color: '#FF9800',
      bg: '#FFF3E0'
    },
    info: {
      icon: 'information-circle',
      color: '#2196F3',
      bg: '#E3F2FD'
    },
  };

  const current = config[variant];

  return (
    <View style={[styles.container, { backgroundColor: current.bg }]}>
      <Ionicons name={current.icon as any} size={24} color={current.color} />
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: current.color }]}>
            {title}
          </Text>
        )}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginVertical: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#424242',
  },
});
```

**Uso:**

```typescript
<Alert
  variant="error"
  title="Error de conexión"
  message="No se pudo conectar con el servidor"
/>

<Alert
  variant="success"
  message="Encuesta enviada correctamente"
/>
```

---

### 6. 📊 Progress Bar Component

```typescript
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export default function ProgressBar({
  progress,
  showLabel = true,
  height = 8,
  color = '#FF1B8D',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              height,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  track: {
    flex: 1,
    backgroundColor: '#E0E4E8',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C7A89',
    minWidth: 40,
    textAlign: 'right',
  },
});
```

**Uso:**

```typescript
<ProgressBar progress={60} />
<ProgressBar progress={100} color="#4CAF50" showLabel={false} height={4} />
```

---

## 📦 Exportación Central

```typescript
// components/index.ts
export { default as Button } from "./button";
export { default as Input } from "./input";
export { default as Card } from "./card";
export { default as Badge } from "./badge";
export { default as Alert } from "./alert";
export { default as ProgressBar } from "./progress-bar";
```

**Uso:**

```typescript
import { Button, Input, Card } from "@/components";
```

---

## 🎨 Theme Provider (Opcional)

```typescript
// theme/colors.ts
export const colors = {
  primary: "#FF1B8D",
  primaryLight: "#FF6B9D",
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
  background: "#F5F7FA",
  surface: "#FFFFFF",
  border: "#E0E4E8",
  text: "#1A1A2E",
  textSecondary: "#6C7A89",
};

// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

---

**🎯 Con estos componentes base ya puedes construir todas las pantallas!**
