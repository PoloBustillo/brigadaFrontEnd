/**
 * Database Types - Brigada Digital
 * Definiciones de tipos TypeScript para las tablas de la base de datos
 */

// ==================== ENUMS ====================

export enum UserRole {
  ADMIN = "ADMIN",
  ENCARGADO = "ENCARGADO",
  BRIGADISTA = "BRIGADISTA",
}

export enum UserState {
  INVITED = "INVITED", // Código generado, no activado
  PENDING = "PENDING", // Código activado, registro incompleto
  ACTIVE = "ACTIVE", // Usuario activo
  DISABLED = "DISABLED", // Usuario deshabilitado
}

export enum InvitationStatus {
  PENDING = "PENDING", // Código generado, no usado
  ACTIVATED = "ACTIVATED", // Código usado para activación
  EXPIRED = "EXPIRED", // Código expirado (>7 días)
  REVOKED = "REVOKED", // Código revocado manualmente
}

// ==================== TABLAS ====================

/**
 * Tabla: users
 * Almacena información de usuarios del sistema
 */
export interface User {
  id: string; // UUID
  email: string; // Único
  passwordHash: string; // bcrypt hash
  fullName: string;
  phone?: string;
  role: UserRole;
  state: UserState;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastLoginAt?: string; // ISO 8601
  createdBy?: string; // UUID del admin que lo creó
}

/**
 * Tabla: invitations
 * Códigos de activación para nuevos usuarios
 */
export interface Invitation {
  id: string; // UUID
  code: string; // Código de 8 caracteres (ÚNICO)
  email: string; // Email del invitado
  role: UserRole; // Rol asignado
  status: InvitationStatus;
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601 (createdAt + 7 días)
  activatedAt?: string; // ISO 8601
  activatedBy?: string; // UUID del usuario que lo activó
  createdBy: string; // UUID del admin que generó la invitación
}

/**
 * Tabla: whitelist
 * Lista de usuarios autorizados (descargada del servidor)
 * Permite validación offline de acceso
 */
export interface WhitelistEntry {
  id: string; // UUID
  userId: string; // UUID del usuario
  email: string; // Email del usuario
  role: UserRole; // Rol actual
  isActive: boolean; // Si está activo
  lastSyncAt: string; // ISO 8601 - última sincronización
  syncedAt: string; // ISO 8601 - cuando se descargó
}

/**
 * Tabla: audit_logs
 * Registro de auditoría de acciones importantes
 */
export interface AuditLog {
  id: string; // UUID
  userId?: string; // UUID del usuario (null para eventos del sistema)
  action: string; // Ej: "LOGIN", "LOGOUT", "USER_CREATED", "INVITATION_SENT"
  resource?: string; // Recurso afectado (ej: "user:uuid")
  details?: string; // JSON con detalles adicionales
  ipAddress?: string; // Dirección IP
  userAgent?: string; // User agent
  createdAt: string; // ISO 8601
  syncedToServer: boolean; // Si ya se envió al servidor
}

// ==================== ASSIGNMENT TABLES ====================

/**
 * Tabla: survey_assignments
 * Asignación de encuestas a Encargados
 */
export interface SurveyAssignment {
  id: string; // UUID
  surveySchemaId: string; // UUID de la encuesta
  encargadoId: string; // UUID del Encargado
  assignedBy: string; // UUID del Admin que asignó
  assignedAt: string; // ISO 8601
  revokedAt?: string; // ISO 8601
  isActive: boolean; // Si la asignación está activa
  notes?: string; // Notas sobre la asignación
}

/**
 * Tabla: brigadista_assignments
 * Asignación de Brigadistas a encuestas específicas
 */
export interface BrigadistaAssignment {
  id: string; // UUID
  surveySchemaId: string; // UUID de la encuesta
  brigadistaId: string; // UUID del Brigadista
  encargadoId: string; // UUID del Encargado que asigna
  assignedBy: string; // UUID de quien asignó (usualmente el Encargado)
  assignedAt: string; // ISO 8601
  revokedAt?: string; // ISO 8601
  isActive: boolean; // Si la asignación está activa
  targetCount?: number; // Meta de encuestas a completar
  notes?: string; // Notas sobre la asignación
}

/**
 * Tabla: team_memberships
 * Relación Encargado-Brigadista
 */
export interface TeamMembership {
  id: string; // UUID
  encargadoId: string; // UUID del Encargado
  brigadistaId: string; // UUID del Brigadista
  addedBy: string; // UUID de quien lo agregó
  addedAt: string; // ISO 8601
  removedAt?: string; // ISO 8601
  isActive: boolean; // Si la membresía está activa
  roleDescription?: string; // Descripción del rol en el equipo
}

// ==================== HELPERS ====================

/**
 * Interface para resultados de consultas con paginación
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Interface para estadísticas de la base de datos
 */
export interface DatabaseStats {
  totalUsers: number;
  activeUsers: number;
  pendingInvitations: number;
  whitelistEntries: number;
  unsyncedLogs: number;
}
