/**
 * CORE SECURITY MANAGER (IMMUTABLE)
 *
 * Manages application security:
 * 1. Authentication providers
 * 2. Authorization checks
 * 3. Security policies
 * 4. Permission management
 * 5. Role management
 *
 * @version 1.0.0
 * @locked true
 */

import {
  SecurityContext,
  SecurityPolicy,
  AccessControlRule
} from '../contracts/security.contract.js';

/**
 * Security Manager
 * Central security orchestrator
 */
export class SecurityManager {
  constructor() {
    this.authenticationProviders = new Map();
    this.authorizationProviders = new Map();
    this.policies = new Map();
    this.permissions = new Map();
    this.roles = new Map();
    this.defaultPolicy = null;
  }

  /**
   * Register authentication provider
   *
   * @param {AuthenticationProvider} provider
   */
  registerAuthenticationProvider(provider) {
    if (!provider.name) {
      throw new Error('Provider must have a name');
    }

    this.authenticationProviders.set(provider.name, provider);
    console.log(`Authentication provider registered: ${provider.name}`);
  }

  /**
   * Register authorization provider
   *
   * @param {AuthorizationProvider} provider
   */
  registerAuthorizationProvider(provider) {
    if (!provider.name) {
      throw new Error('Provider must have a name');
    }

    this.authorizationProviders.set(provider.name, provider);
    console.log(`Authorization provider registered: ${provider.name}`);
  }

  /**
   * Get authentication provider
   *
   * @param {string} name - Provider name
   * @returns {AuthenticationProvider|null}
   */
  getAuthenticationProvider(name) {
    return this.authenticationProviders.get(name) || null;
  }

  /**
   * Get authorization provider
   *
   * @param {string} name - Provider name
   * @returns {AuthorizationProvider|null}
   */
  getAuthorizationProvider(name) {
    return this.authorizationProviders.get(name) || null;
  }

  /**
   * Authenticate request
   *
   * @param {Object} request - Request object
   * @param {string} providerName - Provider to use (optional)
   * @returns {Promise<SecurityContext>}
   */
  async authenticate(request, providerName = null) {
    let provider;

    if (providerName) {
      provider = this.getAuthenticationProvider(providerName);
      if (!provider) {
        throw new Error(`Authentication provider not found: ${providerName}`);
      }
    } else {
      // Use first available provider
      const providers = Array.from(this.authenticationProviders.values());
      if (providers.length === 0) {
        throw new Error('No authentication providers registered');
      }
      provider = providers[0];
    }

    return await provider.authenticate(request);
  }

  /**
   * Register a security policy
   *
   * @param {SecurityPolicy} policy
   */
  async registerPolicy(policy) {
    if (!(policy instanceof SecurityPolicy)) {
      throw new Error('Policy must be instance of SecurityPolicy');
    }

    this.policies.set(policy.name, policy);
    console.log(`Security policy registered: ${policy.name}`);
  }

  /**
   * Set default policy
   *
   * @param {string} policyName - Policy name
   */
  setDefaultPolicy(policyName) {
    const policy = this.policies.get(policyName);

    if (!policy) {
      throw new Error(`Policy not found: ${policyName}`);
    }

    this.defaultPolicy = policy;
  }

  /**
   * Authorize operation
   *
   * @param {SecurityContext} context - Security context
   * @param {string} resource - Resource identifier
   * @param {string} action - Action identifier
   * @param {string} policyName - Policy to use (optional)
   * @returns {Promise<boolean>}
   */
  async authorize(context, resource, action, policyName = null) {
    let policy;

    if (policyName) {
      policy = this.policies.get(policyName);
      if (!policy) {
        throw new Error(`Policy not found: ${policyName}`);
      }
    } else {
      policy = this.defaultPolicy;
      if (!policy) {
        throw new Error('No default policy set');
      }
    }

    return await policy.evaluate(context, resource, action);
  }

  /**
   * Register a permission
   *
   * @param {Permission} permission
   */
  registerPermission(permission) {
    if (!permission.id) {
      throw new Error('Permission must have an ID');
    }

    if (this.permissions.has(permission.id)) {
      throw new Error(`Permission already registered: ${permission.id}`);
    }

    this.permissions.set(permission.id, permission);
  }

  /**
   * Get permission
   *
   * @param {string} permissionId
   * @returns {Permission|null}
   */
  getPermission(permissionId) {
    return this.permissions.get(permissionId) || null;
  }

  /**
   * Check if permission exists
   *
   * @param {string} permissionId
   * @returns {boolean}
   */
  hasPermission(permissionId) {
    return this.permissions.has(permissionId);
  }

  /**
   * Register a role
   *
   * @param {Role} role
   */
  registerRole(role) {
    if (!role.id) {
      throw new Error('Role must have an ID');
    }

    if (this.roles.has(role.id)) {
      throw new Error(`Role already registered: ${role.id}`);
    }

    // Validate permissions exist
    for (const permissionId of role.permissions) {
      if (!this.hasPermission(permissionId)) {
        throw new Error(`Role ${role.id} references unknown permission: ${permissionId}`);
      }
    }

    // Validate inherited roles exist
    for (const parentRoleId of (role.inherits || [])) {
      if (!this.roles.has(parentRoleId)) {
        throw new Error(`Role ${role.id} inherits from unknown role: ${parentRoleId}`);
      }
    }

    this.roles.set(role.id, role);
  }

  /**
   * Get role
   *
   * @param {string} roleId
   * @returns {Role|null}
   */
  getRole(roleId) {
    return this.roles.get(roleId) || null;
  }

  /**
   * Get all permissions for a role (including inherited)
   *
   * @param {string} roleId
   * @returns {string[]}
   */
  getRolePermissions(roleId) {
    const role = this.getRole(roleId);

    if (!role) {
      return [];
    }

    const permissions = new Set(role.permissions);

    // Add inherited permissions
    for (const parentRoleId of (role.inherits || [])) {
      const parentPermissions = this.getRolePermissions(parentRoleId);
      for (const permission of parentPermissions) {
        permissions.add(permission);
      }
    }

    return Array.from(permissions);
  }

  /**
   * Create security context from session
   *
   * @param {Object} session - Session object
   * @returns {Promise<SecurityContext>}
   */
  async createContextFromSession(session) {
    const context = new SecurityContext({
      session,
      shop: session.shop,
      authenticated: true
    });

    // Get roles and permissions from authorization provider if available
    if (this.authorizationProviders.size > 0) {
      const provider = Array.from(this.authorizationProviders.values())[0];

      try {
        context.roles = await provider.getRoles(context);
        context.permissions = await provider.getPermissions(context);
      } catch (error) {
        console.error('Failed to get roles/permissions:', error);
      }
    }

    return context;
  }

  /**
   * Create access control rule
   *
   * @param {Object} config - Rule configuration
   * @returns {AccessControlRule}
   */
  createRule(config) {
    return new AccessControlRule(config);
  }

  /**
   * Create security policy
   *
   * @param {string} name - Policy name
   * @returns {SecurityPolicy}
   */
  createPolicy(name) {
    return new SecurityPolicy(name);
  }

  /**
   * Get security statistics
   *
   * @returns {Object}
   */
  getStatistics() {
    return {
      authenticationProviders: this.authenticationProviders.size,
      authorizationProviders: this.authorizationProviders.size,
      policies: this.policies.size,
      permissions: this.permissions.size,
      roles: this.roles.size,
      hasDefaultPolicy: this.defaultPolicy !== null
    };
  }
}
