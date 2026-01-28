/**
 * EXAMPLE PROVIDER EXTENSION
 *
 * Demonstrates how to create a service provider.
 */

import { ProviderExtension } from '../../../core/index.js';

export class SampleProvider extends ProviderExtension {
  /**
   * Extension metadata
   */
  static get metadata() {
    return {
      id: 'example.sample.cache-provider',
      moduleId: 'example.sample',
      name: 'Sample Cache Provider',
      description: 'Provides in-memory caching',
      version: '1.0.0'
    };
  }

  /**
   * Provider interface name
   */
  static get providerInterface() {
    return 'cache';
  }

  /**
   * Get provider instance
   *
   * @param {Object} context - Application context
   * @returns {Object} Provider implementation
   */
  static getProvider(context) {
    const cache = new Map();

    return {
      get: async (key) => {
        return cache.get(key) || null;
      },

      set: async (key, value, ttl = null) => {
        cache.set(key, value);

        // Auto-expire if TTL provided
        if (ttl) {
          setTimeout(() => cache.delete(key), ttl);
        }

        return true;
      },

      delete: async (key) => {
        return cache.delete(key);
      },

      clear: async () => {
        cache.clear();
        return true;
      },

      has: async (key) => {
        return cache.has(key);
      },

      size: async () => {
        return cache.size;
      }
    };
  }
}
