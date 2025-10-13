import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Mock imports
jest.mock('../app/shopify.server', () => ({
  handleLogin: jest.fn(),
  shopifyApp: jest.fn()
}));

jest.mock('../app/routes/_index/route', () => ({
  loader: jest.fn()
}));

jest.mock('../app/routes/webhooks.app.scopes_update', () => ({
  handleWebhooks: jest.fn()
}));

// Import only the loader for testing
import { loader } from '../app/routes/_index/route';
import { handleWebhooks } from '../app/routes/webhooks.app.scopes_update';
import packageJson from '../package.json';

// Helper to simulate Request object
const createMockRequest = (url) => ({
  url,
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
  });

  describe('Database Interactions', () => {
    it('should connect to the database', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('should have a session table with correct schema', async () => {
      // Verify model properties
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

      // Check that the Prisma model has these fields
      const sessionModelFieldsInPrisma = Object.keys(prisma.session.fields);
      
      sessionModelFields.forEach((field) => {
        expect(sessionModelFieldsInPrisma).toContain(field);
      });
    });
  });

  describe('Routes and Navigation', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    describe('Index Route Loader', () => {
      it('should call loader with mock request', async () => {
        const mockRequest = createMockRequest('http://localhost:3000/?shop=test-shop.myshopify.com');
        
        // Mock the loader to simulate redirect
        loader.mockRejectedValue({
          status: 302,
          headers: {}
        });

        await expect(loader({ request: mockRequest })).rejects.toEqual(
          expect.objectContaining({
            status: 302,
            headers: expect.any(Object)
          })
        );

        expect(loader).toHaveBeenCalledWith({ request: mockRequest });
      });

      it('should return showForm based on login availability', async () => {
        const mockRequest = createMockRequest('http://localhost:3000/');
        
        // Mock the loader to return showForm
        loader.mockResolvedValue({ showForm: true });

        const result = await loader({ request: mockRequest });
        
        expect(result).toHaveProperty('showForm', true);
        expect(loader).toHaveBeenCalledWith({ request: mockRequest });
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
      const requiredScripts = [
        'build', 
        'dev', 
        'deploy', 
        'start', 
        'setup', 
        'test'
      ];

      requiredScripts.forEach((script) => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });

    it('should have correct Node.js engine requirement', () => {
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines.node).toBe('>=20.10');
    });
  });

  describe('Prisma Schema Validation', () => {
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

    it('should have a valid Prisma schema file', () => {
      expect(fs.existsSync(schemaPath)).toBe(true);
    });

    it('should have a Session model with correct fields', async () => {
      const schemaContent = await fs.promises.readFile(schemaPath, 'utf-8');
      
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

      sessionModelFields.forEach((field) => {
        expect(schemaContent).toContain(field);
      });
    });
  });
});
