/**
 * CORE EXTENSION REGISTRY (IMMUTABLE)
 *
 * Manages extensions and extension points:
 * 1. Extension registration and validation
 * 2. Extension point management
 * 3. Hook execution
 * 4. Provider resolution
 * 5. Middleware chain
 *
 * @version 1.0.0
 * @locked true
 */

import {
  ExtensionPointType,
  ExtensionPriority,
  validateExtensionMetadata
} from '../contracts/extension.contract.js';

/**
 * Extension Registry Entry
 */
class ExtensionEntry {
  constructor(extension) {
    this.extension = extension;
    this.metadata = extension.metadata;
    this.extensionPoint = extension.extensionPoint;
    this.priority = extension.priority || ExtensionPriority.NORMAL;
    this.enabled = true;
    this.registeredAt = new Date().toISOString();
  }
}

/**
 * Extension Registry
 * Central registry for all extensions
 */
export class ExtensionRegistry {
  constructor() {
    this.extensions = new Map();
    this.extensionPoints = new Map();
    this.hooks = new Map();
    this.providers = new Map();
    this.middleware = [];
    this.filters = new Map();
    this.validators = new Map();
  }

  /**
   * Register an extension
   *
   * @param {Object} extension - Extension class implementing ExtensionContract
   * @returns {Promise<void>}
   */
  async register(extension) {
    // Validate extension has metadata
    if (!extension.metadata) {
      throw new Error('Extension must define metadata');
    }

    // Validate metadata structure
    validateExtensionMetadata(extension.metadata);

    const { id } = extension.metadata;

    // Check for duplicate
    if (this.extensions.has(id)) {
      throw new Error(`Extension already registered: ${id}`);
    }

    // Create entry
    const entry = new ExtensionEntry(extension);

    // Store extension
    this.extensions.set(id, entry);

    // Route to appropriate registry based on extension point type
    switch (entry.extensionPoint) {
      case ExtensionPointType.HOOK:
        this.registerHook(extension);
        break;

      case ExtensionPointType.PROVIDER:
        this.registerProvider(extension);
        break;

      case ExtensionPointType.MIDDLEWARE:
        this.registerMiddleware(extension);
        break;

      case ExtensionPointType.FILTER:
        this.registerFilter(extension);
        break;

      case ExtensionPointType.VALIDATOR:
        this.registerValidator(extension);
        break;

      default:
        throw new Error(`Unknown extension point type: ${entry.extensionPoint}`);
    }

    console.log(`Extension registered: ${id}`);
  }

  /**
   * Unregister an extension
   *
   * @param {string} extensionId - Extension identifier
   */
  async unregister(extensionId) {
    const entry = this.extensions.get(extensionId);

    if (!entry) {
      return;
    }

    // Remove from specific registries
    switch (entry.extensionPoint) {
      case ExtensionPointType.HOOK:
        this.unregisterHook(entry.extension);
        break;

      case ExtensionPointType.PROVIDER:
        this.unregisterProvider(entry.extension);
        break;

      case ExtensionPointType.MIDDLEWARE:
        this.unregisterMiddleware(entry.extension);
        break;

      case ExtensionPointType.FILTER:
        this.unregisterFilter(entry.extension);
        break;

      case ExtensionPointType.VALIDATOR:
        this.unregisterValidator(entry.extension);
        break;
    }

    this.extensions.delete(extensionId);
    console.log(`Extension unregistered: ${extensionId}`);
  }

  /**
   * Register a hook extension
   *
   * @param {Object} hook - Hook extension
   */
  registerHook(hook) {
    const hookName = hook.hookName;

    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push(hook);

    // Sort by priority
    this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Unregister a hook extension
   *
   * @param {Object} hook - Hook extension
   */
  unregisterHook(hook) {
    const hookName = hook.hookName;

    if (!this.hooks.has(hookName)) {
      return;
    }

    const hooks = this.hooks.get(hookName);
    const index = hooks.findIndex(h => h.metadata.id === hook.metadata.id);

    if (index !== -1) {
      hooks.splice(index, 1);
    }

    if (hooks.length === 0) {
      this.hooks.delete(hookName);
    }
  }

  /**
   * Execute hook
   *
   * @param {string} hookName - Hook name
   * @param {Object} context - Execution context
   * @param {*} payload - Hook payload
   * @returns {Promise<*>} Modified payload
   */
  async executeHook(hookName, context, payload) {
    if (!this.hooks.has(hookName)) {
      return payload;
    }

    let currentPayload = payload;
    const hooks = this.hooks.get(hookName);

    for (const hook of hooks) {
      try {
        const entry = this.extensions.get(hook.metadata.id);

        if (entry && entry.enabled) {
          currentPayload = await hook.execute(context, currentPayload);
        }
      } catch (error) {
        console.error(`Hook execution failed: ${hook.metadata.id}`, error);

        // Continue executing remaining hooks
        if (context.config?.stopOnError) {
          throw error;
        }
      }
    }

    return currentPayload;
  }

  /**
   * Register a provider extension
   *
   * @param {Object} provider - Provider extension
   */
  registerProvider(provider) {
    const providerInterface = provider.providerInterface;

    if (!this.providers.has(providerInterface)) {
      this.providers.set(providerInterface, []);
    }

    this.providers.get(providerInterface).push(provider);
  }

  /**
   * Unregister a provider extension
   *
   * @param {Object} provider - Provider extension
   */
  unregisterProvider(provider) {
    const providerInterface = provider.providerInterface;

    if (!this.providers.has(providerInterface)) {
      return;
    }

    const providers = this.providers.get(providerInterface);
    const index = providers.findIndex(p => p.metadata.id === provider.metadata.id);

    if (index !== -1) {
      providers.splice(index, 1);
    }

    if (providers.length === 0) {
      this.providers.delete(providerInterface);
    }
  }

  /**
   * Get provider
   *
   * @param {string} providerInterface - Provider interface name
   * @param {Object} context - Context
   * @returns {Object|null}
   */
  getProvider(providerInterface, context) {
    if (!this.providers.has(providerInterface)) {
      return null;
    }

    const providers = this.providers.get(providerInterface);

    if (providers.length === 0) {
      return null;
    }

    // Return first enabled provider
    for (const provider of providers) {
      const entry = this.extensions.get(provider.metadata.id);

      if (entry && entry.enabled) {
        return provider.getProvider(context);
      }
    }

    return null;
  }

  /**
   * Register a middleware extension
   *
   * @param {Object} middleware - Middleware extension
   */
  registerMiddleware(middleware) {
    this.middleware.push(middleware);

    // Sort by priority
    this.middleware.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Unregister a middleware extension
   *
   * @param {Object} middleware - Middleware extension
   */
  unregisterMiddleware(middleware) {
    const index = this.middleware.findIndex(
      m => m.metadata.id === middleware.metadata.id
    );

    if (index !== -1) {
      this.middleware.splice(index, 1);
    }
  }

  /**
   * Get middleware chain
   *
   * @returns {Array}
   */
  getMiddlewareChain() {
    return this.middleware.filter(m => {
      const entry = this.extensions.get(m.metadata.id);
      return entry && entry.enabled;
    });
  }

  /**
   * Register a filter extension
   *
   * @param {Object} filter - Filter extension
   */
  registerFilter(filter) {
    const filterName = filter.filterName;

    if (!this.filters.has(filterName)) {
      this.filters.set(filterName, []);
    }

    this.filters.get(filterName).push(filter);

    // Sort by priority
    this.filters.get(filterName).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Unregister a filter extension
   *
   * @param {Object} filter - Filter extension
   */
  unregisterFilter(filter) {
    const filterName = filter.filterName;

    if (!this.filters.has(filterName)) {
      return;
    }

    const filters = this.filters.get(filterName);
    const index = filters.findIndex(f => f.metadata.id === filter.metadata.id);

    if (index !== -1) {
      filters.splice(index, 1);
    }

    if (filters.length === 0) {
      this.filters.delete(filterName);
    }
  }

  /**
   * Apply filter
   *
   * @param {string} filterName - Filter name
   * @param {*} value - Value to filter
   * @param {Object} context - Filter context
   * @returns {Promise<*>}
   */
  async applyFilter(filterName, value, context = {}) {
    if (!this.filters.has(filterName)) {
      return value;
    }

    let currentValue = value;
    const filters = this.filters.get(filterName);

    for (const filter of filters) {
      const entry = this.extensions.get(filter.metadata.id);

      if (entry && entry.enabled) {
        currentValue = await filter.apply(currentValue, context);
      }
    }

    return currentValue;
  }

  /**
   * Register a validator extension
   *
   * @param {Object} validator - Validator extension
   */
  registerValidator(validator) {
    const validatorName = validator.validatorName;

    if (this.validators.has(validatorName)) {
      throw new Error(`Validator already registered: ${validatorName}`);
    }

    this.validators.set(validatorName, validator);
  }

  /**
   * Unregister a validator extension
   *
   * @param {Object} validator - Validator extension
   */
  unregisterValidator(validator) {
    const validatorName = validator.validatorName;
    this.validators.delete(validatorName);
  }

  /**
   * Validate data
   *
   * @param {string} validatorName - Validator name
   * @param {*} data - Data to validate
   * @param {Object} context - Validation context
   * @returns {Promise<Object>} Validation result
   */
  async validate(validatorName, data, context = {}) {
    const validator = this.validators.get(validatorName);

    if (!validator) {
      throw new Error(`Validator not found: ${validatorName}`);
    }

    const entry = this.extensions.get(validator.metadata.id);

    if (!entry || !entry.enabled) {
      throw new Error(`Validator disabled: ${validatorName}`);
    }

    return await validator.validate(data, context);
  }

  /**
   * Enable extension
   *
   * @param {string} extensionId - Extension identifier
   */
  enableExtension(extensionId) {
    const entry = this.extensions.get(extensionId);

    if (entry) {
      entry.enabled = true;
    }
  }

  /**
   * Disable extension
   *
   * @param {string} extensionId - Extension identifier
   */
  disableExtension(extensionId) {
    const entry = this.extensions.get(extensionId);

    if (entry) {
      entry.enabled = false;
    }
  }

  /**
   * Get extension statistics
   *
   * @returns {Object}
   */
  getStatistics() {
    return {
      total: this.extensions.size,
      enabled: Array.from(this.extensions.values()).filter(e => e.enabled).length,
      disabled: Array.from(this.extensions.values()).filter(e => !e.enabled).length,
      hooks: this.hooks.size,
      providers: this.providers.size,
      middleware: this.middleware.length,
      filters: this.filters.size,
      validators: this.validators.size
    };
  }
}
