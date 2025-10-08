/* eslint-env jest */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import key modules to test
import { login } from '../app/shopify.server';
import { loader } from '../app/routes/_index/route';
import { shopifyApp } from '../app/shopify.server';
import { handleWebhooks } from '../app/routes/webhooks.app.scopes_update';

// Helper to simulate Request object
const createMockRequest = (url) => ({
  url: url,
  method: 'GET',
});

describe('Modern Valuation App Test Suite', () => {
  let prisma;

  beforeAll(() => {
    // Initialize Prisma client for database testing
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Close Prisma client connection
    await prisma.$disconnect();
  });

  describe('Application Configuration', () => {
    it('should have a valid Shopify app configuration', () => {
      const configPath = path.resolve(__dirname, '../shopify.app.toml');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain('name =');
      expect(configContent).toContain('client_id =');
    });

    it('should have required environment variables', () => {
      expect(process.env.SHOPIFY_API_KEY).toBeDefined();
      expect(process.env.SHOPIFY_API_SECRET).toBeDefined();
    });
  });

  describe('Database Interactions', () => {
    it('should connect to the database', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('should have a session table with correct schema', async () => {
      const sessionModel = prisma.session;
      
      // Check model exists
      expect(sessionModel).toBeDefined();

      // Test model creation
      const testSession = await sessionModel.create({
        data: {
          id: 'test-session-id',
          shop: 'test-shop.myshopify.com',
          state: 'active',
          accessToken: 'test-access-token',
        }
      });

      expect(testSession).toHaveProperty('id', 'test-session-id');
      expect(testSession).toHaveProperty('shop', 'test-shop.myshopify.com');

      // Clean up test data
      await sessionModel.delete({ where: { id: 'test-session-id' } });
    });
  });

  describe('Routes and Navigation', () => {
    describe('Index Route Loader', () => {
      it('should redirect when shop parameter is present', async () => {
        const mockRequest = createMockRequest('http://localhost:3000/?shop=test-shop.myshopify.com');
        
        await expect(loader({ request: mockRequest })).rejects.toEqual(
          expect.objectContaining({
            status: 302,
            headers: expect.any(Object)
          })
        );
      });

      it('should return showForm based on login availability', async () => {
        const mockRequest = createMockRequest('http://localhost:3000/');
        const result = await loader({ request: mockRequest });
        
        expect(result).toHaveProperty('showForm');
        expect(typeof result.showForm).toBe('boolean');
      });
    });

    it('should have an authentication route', () => {
      const authRoutePath = path.resolve(__dirname, '../app/routes/auth.$.jsx');
      expect(fs.existsSync(authRoutePath)).toBe(true);
    });
  });

  describe('Webhook Handling', () => {
    it('should have a webhook route for app scopes update', () => {
      expect(handleWebhooks).toBeDefined();
      expect(typeof handleWebhooks).toBe('function');
    });
  });

  describe('Build and Deployment', () => {
    it('should have a valid package.json with required scripts', () => {
      const packageJson = require('../package.json');
      
      const requiredScripts = [
        'build', 
        'dev', 
        'deploy', 
        'start', 
        'setup', 
        'test'
      ];

      requiredScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });

    it('should have correct Node.js engine requirement', () => {
      const packageJson = require('../package.json');
      
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.node).toBe('>=20.10');
    });
  });

  describe('Prisma Schema Validation', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

    it('should have a valid Prisma schema file', () => {
      expect(fs.existsSync(schemaPath)).toBe(true);
    });

    it('should have a Session model with correct fields', () => {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      
      const sessionModelFields = [
        'id',
        'shop',
        'state',
        'isOnline',
        'scope',
        'expires',
        'accessToken',
        'userId',
        'firstName',
        'lastName',
        'email',
        'accountOwner',
        'locale',
        'collaborator',
        'emailVerified'
      ];

      sessionModelFields.forEach(field => {
        expect(schemaContent).toContain(field);
      });
    });
  });
});
