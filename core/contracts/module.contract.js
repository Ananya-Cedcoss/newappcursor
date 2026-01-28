/**
 * CORE MODULE CONTRACT (IMMUTABLE)
 *
 * Defines the interface that all modules must implement.
 * This contract is locked and cannot be modified.
 *
 * @version 1.0.0
 * @locked true
 */

/**
 * Module Lifecycle States
 */
export const ModuleLifecycleState = {
  UNINITIALIZED: 'uninitialized',
  REGISTERED: 'registered',
  INITIALIZED: 'initialized',
  READY: 'ready',
  FAILED: 'failed',
  DISABLED: 'disabled'
};

/**
 * Module Priority Levels (for initialization order)
 */
export const ModulePriority = {
  CRITICAL: 0,    // Core system modules
  HIGH: 100,      // Essential business modules
  NORMAL: 200,    // Standard modules
  LOW: 300        // Optional/enhancement modules
};

/**
 * Base Module Contract
 * All modules MUST implement this interface
 */
export class ModuleContract {
  /**
   * Module metadata (REQUIRED)
   */
  static get metadata() {
    throw new Error('Module must define metadata');
  }

  /**
   * Module configuration schema
   * Defines expected configuration structure
   */
  static get configSchema() {
    return {};
  }

  /**
   * Module dependencies
   * List of module identifiers this module depends on
   */
  static get dependencies() {
    return [];
  }

  /**
   * Module permissions required
   * List of permission identifiers needed
   */
  static get permissions() {
    return [];
  }

  /**
   * Initialize module
   * Called during bootstrap after dependencies are ready
   *
   * @param {Object} context - Application context
   * @param {Object} config - Module configuration
   * @returns {Promise<void>}
   */
  static async initialize(context, config) {
    throw new Error('Module must implement initialize()');
  }

  /**
   * Cleanup module resources
   * Called during shutdown
   *
   * @returns {Promise<void>}
   */
  static async cleanup() {
    // Optional implementation
  }

  /**
   * Health check
   * Returns module health status
   *
   * @returns {Promise<Object>}
   */
  static async healthCheck() {
    return {
      healthy: true,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Module Metadata Structure
 *
 * @typedef {Object} ModuleMetadata
 * @property {string} id - Unique module identifier (namespace.module-name)
 * @property {string} name - Human-readable name
 * @property {string} version - Semantic version
 * @property {string} description - Module description
 * @property {number} priority - Initialization priority
 * @property {boolean} enabled - Whether module is enabled
 * @property {string[]} tags - Module tags for categorization
 */

/**
 * Validates module metadata structure
 *
 * @param {ModuleMetadata} metadata
 * @throws {Error} If metadata is invalid
 */
export function validateModuleMetadata(metadata) {
  const required = ['id', 'name', 'version', 'priority'];

  for (const field of required) {
    if (!metadata[field]) {
      throw new Error(`Module metadata missing required field: ${field}`);
    }
  }

  // Validate ID format (namespace.module-name)
  if (!/^[a-z0-9-]+\.[a-z0-9-]+$/.test(metadata.id)) {
    throw new Error(`Invalid module ID format: ${metadata.id}. Expected: namespace.module-name`);
  }

  // Validate version format (semver)
  if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
    throw new Error(`Invalid version format: ${metadata.version}. Expected: x.y.z`);
  }

  // Validate priority
  if (!Number.isInteger(metadata.priority) || metadata.priority < 0) {
    throw new Error(`Invalid priority: ${metadata.priority}`);
  }
}
