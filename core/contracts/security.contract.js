/**
 * CORE SECURITY CONTRACT (IMMUTABLE)
 *
 * Defines security, authentication, and authorization interfaces.
 * This contract is locked and cannot be modified.
 *
 * @version 1.0.0
 * @locked true
 */

/**
 * Permission Levels
 */
export const PermissionLevel = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  DELETE: 3,
  ADMIN: 4
};

/**
 * Authentication Status
 */
export const AuthenticationStatus = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  EXPIRED: 'expired',
  INVALID: 'invalid'
};

/**
 * Security Context
 * Represents the security state for a request/operation
 */
export class SecurityContext {
  constructor(data = {}) {
    this.shop = data.shop || null;
    this.session = data.session || null;
    this.user = data.user || null;
    this.permissions = data.permissions || [];
    this.roles = data.roles || [];
    this.metadata = data.metadata || {};
    this.authenticated = data.authenticated || false;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Check if context has permission
   *
   * @param {string} permission - Permission identifier
   * @returns {boolean}
   */
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  /**
   * Check if context has any of the permissions
   *
   * @param {string[]} permissions - Permission identifiers
   * @returns {boolean}
   */
  hasAnyPermission(permissions) {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Check if context has all permissions
   *
   * @param {string[]} permissions - Permission identifiers
   * @returns {boolean}
   */
  hasAllPermissions(permissions) {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Check if context has role
   *
   * @param {string} role - Role identifier
   * @returns {boolean}
   */
  hasRole(role) {
    return this.roles.includes(role);
  }

  /**
   * Check if context has any of the roles
   *
   * @param {string[]} roles - Role identifiers
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    return roles.some(r => this.hasRole(r));
  }

  /**
   * Serialize context
   */
  toJSON() {
    return {
      shop: this.shop,
      session: this.session ? { id: this.session.id } : null,
      user: this.user,
      permissions: this.permissions,
      roles: this.roles,
      authenticated: this.authenticated,
      timestamp: this.timestamp
    };
  }
}

/**
 * Authentication Provider Contract
 */
export class AuthenticationProvider {
  /**
   * Provider name
   */
  static get name() {
    throw new Error('Provider must define name');
  }

  /**
   * Authenticate request
   *
   * @param {Object} request - Request object
   * @returns {Promise<SecurityContext>}
   */
  static async authenticate(request) {
    throw new Error('Provider must implement authenticate()');
  }

  /**
   * Validate session
   *
   * @param {Object} session - Session object
   * @returns {Promise<boolean>}
   */
  static async validateSession(session) {
    throw new Error('Provider must implement validateSession()');
  }

  /**
   * Refresh authentication
   *
   * @param {Object} context - Security context
   * @returns {Promise<SecurityContext>}
   */
  static async refresh(context) {
    throw new Error('Provider must implement refresh()');
  }
}

/**
 * Authorization Provider Contract
 */
export class AuthorizationProvider {
  /**
   * Provider name
   */
  static get name() {
    throw new Error('Provider must define name');
  }

  /**
   * Check if operation is authorized
   *
   * @param {SecurityContext} context - Security context
   * @param {string} resource - Resource identifier
   * @param {string} action - Action identifier
   * @returns {Promise<boolean>}
   */
  static async authorize(context, resource, action) {
    throw new Error('Provider must implement authorize()');
  }

  /**
   * Get permissions for context
   *
   * @param {SecurityContext} context - Security context
   * @returns {Promise<string[]>}
   */
  static async getPermissions(context) {
    throw new Error('Provider must implement getPermissions()');
  }

  /**
   * Get roles for context
   *
   * @param {SecurityContext} context - Security context
   * @returns {Promise<string[]>}
   */
  static async getRoles(context) {
    throw new Error('Provider must implement getRoles()');
  }
}

/**
 * Access Control Rule
 */
export class AccessControlRule {
  constructor(config) {
    this.id = config.id;
    this.resource = config.resource;
    this.action = config.action;
    this.permissions = config.permissions || [];
    this.roles = config.roles || [];
    this.condition = config.condition || null;
  }

  /**
   * Evaluate rule against security context
   *
   * @param {SecurityContext} context
   * @returns {Promise<boolean>}
   */
  async evaluate(context) {
    // Check permissions
    if (this.permissions.length > 0 && !context.hasAnyPermission(this.permissions)) {
      return false;
    }

    // Check roles
    if (this.roles.length > 0 && !context.hasAnyRole(this.roles)) {
      return false;
    }

    // Check custom condition
    if (this.condition && typeof this.condition === 'function') {
      return await this.condition(context);
    }

    return true;
  }
}

/**
 * Security Policy
 * Collection of access control rules
 */
export class SecurityPolicy {
  constructor(name) {
    this.name = name;
    this.rules = new Map();
  }

  /**
   * Add rule to policy
   *
   * @param {AccessControlRule} rule
   */
  addRule(rule) {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove rule from policy
   *
   * @param {string} ruleId
   */
  removeRule(ruleId) {
    this.rules.delete(ruleId);
  }

  /**
   * Get rule by ID
   *
   * @param {string} ruleId
   * @returns {AccessControlRule|null}
   */
  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Find rules for resource and action
   *
   * @param {string} resource
   * @param {string} action
   * @returns {AccessControlRule[]}
   */
  findRules(resource, action) {
    return Array.from(this.rules.values()).filter(
      rule => rule.resource === resource && rule.action === action
    );
  }

  /**
   * Evaluate policy against security context
   *
   * @param {SecurityContext} context
   * @param {string} resource
   * @param {string} action
   * @returns {Promise<boolean>}
   */
  async evaluate(context, resource, action) {
    const rules = this.findRules(resource, action);

    if (rules.length === 0) {
      return false; // Deny by default
    }

    // Allow if any rule passes
    for (const rule of rules) {
      if (await rule.evaluate(context)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Permission definition
 *
 * @typedef {Object} Permission
 * @property {string} id - Permission identifier
 * @property {string} name - Permission name
 * @property {string} description - Permission description
 * @property {PermissionLevel} level - Permission level
 * @property {string} resource - Resource this permission applies to
 */

/**
 * Role definition
 *
 * @typedef {Object} Role
 * @property {string} id - Role identifier
 * @property {string} name - Role name
 * @property {string} description - Role description
 * @property {string[]} permissions - Permission IDs
 * @property {string[]} inherits - Parent role IDs
 */
