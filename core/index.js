/**
 * CORE ARCHITECTURE EXPORTS (IMMUTABLE)
 *
 * Central export point for all core architecture components.
 *
 * @version 1.0.0
 * @locked true
 */

// Bootstrap
export {
  Bootstrap,
  BootstrapState,
  ApplicationContext,
  createApp
} from './bootstrap.js';

// Module System
export {
  ModuleRegistry
} from './module-registry.js';

// Contracts
export {
  ModuleContract,
  ModuleLifecycleState,
  ModulePriority,
  validateModuleMetadata
} from './contracts/module.contract.js';

export {
  ExtensionContract,
  HookExtension,
  ProviderExtension,
  MiddlewareExtension,
  FilterExtension,
  ValidatorExtension,
  ExtensionPointType,
  ExtensionPriority,
  validateExtensionMetadata
} from './contracts/extension.contract.js';

export {
  SecurityContext,
  AuthenticationProvider,
  AuthorizationProvider,
  AccessControlRule,
  SecurityPolicy,
  PermissionLevel,
  AuthenticationStatus
} from './contracts/security.contract.js';

// Security
export {
  SecurityManager
} from './security/security-manager.js';

// Extensions
export {
  ExtensionRegistry
} from './extensions/extension-registry.js';
