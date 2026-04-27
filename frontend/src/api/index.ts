/**
 * API Layer Exports
 * Clean barrel export for all API modules.
 */

export {
  authApi,
  modulesApi,
  recordsApi,
  commentsApi,
  auditApi,
  adminApi,
  settingsApi,
  healthApi,
} from './axios';

export { default as apiClient } from './axios';
