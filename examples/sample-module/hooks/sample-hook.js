/**
 * EXAMPLE HOOK EXTENSION
 *
 * Demonstrates how to create a hook that responds to events.
 */

import { HookExtension, ExtensionPriority } from '../../../core/index.js';

export class SampleHook extends HookExtension {
  /**
   * Extension metadata
   */
  static get metadata() {
    return {
      id: 'example.sample.before-save',
      moduleId: 'example.sample',
      name: 'Before Save Hook',
      description: 'Validates data before saving',
      version: '1.0.0'
    };
  }

  /**
   * Hook name to listen to
   */
  static get hookName() {
    return 'before:save';
  }

  /**
   * Extension priority
   */
  static get priority() {
    return ExtensionPriority.HIGH;
  }

  /**
   * Execute hook logic
   *
   * @param {Object} context - Execution context
   * @param {*} payload - Hook payload
   * @returns {Promise<*>} Modified payload
   */
  static async execute(context, payload) {
    console.log('SampleHook: before:save triggered', payload);

    // Validate payload
    if (!payload.data) {
      throw new Error('Payload must have data field');
    }

    // Transform payload
    const transformed = {
      ...payload,
      data: {
        ...payload.data,
        processedAt: new Date().toISOString(),
        processedBy: 'sample-hook'
      }
    };

    return transformed;
  }
}
