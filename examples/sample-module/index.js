/**
 * EXAMPLE MODULE
 *
 * This is a sample module demonstrating how to use the core architecture.
 * Use this as a template for building your own modules.
 */

import { ModuleContract, ModulePriority } from '../../core/index.js';
import { SampleHook } from './hooks/sample-hook.js';
import { SampleProvider } from './providers/sample-provider.js';

export default class SampleModule extends ModuleContract {
  /**
   * Module metadata (REQUIRED)
   * Defines module identity and configuration
   */
  static get metadata() {
    return {
      id: 'example.sample',                    // Format: namespace.module-name
      name: 'Sample Module',                   // Human-readable name
      version: '1.0.0',                        // Semantic version
      description: 'Example module template',  // Brief description
      priority: ModulePriority.NORMAL,         // Initialization priority
      enabled: true,                           // Module enabled status
      tags: ['example', 'template']            // Categorization tags
    };
  }

  /**
   * Module configuration schema (OPTIONAL)
   * Defines expected configuration structure with defaults
   */
  static get configSchema() {
    return {
      enabled: true,
      maxRetries: 3,
      timeout: 5000
    };
  }

  /**
   * Module dependencies (OPTIONAL)
   * List of module IDs this module depends on
   */
  static get dependencies() {
    return [
      // 'example.other-module'
    ];
  }

  /**
   * Required permissions (OPTIONAL)
   * Permissions this module needs to function
   */
  static get permissions() {
    return [
      'resource.read',
      'resource.write'
    ];
  }

  /**
   * Module extensions (OPTIONAL)
   * Extensions this module provides
   */
  static extensions = [
    SampleHook,
    SampleProvider
  ];

  /**
   * Initialize module (REQUIRED)
   * Called during bootstrap after dependencies are ready
   *
   * @param {ApplicationContext} context - Application context
   * @param {Object} config - Module configuration
   */
  static async initialize(context, config) {
    console.log(`Initializing ${this.metadata.name} with config:`, config);

    // Register services in context
    context.registerService('sample', {
      doSomething: async (data) => {
        return { success: true, data };
      },

      getSomething: async (id) => {
        return { id, name: 'Sample' };
      }
    });

    // Access other services
    if (context.hasService('database')) {
      const db = context.getService('database');
      // Use database service
    }

    // Execute hooks
    const result = await context.extensionRegistry.executeHook(
      'sample:initialized',
      context,
      { moduleId: this.metadata.id }
    );

    console.log(`${this.metadata.name} initialized successfully`);
  }

  /**
   * Cleanup module (OPTIONAL)
   * Called during shutdown
   */
  static async cleanup() {
    console.log(`Cleaning up ${this.metadata.name}`);
    // Close connections, clear caches, etc.
  }

  /**
   * Health check (OPTIONAL)
   * Returns module health status
   */
  static async healthCheck() {
    return {
      healthy: true,
      timestamp: new Date().toISOString(),
      checks: {
        service: 'operational',
        connections: 'healthy'
      }
    };
  }
}
