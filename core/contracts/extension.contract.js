/**
 * CORE EXTENSION CONTRACT (IMMUTABLE)
 *
 * Defines how modules can extend core functionality through hooks and providers.
 * This contract is locked and cannot be modified.
 *
 * @version 1.0.0
 * @locked true
 */

/**
 * Extension Point Types
 */
export const ExtensionPointType = {
  HOOK: 'hook',           // Event-driven hooks
  PROVIDER: 'provider',   // Service providers
  MIDDLEWARE: 'middleware', // Request/response middleware
  FILTER: 'filter',       // Data transformation filters
  VALIDATOR: 'validator'  // Validation rules
};

/**
 * Extension Priority
 */
export const ExtensionPriority = {
  FIRST: 0,
  HIGH: 100,
  NORMAL: 200,
  LOW: 300,
  LAST: 999
};

/**
 * Base Extension Contract
 */
export class ExtensionContract {
  /**
   * Extension metadata (REQUIRED)
   */
  static get metadata() {
    throw new Error('Extension must define metadata');
  }

  /**
   * Extension point this extends
   */
  static get extensionPoint() {
    throw new Error('Extension must define extensionPoint');
  }

  /**
   * Extension priority
   */
  static get priority() {
    return ExtensionPriority.NORMAL;
  }

  /**
   * Execute extension logic
   *
   * @param {Object} context - Execution context
   * @param {*} payload - Extension payload
   * @returns {Promise<*>}
   */
  static async execute(context, payload) {
    throw new Error('Extension must implement execute()');
  }
}

/**
 * Hook Extension Contract
 * For event-driven extensions
 */
export class HookExtension extends ExtensionContract {
  static get extensionPoint() {
    return ExtensionPointType.HOOK;
  }

  /**
   * Hook event name
   */
  static get hookName() {
    throw new Error('Hook must define hookName');
  }
}

/**
 * Provider Extension Contract
 * For service providers
 */
export class ProviderExtension extends ExtensionContract {
  static get extensionPoint() {
    return ExtensionPointType.PROVIDER;
  }

  /**
   * Provider interface name
   */
  static get providerInterface() {
    throw new Error('Provider must define providerInterface');
  }

  /**
   * Get provider instance
   *
   * @param {Object} context
   * @returns {Object}
   */
  static getProvider(context) {
    throw new Error('Provider must implement getProvider()');
  }
}

/**
 * Middleware Extension Contract
 * For request/response middleware
 */
export class MiddlewareExtension extends ExtensionContract {
  static get extensionPoint() {
    return ExtensionPointType.MIDDLEWARE;
  }

  /**
   * Middleware handler
   *
   * @param {Object} request
   * @param {Object} response
   * @param {Function} next
   */
  static async handle(request, response, next) {
    throw new Error('Middleware must implement handle()');
  }
}

/**
 * Filter Extension Contract
 * For data transformation
 */
export class FilterExtension extends ExtensionContract {
  static get extensionPoint() {
    return ExtensionPointType.FILTER;
  }

  /**
   * Filter name
   */
  static get filterName() {
    throw new Error('Filter must define filterName');
  }

  /**
   * Apply filter
   *
   * @param {*} value - Value to filter
   * @param {Object} context - Filter context
   * @returns {*}
   */
  static async apply(value, context) {
    throw new Error('Filter must implement apply()');
  }
}

/**
 * Validator Extension Contract
 * For validation rules
 */
export class ValidatorExtension extends ExtensionContract {
  static get extensionPoint() {
    return ExtensionPointType.VALIDATOR;
  }

  /**
   * Validator name
   */
  static get validatorName() {
    throw new Error('Validator must define validatorName');
  }

  /**
   * Validation schema
   */
  static get schema() {
    return {};
  }

  /**
   * Validate data
   *
   * @param {*} data - Data to validate
   * @param {Object} context - Validation context
   * @returns {Promise<Object>} Validation result
   */
  static async validate(data, context) {
    throw new Error('Validator must implement validate()');
  }
}

/**
 * Extension Metadata Structure
 *
 * @typedef {Object} ExtensionMetadata
 * @property {string} id - Unique extension identifier
 * @property {string} moduleId - Parent module identifier
 * @property {string} name - Extension name
 * @property {string} description - Extension description
 * @property {string} version - Extension version
 */

/**
 * Validates extension metadata
 *
 * @param {ExtensionMetadata} metadata
 */
export function validateExtensionMetadata(metadata) {
  const required = ['id', 'moduleId', 'name'];

  for (const field of required) {
    if (!metadata[field]) {
      throw new Error(`Extension metadata missing required field: ${field}`);
    }
  }

  // Validate ID format
  if (!/^[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+$/.test(metadata.id)) {
    throw new Error(`Invalid extension ID format: ${metadata.id}. Expected: namespace.module.extension`);
  }
}
