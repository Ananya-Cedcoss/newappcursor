/**
 * CORE MODULE REGISTRY (IMMUTABLE)
 *
 * Manages module lifecycle:
 * 1. Registration and validation
 * 2. Dependency resolution
 * 3. Initialization order
 * 4. State management
 * 5. Health monitoring
 *
 * @version 1.0.0
 * @locked true
 */

import {
  ModuleLifecycleState,
  validateModuleMetadata
} from './contracts/module.contract.js';

/**
 * Module Registry Entry
 */
class ModuleEntry {
  constructor(module) {
    this.module = module;
    this.metadata = module.metadata;
    this.state = ModuleLifecycleState.REGISTERED;
    this.dependencies = module.dependencies || [];
    this.permissions = module.permissions || [];
    this.config = null;
    this.error = null;
    this.registeredAt = new Date().toISOString();
    this.initializedAt = null;
  }
}

/**
 * Module Registry
 * Central registry for all application modules
 */
export class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.dependencyGraph = new Map();
    this.initialized = false;
  }

  /**
   * Register a module
   *
   * @param {Object} module - Module class implementing ModuleContract
   * @returns {Promise<void>}
   */
  async register(module) {
    // Validate module has metadata
    if (!module.metadata) {
      throw new Error('Module must define metadata');
    }

    // Validate metadata structure
    validateModuleMetadata(module.metadata);

    const { id } = module.metadata;

    // Check for duplicate
    if (this.modules.has(id)) {
      throw new Error(`Module already registered: ${id}`);
    }

    // Create entry
    const entry = new ModuleEntry(module);

    // Store module
    this.modules.set(id, entry);

    // Build dependency graph
    this.dependencyGraph.set(id, entry.dependencies);

    console.log(`Module registered: ${id} v${entry.metadata.version}`);
  }

  /**
   * Unregister a module
   *
   * @param {string} moduleId - Module identifier
   */
  async unregister(moduleId) {
    const entry = this.modules.get(moduleId);

    if (!entry) {
      return;
    }

    // Cleanup if initialized
    if (entry.state === ModuleLifecycleState.INITIALIZED ||
        entry.state === ModuleLifecycleState.READY) {
      try {
        await entry.module.cleanup();
      } catch (error) {
        console.error(`Module cleanup failed: ${moduleId}`, error);
      }
    }

    this.modules.delete(moduleId);
    this.dependencyGraph.delete(moduleId);

    console.log(`Module unregistered: ${moduleId}`);
  }

  /**
   * Get module by ID
   *
   * @param {string} moduleId - Module identifier
   * @returns {ModuleEntry|null}
   */
  getModule(moduleId) {
    return this.modules.get(moduleId) || null;
  }

  /**
   * Get all modules
   *
   * @returns {ModuleEntry[]}
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }

  /**
   * Check if module exists
   *
   * @param {string} moduleId - Module identifier
   * @returns {boolean}
   */
  hasModule(moduleId) {
    return this.modules.has(moduleId);
  }

  /**
   * Get modules by state
   *
   * @param {string} state - Module state
   * @returns {ModuleEntry[]}
   */
  getModulesByState(state) {
    return Array.from(this.modules.values()).filter(
      entry => entry.state === state
    );
  }

  /**
   * Resolve module dependencies
   * Validates all dependencies exist and checks for circular dependencies
   *
   * @throws {Error} If dependencies cannot be resolved
   */
  async resolveDependencies() {
    // Check all dependencies exist
    for (const [moduleId, dependencies] of this.dependencyGraph.entries()) {
      for (const depId of dependencies) {
        if (!this.hasModule(depId)) {
          throw new Error(
            `Module ${moduleId} depends on missing module: ${depId}`
          );
        }
      }
    }

    // Check for circular dependencies
    this.checkCircularDependencies();

    console.log('Module dependencies resolved');
  }

  /**
   * Check for circular dependencies using DFS
   *
   * @throws {Error} If circular dependency detected
   */
  checkCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();

    const visit = (moduleId, path = []) => {
      if (recursionStack.has(moduleId)) {
        const cycle = [...path, moduleId].join(' -> ');
        throw new Error(`Circular dependency detected: ${cycle}`);
      }

      if (visited.has(moduleId)) {
        return;
      }

      visited.add(moduleId);
      recursionStack.add(moduleId);

      const dependencies = this.dependencyGraph.get(moduleId) || [];

      for (const depId of dependencies) {
        visit(depId, [...path, moduleId]);
      }

      recursionStack.delete(moduleId);
    };

    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        visit(moduleId);
      }
    }
  }

  /**
   * Get modules in initialization order (topological sort)
   * Modules are sorted by:
   * 1. Dependency order (dependencies first)
   * 2. Priority (lower priority number = higher priority)
   *
   * @returns {ModuleEntry[]}
   */
  getModulesInInitializationOrder() {
    const sorted = [];
    const visited = new Set();
    const temp = new Set();

    const visit = (moduleId) => {
      if (visited.has(moduleId)) {
        return;
      }

      if (temp.has(moduleId)) {
        throw new Error(`Circular dependency involving: ${moduleId}`);
      }

      temp.add(moduleId);

      const dependencies = this.dependencyGraph.get(moduleId) || [];

      for (const depId of dependencies) {
        visit(depId);
      }

      temp.delete(moduleId);
      visited.add(moduleId);

      const entry = this.modules.get(moduleId);
      sorted.push(entry);
    };

    // Visit all modules
    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        visit(moduleId);
      }
    }

    // Sort by priority (stable sort - maintains dependency order)
    return sorted.sort((a, b) => a.metadata.priority - b.metadata.priority);
  }

  /**
   * Initialize a module
   *
   * @param {string} moduleId - Module identifier
   * @param {Object} context - Application context
   * @param {Object} config - Module configuration
   * @returns {Promise<void>}
   */
  async initialize(moduleId, context, config = {}) {
    const entry = this.getModule(moduleId);

    if (!entry) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    if (entry.state === ModuleLifecycleState.INITIALIZED ||
        entry.state === ModuleLifecycleState.READY) {
      return; // Already initialized
    }

    // Check dependencies are initialized
    for (const depId of entry.dependencies) {
      const dep = this.getModule(depId);

      if (!dep || (dep.state !== ModuleLifecycleState.INITIALIZED &&
                   dep.state !== ModuleLifecycleState.READY)) {
        throw new Error(
          `Module ${moduleId} dependency not initialized: ${depId}`
        );
      }
    }

    try {
      entry.state = ModuleLifecycleState.UNINITIALIZED;

      // Merge config with defaults
      entry.config = {
        ...entry.module.configSchema,
        ...config
      };

      // Call module initialize
      await entry.module.initialize(context, entry.config);

      entry.state = ModuleLifecycleState.INITIALIZED;
      entry.initializedAt = new Date().toISOString();

      // Run health check
      const health = await entry.module.healthCheck();

      if (health.healthy) {
        entry.state = ModuleLifecycleState.READY;
      }

      console.log(`Module initialized: ${moduleId}`);

    } catch (error) {
      entry.state = ModuleLifecycleState.FAILED;
      entry.error = error.message;

      console.error(`Module initialization failed: ${moduleId}`, error);

      throw error;
    }
  }

  /**
   * Cleanup all modules
   */
  async cleanup() {
    const modules = this.getAllModules().reverse(); // Cleanup in reverse order

    for (const entry of modules) {
      if (entry.state === ModuleLifecycleState.INITIALIZED ||
          entry.state === ModuleLifecycleState.READY) {
        try {
          await entry.module.cleanup();
          entry.state = ModuleLifecycleState.DISABLED;
        } catch (error) {
          console.error(`Module cleanup failed: ${entry.metadata.id}`, error);
        }
      }
    }

    console.log('All modules cleaned up');
  }

  /**
   * Get health status of all modules
   *
   * @returns {Promise<Object>}
   */
  async getModulesHealth() {
    const health = {
      total: this.modules.size,
      healthy: 0,
      unhealthy: 0,
      modules: {}
    };

    for (const [moduleId, entry] of this.modules.entries()) {
      try {
        const moduleHealth = await entry.module.healthCheck();

        health.modules[moduleId] = {
          state: entry.state,
          ...moduleHealth
        };

        if (moduleHealth.healthy) {
          health.healthy++;
        } else {
          health.unhealthy++;
        }

      } catch (error) {
        health.modules[moduleId] = {
          state: entry.state,
          healthy: false,
          error: error.message
        };
        health.unhealthy++;
      }
    }

    return health;
  }

  /**
   * Get module statistics
   *
   * @returns {Object}
   */
  getStatistics() {
    const stats = {
      total: this.modules.size,
      byState: {},
      byPriority: {}
    };

    for (const entry of this.modules.values()) {
      // Count by state
      const state = entry.state;
      stats.byState[state] = (stats.byState[state] || 0) + 1;

      // Count by priority
      const priority = entry.metadata.priority;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    }

    return stats;
  }
}
