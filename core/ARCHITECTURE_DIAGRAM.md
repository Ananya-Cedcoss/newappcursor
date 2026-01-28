# Core Architecture Diagram

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOPIFY APP CORE v1.0.0                      │
│                      (IMMUTABLE LAYER)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION CONTEXT                         │
│  ┌────────────────┬──────────────────┬──────────────────────┐  │
│  │ Module Registry│ Extension Registry│ Security Manager     │  │
│  │                │                   │                      │  │
│  │ - Modules      │ - Hooks           │ - Auth Providers     │  │
│  │ - Dependencies │ - Providers       │ - Authz Providers    │  │
│  │ - Lifecycle    │ - Middleware      │ - Policies           │  │
│  │ - Health       │ - Filters         │ - Permissions        │  │
│  │                │ - Validators      │ - Roles              │  │
│  └────────────────┴──────────────────┴──────────────────────┘  │
│                                                                  │
│  Services Map: database, cache, logging, booking, analytics...  │
└─────────────────────────────────────────────────────────────────┘
```

## Bootstrap Flow

```
START
  │
  ▼
┌─────────────────────┐
│  Bootstrap.init()   │
└─────────────────────┘
  │
  ├──► Create ApplicationContext
  │
  ├──► Initialize Registries
  │         │
  │         ├──► ModuleRegistry
  │         ├──► ExtensionRegistry
  │         └──► SecurityManager
  │
  ├──► Discover & Register Modules
  │         │
  │         └──► Load from modulePaths
  │              Validate metadata
  │              Register in ModuleRegistry
  │
  ├──► Resolve Dependencies
  │         │
  │         ├──► Build dependency graph
  │         ├──► Check circular dependencies
  │         └──► Topological sort
  │
  ├──► Initialize Modules
  │         │
  │         └──► For each module (in order):
  │              1. Check dependencies ready
  │              2. Call module.initialize()
  │              3. Run health check
  │              4. Mark as READY
  │
  ├──► Register Extensions
  │         │
  │         └──► Extract extensions from modules
  │              Route to appropriate registry
  │              (hooks, providers, middleware, etc.)
  │
  ├──► Apply Security Policies
  │         │
  │         └──► Register policies
  │              Set default policy
  │              Validate rules
  │
  ▼
┌─────────────────────┐
│   APP READY         │
└─────────────────────┘
```

## Module Lifecycle

```
┌─────────────────┐
│ UNINITIALIZED   │
└─────────────────┘
        │
        │ register()
        ▼
┌─────────────────┐
│   REGISTERED    │◄───────────┐
└─────────────────┘            │
        │                      │
        │ resolveDependencies()│
        ▼                      │
┌─────────────────┐            │
│  DEPENDENCIES   │            │
│    RESOLVED     │            │
└─────────────────┘            │
        │                      │
        │ initialize()         │
        ▼                      │
┌─────────────────┐            │
│  INITIALIZED    │            │
└─────────────────┘            │
        │                      │
        │ healthCheck()        │
        ▼                      │
┌─────────────────┐            │
│     READY       │────────────┘
└─────────────────┘  (running)
        │
        │ error / disable
        ▼
┌─────────────────┐
│ FAILED/DISABLED │
└─────────────────┘
        │
        │ cleanup()
        ▼
┌─────────────────┐
│   TERMINATED    │
└─────────────────┘
```

## Module Dependency Resolution

```
Example: 3 modules with dependencies

Module A (priority: 100)
    └──► depends on: []

Module B (priority: 200)
    └──► depends on: [A]

Module C (priority: 50)
    └──► depends on: [A, B]

Initialization Order:
    1. A (no dependencies, priority 100)
    2. B (depends on A, priority 200)
    3. C (depends on A & B, priority 50)

Note: Dependencies override priority
```

## Extension System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTENSION REGISTRY                        │
└─────────────────────────────────────────────────────────────┘
           │
           ├──────────────┬──────────────┬──────────────┬──────────────┐
           │              │              │              │              │
           ▼              ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  HOOKS   │   │ PROVIDERS│  │MIDDLEWARE│  │ FILTERS  │  │VALIDATORS│
    └──────────┘   └──────────┘  └──────────┘  └──────────┘  └──────────┘
         │              │              │              │              │
    Event-driven   Services      Request/      Data        Validation
    extensions    (cache, etc)   Response   Transform       Rules
                                 Pipeline
```

## Hook Execution Flow

```
executeHook('before:save', context, payload)
         │
         ▼
    Get hooks for 'before:save'
         │
         ▼
    Sort by priority (0 = first)
         │
         ▼
┌────────────────────────────┐
│   Hook 1 (priority: 0)     │──► execute(context, payload) ──► payload'
└────────────────────────────┘
         │
         ▼
┌────────────────────────────┐
│   Hook 2 (priority: 100)   │──► execute(context, payload') ──► payload''
└────────────────────────────┘
         │
         ▼
┌────────────────────────────┐
│   Hook 3 (priority: 200)   │──► execute(context, payload'') ──► payload'''
└────────────────────────────┘
         │
         ▼
    Return final payload'''
```

## Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     REQUEST / OPERATION                     │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│              AUTHENTICATION PROVIDER                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  authenticate(request) → SecurityContext             │ │
│  │    - Shop                                            │ │
│  │    - Session                                         │ │
│  │    - User                                            │ │
│  │    - Authenticated: true/false                       │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│              AUTHORIZATION PROVIDER                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  getPermissions(context) → ['perm1', 'perm2', ...]  │ │
│  │  getRoles(context) → ['role1', 'role2', ...]        │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   SECURITY MANAGER                          │
│  authorize(context, resource, action, policy?)             │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                    SECURITY POLICY                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Find rules for (resource, action)                   │ │
│  │  Evaluate each rule:                                 │ │
│  │    - Check permissions                               │ │
│  │    - Check roles                                     │ │
│  │    - Evaluate custom condition                       │ │
│  │  Return: true (any rule passes) / false (all fail)  │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ALLOW / DENY
```

## Access Control Rule Evaluation

```
AccessControlRule {
  resource: 'booking',
  action: 'create',
  permissions: ['booking.write', 'booking.admin'],
  roles: ['admin', 'manager'],
  condition: async (context) => { ... }
}

Evaluation:
    1. Check permissions: hasAnyPermission(['booking.write', 'booking.admin'])
       └──► If no match → DENY

    2. Check roles: hasAnyRole(['admin', 'manager'])
       └──► If no match → DENY

    3. Evaluate condition: condition(context)
       └──► If false → DENY

    4. All passed → ALLOW
```

## Service Registration & Usage

```
Module Initialization:
    context.registerService('booking', {
      create: async (data) => { ... },
      update: async (id, data) => { ... },
      delete: async (id) => { ... }
    });

Usage Anywhere:
    const bookingService = context.getService('booking');
    const result = await bookingService.create(bookingData);
```

## Complete Request Flow Example

```
1. HTTP Request arrives
        │
        ▼
2. Middleware chain executes
   (registered via MiddlewareExtension)
        │
        ▼
3. Authentication
   SecurityManager.authenticate(request)
        │
        ▼
4. Authorization
   SecurityManager.authorize(context, 'booking', 'create')
        │
        ▼
5. Execute Hook: before:save
   ExtensionRegistry.executeHook('before:save', context, data)
        │
        ▼
6. Business Logic (Module Service)
   bookingService.create(data)
        │
        ▼
7. Apply Filters: format.date
   ExtensionRegistry.applyFilter('format.date', value)
        │
        ▼
8. Validate: booking-validator
   ExtensionRegistry.validate('booking', data)
        │
        ▼
9. Execute Hook: after:save
   ExtensionRegistry.executeHook('after:save', context, result)
        │
        ▼
10. Response
```

## Contract Hierarchy

```
ModuleContract
    │
    ├──► metadata (required)
    ├──► dependencies (optional)
    ├──► permissions (optional)
    ├──► configSchema (optional)
    ├──► initialize(context, config) (required)
    ├──► cleanup() (optional)
    └──► healthCheck() (optional)

ExtensionContract
    │
    ├──► HookExtension
    │      └──► hookName, execute(context, payload)
    │
    ├──► ProviderExtension
    │      └──► providerInterface, getProvider(context)
    │
    ├──► MiddlewareExtension
    │      └──► handle(request, response, next)
    │
    ├──► FilterExtension
    │      └──► filterName, apply(value, context)
    │
    └──► ValidatorExtension
           └──► validatorName, validate(data, context)

SecurityContract
    │
    ├──► SecurityContext
    │      └──► shop, session, user, permissions, roles
    │
    ├──► AuthenticationProvider
    │      └──► authenticate(request)
    │
    ├──► AuthorizationProvider
    │      └──► authorize(context, resource, action)
    │
    ├──► AccessControlRule
    │      └──► resource, action, permissions, roles, condition
    │
    └──► SecurityPolicy
           └──► Collection of AccessControlRules
```

## System Layers

```
┌──────────────────────────────────────────────────────┐
│              FEATURE MODULES (Your Code)             │
│  Booking, Analytics, Notifications, Payments, etc.   │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│         CORE ARCHITECTURE (Immutable Layer)          │
│  Bootstrap, Modules, Extensions, Security            │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│           SHOPIFY SDK & INFRASTRUCTURE               │
│  @shopify/shopify-app-remix, Prisma, Remix           │
└──────────────────────────────────────────────────────┘
```

---

**This architecture enables:**
- Modular development
- Clear separation of concerns
- Testable components
- Secure by design
- Extensible framework
