# Core Architecture v1.0.0

**Status:** LOCKED FOREVER - This is the immutable foundation of the Shopify App.

## What Is This?

This directory contains the **core architecture** for building modular, secure, and extensible Shopify applications. It provides:

- **Module System** - Load and manage features as independent modules
- **Extension Framework** - Extend functionality through hooks, providers, middleware, filters, and validators
- **Security Layer** - Authentication, authorization, and access control
- **Bootstrap Orchestration** - Controlled initialization with dependency resolution

## Key Principles

1. **No Feature Logic** - Core contains only infrastructure contracts
2. **Contract-Driven** - Everything implements well-defined interfaces
3. **Dependency Management** - Automatic resolution with circular dependency detection
4. **Security First** - All operations require security context
5. **Extensibility** - Clean extension points for customization

## Quick Start

### 1. Create a Module

```javascript
import { ModuleContract, ModulePriority } from '../core/index.js';

export default class MyModule extends ModuleContract {
  static get metadata() {
    return {
      id: 'myapp.my-module',
      name: 'My Module',
      version: '1.0.0',
      priority: ModulePriority.NORMAL
    };
  }

  static async initialize(context, config) {
    // Your initialization logic
  }
}
```

### 2. Bootstrap the App

```javascript
import { createApp } from './core/index.js';

const context = await createApp({
  modulePaths: ['./modules/my-module/index.js'],
  securityPolicies: [myPolicy]
});
```

### 3. Use Registered Services

```javascript
const myService = context.getService('my-service');
await myService.doSomething();
```

## Architecture Components

### Bootstrap (`bootstrap.js`)
Orchestrates app initialization, module loading, dependency resolution, and lifecycle management.

### Module Registry (`module-registry.js`)
Manages module registration, dependency resolution, initialization order, and health monitoring.

### Extension Registry (`extensions/extension-registry.js`)
Manages hooks, providers, middleware, filters, and validators from modules.

### Security Manager (`security/security-manager.js`)
Handles authentication, authorization, policies, permissions, and roles.

### Contracts (`contracts/`)
- `module.contract.js` - Module interface
- `extension.contract.js` - Extension interfaces (hooks, providers, middleware, filters, validators)
- `security.contract.js` - Security interfaces (context, providers, policies, rules)

## Directory Structure

```
core/
├── bootstrap.js              # Application bootstrap orchestrator
├── module-registry.js        # Module lifecycle manager
├── index.js                  # Main exports
├── contracts/
│   ├── module.contract.js    # Module interface
│   ├── extension.contract.js # Extension interfaces
│   └── security.contract.js  # Security interfaces
├── extensions/
│   └── extension-registry.js # Extension manager
├── security/
│   └── security-manager.js   # Security orchestrator
├── ARCHITECTURE.md           # Detailed architecture docs
└── README.md                 # This file
```

## Extension Types

1. **Hooks** - Event-driven hooks for lifecycle events
2. **Providers** - Service implementations (storage, cache, etc.)
3. **Middleware** - Request/response processing
4. **Filters** - Data transformation pipelines
5. **Validators** - Validation rules

## Module Lifecycle

```
UNINITIALIZED → REGISTERED → INITIALIZED → READY
                                ↓
                            FAILED / DISABLED
```

## Initialization Order

Modules are initialized in order determined by:
1. **Dependencies** - Dependencies initialize first
2. **Priority** - Lower priority number = higher priority
   - CRITICAL (0) - Core system
   - HIGH (100) - Essential business
   - NORMAL (200) - Standard features
   - LOW (300) - Optional features

## Security Model

- **SecurityContext** - Contains shop, session, user, permissions, roles
- **Policies** - Collections of access control rules
- **Rules** - Resource + Action + Permissions/Roles + Condition
- **Deny by Default** - Explicit grants required

## Examples

See `/examples` directory for:
- `sample-module/` - Complete module template
- `app-initialization.js` - Bootstrap example

## Documentation

- `ARCHITECTURE.md` - Comprehensive architecture guide
- Inline JSDoc comments in all files
- Example code with explanations

## Rules & Constraints

**This core is IMMUTABLE:**
- No feature logic allowed
- No business rules allowed
- Only infrastructure and contracts

**Module Rules:**
- Unique IDs: `namespace.module-name`
- Semantic versioning: `x.y.z`
- No circular dependencies
- Implement required contract methods

**Extension Rules:**
- Extensions belong to modules
- IDs: `namespace.module.extension`
- Priority-based ordering
- Fail-safe execution

**Security Rules:**
- All operations require SecurityContext
- Permissions are granular strings
- Roles group permissions
- Policies evaluate access

## Monitoring

```javascript
// Application health
const health = await bootstrap.getHealth();

// Module statistics
const stats = context.moduleRegistry.getStatistics();

// Extension statistics
const stats = context.extensionRegistry.getStatistics();

// Security statistics
const stats = context.securityManager.getStatistics();
```

## Lifecycle Hooks

Register hooks for lifecycle events:

```javascript
bootstrap.registerHook('before:init', async (context) => {
  // Before initialization
});

bootstrap.registerHook('app:ready', async (context) => {
  // Application ready
});
```

Available hooks:
- `before:init`
- `registries:created`
- `modules:registered`
- `dependencies:resolved`
- `modules:initialized`
- `extensions:registered`
- `security:configured`
- `app:ready`
- `app:failed`
- `before:shutdown`
- `after:shutdown`

## Testing

Test modules in isolation:

```javascript
import MyModule from './my-module.js';
import { ApplicationContext } from '../core/index.js';

const context = new ApplicationContext({ test: true });
await MyModule.initialize(context, {});

const health = await MyModule.healthCheck();
assert(health.healthy === true);

await MyModule.cleanup();
```

## Version

- **Core Version:** 1.0.0
- **Status:** LOCKED FOREVER
- **Created:** 2026-01-27

## Support

For questions about the architecture:
1. Read `ARCHITECTURE.md` for detailed documentation
2. Check examples in `/examples`
3. Review inline JSDoc comments
4. Look at contract definitions in `/contracts`
