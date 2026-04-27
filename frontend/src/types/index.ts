/**
 * Central type definitions for Loom Framework Frontend.
 * Replaces 'any' types with proper interfaces.
 */

// User & Auth Types
export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role?: Role;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Blueprint/Module Types
export interface BlueprintField {
  name: string;
  label?: string;
  type: 'String' | 'Integer' | 'Float' | 'Boolean' | 'Date' | 'DateTime' | 'JSON';
  required?: boolean;
  default?: string | number | boolean;
  onupdate?: string;
}

export interface BlueprintAssociation {
  type: 'belongs_to' | 'has_many' | 'has_one';
  target: string;
  foreign_key?: string;
}

export interface BlueprintView {
  id?: string;
  name: string;
  type: 'summary' | 'association' | 'comments' | 'history' | 'custom';
  target?: string;
}

export interface BlueprintUI {
  show_in_sidebar?: boolean;
  icon?: string;
  default_view?: string;
}

export interface BlueprintOverrides {
  backend_router?: string;
  frontend_view?: string;
  frontend_analytics?: string;
}

export interface BlueprintFeatures {
  [key: string]: boolean | string;
}

export interface ModuleDefinition {
  name: string;
  slug: string;
  description?: string;
  module?: string;
  table_name?: string;
  permission_namespace?: string;
  ui?: BlueprintUI;
  views?: BlueprintView[];
  fields?: BlueprintField[];
  associations?: BlueprintAssociation[];
  overrides?: BlueprintOverrides;
  features?: BlueprintFeatures;
}

export type ModuleGroup = Record<string, ModuleDefinition[]>;

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  detail: string;
  status?: number;
}

// Record Types
export interface RecordData {
  id: number;
  [key: string]: unknown;
}

export interface AuditEntry {
  id: number;
  model_name: string;
  record_id: number;
  action: 'Created' | 'Updated' | 'Deleted';
  changes: Record<string, { old: unknown; new: unknown }> | Record<string, unknown>;
  actor: string;
  timestamp: string;
}

export interface CommentEntry {
  id: number;
  model_name: string;
  record_id: number;
  content: string;
  author: string;
  created_at: string;
}

// Admin Types
export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role_id?: number;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  full_name?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface RoleCreate {
  name: string;
  permission_ids: number[];
}

export interface SystemSetting {
  key: string;
  value: string;
  group?: string;
  description?: string;
  updated_at?: string;
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: number;
  checks: Record<string, { status: 'healthy' | 'unhealthy'; error?: string }>;
}
