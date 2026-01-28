/**
 * EXAMPLE APPLICATION INITIALIZATION
 *
 * Demonstrates how to bootstrap the application with the core architecture.
 */

import {
  createApp,
  Bootstrap,
  SecurityPolicy,
  AccessControlRule,
  PermissionLevel
} from '../core/index.js';

/** 
 */
async function initializeApp() {
  console.log('Starting application initialization...');

  // Create security policy
  const defaultPolicy = new SecurityPolicy('default');

  // Add access control rules
  defaultPolicy.addRule(new AccessControlRule({
    id: 'booking-read',
    resource: 'booking',
    action: 'read',
    permissions: ['booking.read', 'booking.admin']
  }));

  defaultPolicy.addRule(new AccessControlRule({
    id: 'booking-write',
    resource: 'booking',
    action: 'write',
    permissions: ['booking.write', 'booking.admin']
  }));

  defaultPolicy.addRule(new AccessControlRule({
    id: 'admin-only',
    resource: 'admin',
    action: '*',
    roles: ['admin']
  }));

  // Create bootstrap instance for more control
  const bootstrap = new Bootstrap({
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',

    // Modules to load
    modulePaths: [
      './examples/sample-module/index.js',
      // Add your modules here
      // './modules/booking/index.js',
      // './modules/analytics/index.js',
    ],

    // Security policies
    securityPolicies: [defaultPolicy],

    // Strict mode - fail on any module error
    strict: false
  });

  // Register lifecycle hooks
  bootstrap.registerHook('before:init', async (context) => {
    console.log('Hook: before:init');
  });

  bootstrap.registerHook('modules:registered', async (context) => {
    console.log('Hook: modules:registered');
    console.log('Registered modules:', context.moduleRegistry.getStatistics());
  });

  bootstrap.registerHook('app:ready', async (context) => {
    console.log('Hook: app:ready');
    console.log('Application is ready!');
  });

  try {
    // Initialize application
    const context = await bootstrap.initialize();

    console.log('\n=== Application Initialized ===');
    console.log('State:', bootstrap.state);
    console.log('\n=== Module Statistics ===');
    console.log(context.moduleRegistry.getStatistics());
    console.log('\n=== Extension Statistics ===');
    console.log(context.extensionRegistry.getStatistics());
    console.log('\n=== Security Statistics ===');
    console.log(context.securityManager.getStatistics());

    // Application health
    const health = await bootstrap.getHealth();
    console.log('\n=== Application Health ===');
    console.log(health);

    // Example: Use a registered service
    if (context.hasService('sample')) {
      const sampleService = context.getService('sample');
      const result = await sampleService.doSomething({ test: 'data' });
      console.log('\n=== Sample Service Test ===');
      console.log(result);
    }

    // Example: Execute a hook
    const hookResult = await context.extensionRegistry.executeHook(
      'before:save',
      context,
      { data: { name: 'Test' } }
    );
    console.log('\n=== Hook Execution Test ===');
    console.log(hookResult);

    // Example: Use a provider
    const cacheProvider = context.extensionRegistry.getProvider('cache', context);
    if (cacheProvider) {
      await cacheProvider.set('test-key', 'test-value');
      const value = await cacheProvider.get('test-key');
      console.log('\n=== Provider Test ===');
      console.log('Cached value:', value);
    }

    return context;

  } catch (error) {
    console.error('Application initialization failed:', error);
    console.error('Errors:', bootstrap.errors);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(bootstrap) {
  console.log('Shutting down application...');
  await bootstrap.shutdown();
  console.log('Application shut down successfully');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp()
    .then(async (context) => {
      // Keep app running
      console.log('\nApplication running. Press Ctrl+C to exit.');

      // Handle shutdown
      process.on('SIGINT', async () => {
        console.log('\nReceived SIGINT signal');
        await shutdown(context);
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('Failed to start application:', error);
      process.exit(1);
    });
}

export { initializeApp, shutdown };
