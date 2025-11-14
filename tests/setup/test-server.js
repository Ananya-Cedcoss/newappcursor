/**
 * Test Server Helper for Integration Tests
 * Creates a simple HTTP server wrapper for testing Remix routes with Supertest
 */

import { createServer } from 'http';
import { createRequestHandler } from '@remix-run/node';

/**
 * Create a test server for a specific Remix route
 * @param {Object} route - The route module with loader and/or action
 * @returns {Server} HTTP server instance
 */
export function createTestServer(route) {
  const handler = async (req, res) => {
    try {
      // Collect body data
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      await new Promise((resolve) => req.on('end', resolve));

      // Build full URL
      const protocol = 'http';
      const host = req.headers.host || 'localhost';
      const url = `${protocol}://${host}${req.url}`;

      // Create Remix-style request
      const request = new Request(url, {
        method: req.method,
        headers: Object.entries(req.headers).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {}),
        body: body || undefined,
      });

      let response;

      // Route to appropriate handler
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (route.loader) {
          response = await route.loader({ request, params: {}, context: {} });
        } else {
          response = new Response('Not Found', { status: 404 });
        }
      } else {
        if (route.action) {
          response = await route.action({ request, params: {}, context: {} });
        } else {
          response = new Response('Method Not Allowed', { status: 405 });
        }
      }

      // Send response
      res.statusCode = response.status;

      // Set headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Send body
      const responseBody = await response.text();
      res.end(responseBody);
    } catch (error) {
      console.error('Test server error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
    }
  };

  return createServer(handler);
}

/**
 * Create a test app function for Supertest
 * This allows using supertest without starting an actual server
 */
export function createTestApp(route) {
  return createTestServer(route);
}

export default {
  createTestServer,
  createTestApp,
};
