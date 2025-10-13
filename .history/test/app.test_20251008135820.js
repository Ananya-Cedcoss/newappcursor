/* eslint-env jest */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Import key modules to test
import { shopifyApp } from '../app/shopify.server';
import { handleWebhooks } from '../app/routes/webhooks.app.scopes_update';

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

    it('should have a session table', async () => {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Session'
      `;
      expect(tables.length).toBeGreaterThan(0);
    });
  });

  describe('Webhook Handling', () => {
    it('should have a webhook route for app scopes update', () => {
      expect(handleWebhooks).toBeDefined();
      expect(typeof handleWebhooks).toBe('function');
    });
  });

  describe('Routes Configuration', () => {
    it('should have an index route', () => {
      const indexRoutePath = path.resolve(__dirname, '../app/routes/_index/route.jsx');
      expect(fs.existsSync(indexRoutePath)).toBe(true);
    });

    it('should have an authentication route', () => {
      const authRoutePath = path.resolve(__dirname, '../app/routes/auth.$.jsx');
      expect(fs.existsSync(authRoutePath)).toBe(true);
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
  });
});
