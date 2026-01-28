/**
 * CORE BOOTSTRAP SYSTEM (IMMUTABLE)
 *
 * Orchestrates application initialization:
 * 1. Load and validate configuration
 * 2. Initialize module registry
 * 3. Discover and register modules
 * 4. Resolve dependencies
 * 5. Initialize modules in priority order
 * 6. Register extensions
 * 7. Apply security policies
 *
 * @version 1.0.0
 * @locked true
 */

import { ModuleRegistry } from './module-registry.js';
import { ExtensionRegistry } from './extensions/extension-registry.js';
import { SecurityManager } from './security/security-manager.js';

/**
 * Bootstrap states
 */
export const BootstrapState = {
  UNINITIALIZED: 'uninitialized',
  LOADING: 'loading',
  MODULES_REGISTERED: 'modules_registered',
  DEPENDENCIES_RESOLVED: 'dependencies_resolved',
  MODULES_INITIALIZED: 'modules_initialized',
  READY: 'ready',
  FAILED: 'failed'
};

/**
 * Application Context
 * Shared context passed to all modules
 */
export class ApplicationContext {
  constructor(config = {}) {
    this.config = config;
    this.moduleRegistry = null;
    this.extensionRegistry = null;
    this.securityManager = null;
    this.services = new Map();
    this.metadata = {
      startTime: new Date().toISOString(),
      version: config.version || '1.0.0',
      environment: config.environment || 'production'
    };
  }

  /**
   * Register a service
   *
   * @param {string} name - Service name
   * @param {*} service - Service instance
   */
  registerService(name, service) {
    if (this.services.has(name)) {
      throw new Error(`Service already registered: ${name}`);
    }
    this.services.set(name, service);
  }

  /**
   * Get a service
   *
   * @param {string} name - Service name
   * @returns {*}
   */
  getService(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service not found: ${name}`);
    }
    return this.services.get(name);
  }

  /**
   * Check if service exists
   *
   * @param {string} name - Service name
   * @returns {boolean}
   */
  hasService(name) {
    return this.services.has(name);
  }
}

/**
 * Core Bootstrap Manager
 */
export class Bootstrap {
  constructor(config = {}) {
    this.config = config;
    this.state = BootstrapState.UNINITIALIZED;
    this.context = null;
    this.errors = [];
    this.hooks = new Map();
  }

  /**
   * Register a lifecycle hook
   *
   * @param {string} hookName - Hook name
   * @param {Function} handler - Hook handler
   */
  registerHook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(handler);
  }

  /**
   * Execute lifecycle hooks
   *
   * @param {string} hookName - Hook name
   * @param {*} data - Hook data
   */
  async executeHooks(hookName, data) {
    if (!this.hooks.has(hookName)) {
      return;
    }

    const handlers = this.hooks.get(hookName);
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Hook ${hookName} failed:`, error);
        this.errors.push({
          hook: hookName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Initialize application
   *
   * @returns {Promise<ApplicationContext>}
   */
  async initialize() {
    try {
      this.state = BootstrapState.LOADING;

      // 1. Create application context
      this.context = new ApplicationContext(this.config);

      await this.executeHooks('before:init', this.context);

      // 2. Initialize core registries
      this.context.moduleRegistry = new ModuleRegistry();
      this.context.extensionRegistry = new ExtensionRegistry();
      this.context.securityManager = new SecurityManager();

      await this.executeHooks('registries:created', this.context);

      // 3. Discover and register modules
      await this.discoverModules();
      this.state = BootstrapState.MODULES_REGISTERED;

      await this.executeHooks('modules:registered', this.context);

      // 4. Resolve dependencies
      await this.resolveDependencies();
      this.state = BootstrapState.DEPENDENCIES_RESOLVED;

      await this.executeHooks('dependencies:resolved', this.context);

      // 5. Initialize modules in priority order
      await this.initializeModules();
      this.state = BootstrapState.MODULES_INITIALIZED;

      await this.executeHooks('modules:initialized', this.context);

      // 6. Register extensions
      await this.registerExtensions();

      await this.executeHooks('extensions:registered', this.context);

      // 7. Apply security policies
      await this.applySecurityPolicies();

      await this.executeHooks('security:configured', this.context);

      // 8. Mark as ready
      this.state = BootstrapState.READY;

      await this.executeHooks('app:ready', this.context);

      return this.context;

    } catch (error) {
      this.state = BootstrapState.FAILED;
      this.errors.push({
        phase: 'initialization',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      await this.executeHooks('app:failed', { error, context: this.context });

      throw error;
    }
  }

  /**
   * Discover and register modules
   */
  async discoverModules() {
    const modulePaths = this.config.modulePaths || [];

    for (const modulePath of modulePaths) {
      try {
        const module = await import(modulePath);
        await this.context.moduleRegistry.register(module.default || module);
      } catch (error) {
        console.error(`Failed to load module ${modulePath}:`, error);
        this.errors.push({
          module: modulePath,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (this.config.strict) {
          throw error;
        }
      }
    }
  }

  /**
   * Resolve module dependencies
   */
  async resolveDependencies() {
    await this.context.moduleRegistry.resolveDependencies();
  }

  /**
   * Initialize modules in priority order
   */
  async initializeModules() {
    const modules = this.context.moduleRegistry.getModulesInInitializationOrder();

    for (const module of modules) {
      try {
        await this.context.moduleRegistry.initialize(
          module.metadata.id,
          this.context
        );
      } catch (error) {
        console.error(`Failed to initialize module ${module.metadata.id}:`, error);
        this.errors.push({
          module: module.metadata.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (this.config.strict) {
          throw error;
        }
      }
    }
  }

  /**
   * Register extensions from modules
   */
  async registerExtensions() {
    const modules = this.context.moduleRegistry.getAllModules();

    for (const module of modules) {
      if (module.module.extensions) {
        const extensions = module.module.extensions;

        for (const extension of extensions) {
          try {
            await this.context.extensionRegistry.register(extension);
          } catch (error) {
            console.error(`Failed to register extension:`, error);
            this.errors.push({
              module: module.metadata.id,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
  }

  /**
   * Apply security policies
   */
  async applySecurityPolicies() {
    const policies = this.config.securityPolicies || [];

    for (const policy of policies) {
      await this.context.securityManager.registerPolicy(policy);
    }
  }

  /**
   * Shutdown application
   */
  async shutdown() {
    await this.executeHooks('before:shutdown', this.context);

    if (this.context && this.context.moduleRegistry) {
      await this.context.moduleRegistry.cleanup();
    }

    await this.executeHooks('after:shutdown', this.context);

    this.state = BootstrapState.UNINITIALIZED;
  }

  /**
   * Get application health
   *
   * @returns {Promise<Object>}
   */
  async getHealth() {
    const health = {
      state: this.state,
      healthy: this.state === BootstrapState.READY && this.errors.length === 0,
      timestamp: new Date().toISOString(),
      errors: this.errors
    };

    if (this.context && this.context.moduleRegistry) {
      health.modules = await this.context.moduleRegistry.getModulesHealth();
    }

    return health;
  }
}

/**
 * Create and initialize application
 *
 * @param {Object} config - Application configuration
 * @returns {Promise<ApplicationContext>}
 */
export async function createApp(config = {}) {
  const bootstrap = new Bootstrap(config);
  return await bootstrap.initialize();
}
