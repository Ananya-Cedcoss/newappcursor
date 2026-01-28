# Shopify App Core Architecture v1.0.0

## Overview

This is the **immutable core architecture** for the Shopify App. It provides the foundational framework for building modular, secure, and extensible applications.

**IMPORTANT:** This core architecture is **locked forever**. No feature logic or business rules should exist in this layer.

## Architecture Components

### 1. Bootstrap System (`bootstrap.js`)

The bootstrap orchestrates application initialization in the following order:

1. Load and validate configuration
2. Initialize module registry
3. Discover and register modules
4. Resolve dependencies
5. Initialize modules in priority order
6. Register extensions
7. Apply security policies

**Key Classes:**
- `Bootstrap` - Main orchestrator
- `ApplicationContext` - Shared context for all modules
- `BootstrapState` - Initialization state tracking

**Lifecycle Hooks:**
- `before:init` - Before initialization starts
- `registries:created` - After core registries are created
- `modules:registered` - After all modules are registered
- `dependencies:resolved` - After dependency graph is built
- `modules:initialized` - After all modules are initialized
- `extensions:registered` - After all extensions are registered
- `security:configured` - After security policies are applied
- `app:ready` - Application is ready
- `app:failed` - Initialization failed
- `before:shutdown` - Before shutdown starts
- `after:shutdown` - After shutdown completes

### 2. Module System

#### Module Contract (`contracts/module.contract.js`)

All modules must implement the `ModuleContract`:

```javascript
import { ModuleContract, ModulePriority } from '../core/index.js';

export default class MyModule extends ModuleContract {
  static get metadata() {
    return {
      id: 'namespace.my-module',
      name: 'My Module',
      version: '1.0.0',
      description: 'Module description',
      priority: ModulePriority.NORMAL,
      enabled: true,
      tags: ['feature']
    };
  }

  static get dependencies() {
    return ['namespace.other-module'];
  }

  static get permissions() {
    return ['resource.read', 'resource.write'];
  }

  static async initialize(context, config) {
    // Module initialization logic
  }

  static async cleanup() {
    // Cleanup resources
  }

  static async healthCheck() {
    return {
      healthy: true,
      timestamp: new Date().toISOString()
    };
  }
}
```

**Module Lifecycle:**
1. `UNINITIALIZED` - Module created
2. `REGISTERED` - Module registered in registry
3. `INITIALIZED` - Module initialize() completed
4. `READY` - Module health check passed
5. `FAILED` - Module initialization failed
6. `DISABLED` - Module disabled

**Module Priority Levels:**
- `CRITICAL` (0) - Core system modules
- `HIGH` (100) - Essential business modules
- `NORMAL` (200) - Standard modules
- `LOW` (300) - Optional/enhancement modules

#### Module Registry (`module-registry.js`)

The `ModuleRegistry` manages all modules:

- Registration and validation
- Dependency resolution (with circular dependency detection)
- Initialization order (topological sort by priority)
- State management
- Health monitoring

### 3. Extension System

#### Extension Contract (`contracts/extension.contract.js`)

Extensions allow modules to extend core functionality through well-defined contracts.

**Extension Types:**

1. **Hooks** - Event-driven extensions
```javascript
import { HookExtension } from '../core/index.js';

export class MyHook extends HookExtension {
  static get metadata() {
    return {
      id: 'namespace.module.my-hook',
      moduleId: 'namespace.module',
      name: 'My Hook'
    };
  }

  static get hookName() {
    return 'before:save';
  }

  static async execute(context, payload) {
    // Transform payload
    return payload;
  }
}
```

2. **Providers** - Service providers
```javascript
import { ProviderExtension } from '../core/index.js';

export class MyProvider extends ProviderExtension {
  static get metadata() {
    return {
      id: 'namespace.module.my-provider',
      moduleId: 'namespace.module',
      name: 'My Provider'
    };
  }

  static get providerInterface() {
    return 'storage';
  }

  static getProvider(context) {
    return {
      get: async (key) => { /* ... */ },
      set: async (key, value) => { /* ... */ }
    };
  }
}
```

3. **Middleware** - Request/response middleware
```javascript
import { MiddlewareExtension } from '../core/index.js';

export class MyMiddleware extends MiddlewareExtension {
  static async handle(request, response, next) {
    // Pre-processing
    await next();
    // Post-processing
  }
}
```

4. **Filters** - Data transformation
```javascript
import { FilterExtension } from '../core/index.js';

export class MyFilter extends FilterExtension {
  static get filterName() {
    return 'format.date';
  }

  static async apply(value, context) {
    return new Date(value).toISOString();
  }
}
```

5. **Validators** - Validation rules
```javascript
import { ValidatorExtension } from '../core/index.js';

export class MyValidator extends ValidatorExtension {
  static get validatorName() {
    return 'email';
  }

  static async validate(data, context) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data);
    return {
      valid,
      errors: valid ? [] : ['Invalid email format']
    };
  }
}
```

#### Extension Registry (`extensions/extension-registry.js`)

The `ExtensionRegistry` manages all extensions:

- Extension registration and validation
- Hook execution with priority ordering
- Provider resolution
- Middleware chain management
- Filter application
- Validation execution

### 4. Security System

#### Security Contract (`contracts/security.contract.js`)

**Key Classes:**

1. **SecurityContext** - Security state for operations
```javascript
const context = new SecurityContext({
  shop: 'my-shop.myshopify.com',
  session: sessionObject,
  user: userObject,
  permissions: ['resource.read'],
  roles: ['admin'],
  authenticated: true
});

// Check permissions
if (context.hasPermission('resource.write')) {
  // Authorized
}
```

2. **AuthenticationProvider** - Authentication contract
```javascript
export class MyAuthProvider extends AuthenticationProvider {
  static get name() {
    return 'custom-auth';
  }

  static async authenticate(request) {
    // Return SecurityContext
  }

  static async validateSession(session) {
    // Return boolean
  }
}
```

3. **AuthorizationProvider** - Authorization contract
```javascript
export class MyAuthzProvider extends AuthorizationProvider {
  static get name() {
    return 'custom-authz';
  }

  static async authorize(context, resource, action) {
    // Return boolean
  }

  static async getPermissions(context) {
    // Return string[]
  }

  static async getRoles(context) {
    // Return string[]
  }
}
```

4. **AccessControlRule** - Fine-grained access control
```javascript
const rule = new AccessControlRule({
  id: 'rule-1',
  resource: 'booking',
  action: 'create',
  permissions: ['booking.write'],
  roles: ['admin', 'manager'],
  condition: async (context) => {
    // Custom condition
    return true;
  }
});
```

5. **SecurityPolicy** - Collection of rules
```javascript
const policy = new SecurityPolicy('default');
policy.addRule(rule1);
policy.addRule(rule2);

const authorized = await policy.evaluate(context, 'booking', 'create');
```

#### Security Manager (`security/security-manager.js`)

The `SecurityManager` orchestrates security:

- Authentication provider registration
- Authorization provider registration
- Security policy management
- Permission and role management
- Context creation

### 5. Application Context

The `ApplicationContext` is shared across all modules:

```javascript
// Register service
context.registerService('database', prisma);

// Get service
const db = context.getService('database');

// Check service exists
if (context.hasService('cache')) {
  // Use cache
}
```

## Usage Example

### 1. Create Main Application Entry

```javascript
import { createApp } from './core/index.js';

// Initialize app
const context = await createApp({
  version: '1.0.0',
  environment: 'production',
  modulePaths: [
    './modules/booking/index.js',
    './modules/analytics/index.js'
  ],
  securityPolicies: [defaultPolicy],
  strict: true // Fail on module errors
});

// Access registries
const moduleRegistry = context.moduleRegistry;
const extensionRegistry = context.extensionRegistry;
const securityManager = context.securityManager;

// Access services
const db = context.getService('database');
```

### 2. Create a Module

```javascript
// modules/booking/index.js
import { ModuleContract, ModulePriority } from '../../core/index.js';
import { BookingHook } from './hooks/booking-hook.js';

export default class BookingModule extends ModuleContract {
  static get metadata() {
    return {
      id: 'logistics.booking',
      name: 'Booking Module',
      version: '1.0.0',
      description: 'Handles booking operations',
      priority: ModulePriority.HIGH,
      enabled: true,
      tags: ['core', 'booking']
    };
  }

  static get dependencies() {
    return ['logistics.database'];
  }

  static get permissions() {
    return ['booking.read', 'booking.write'];
  }

  static extensions = [BookingHook];

  static async initialize(context, config) {
    // Register services
    context.registerService('booking', {
      create: async (data) => { /* ... */ },
      update: async (id, data) => { /* ... */ }
    });
  }

  static async cleanup() {
    // Cleanup
  }

  static async healthCheck() {
    return { healthy: true };
  }
}
```

## Extension Rules

1. **No Feature Logic in Core** - Core contains only infrastructure
2. **Contract-Driven** - All modules and extensions must implement contracts
3. **Explicit Dependencies** - Declare all dependencies
4. **Fail-Safe** - Extensions should not break app if they fail
5. **Priority-Based** - Use priority for ordering
6. **Validation** - All metadata is validated on registration

## Security Rules

1. **Deny by Default** - No access unless explicitly granted
2. **Context-Based** - All operations require SecurityContext
3. **Permission-Based** - Use granular permissions
4. **Role-Based** - Group permissions into roles
5. **Policy-Driven** - Define access through policies

## Module Registration Rules

1. **Unique IDs** - Format: `namespace.module-name`
2. **Semantic Versioning** - Format: `x.y.z`
3. **No Circular Dependencies** - Will throw error
4. **Initialization Order** - Dependencies first, then priority
5. **Health Checks** - Implement for monitoring

## Best Practices

1. **Keep Core Pure** - No business logic in core
2. **Small Modules** - Single responsibility
3. **Explicit Contracts** - Clear interfaces
4. **Error Handling** - Graceful degradation
5. **Logging** - Use console for core events
6. **Testing** - Test modules in isolation
7. **Documentation** - Document module purpose and APIs

## Monitoring

Get application health:
```javascript
const health = await bootstrap.getHealth();
console.log(health);
```

Get module statistics:
```javascript
const stats = moduleRegistry.getStatistics();
console.log(stats);
```

Get extension statistics:
```javascript
const stats = extensionRegistry.getStatistics();
console.log(stats);
```

Get security statistics:
```javascript
const stats = securityManager.getStatistics();
console.log(stats);
```

## Version

**Core Architecture Version:** 1.0.0
**Status:** LOCKED FOREVER
**Last Modified:** 2026-01-27
