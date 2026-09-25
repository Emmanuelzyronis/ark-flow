import 'dotenv/config';
import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import authRoutes from './routes/auth.js';
import invoiceRoutes from './routes/invoices.js';
import reconcileRoutes from './routes/reconcile.js';
import chaseRoutes from './routes/chase.js';
import vendorRoutes from './routes/vendors.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const IS_DEV = process.env.NODE_ENV !== 'production';

const fastify = Fastify({
  logger: {
    level: IS_DEV ? 'info' : 'info',
  },
  bodyLimit: 50 * 1024 * 1024, // 50MB for PDF base64
});

// Auth plugin
async function authPluginImpl(app: FastifyInstance) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    app.log.warn('JWT_SECRET not set');
  }

  await app.register(fastifyJwt, {
    secret: secret ?? 'MISSING_SECRET',
    sign: { algorithm: 'HS256' },
    verify: { algorithms: ['HS256'] },
  });

  async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    try {
      const payload = await request.jwtVerify<{ sub: string; email: string; org_id: string }>();
      if (!payload.sub) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      request.user = { sub: payload.sub, id: payload.sub, email: payload.email ?? '', org_id: payload.org_id ?? '' };
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  }

  app.decorate('authenticate', authenticate);
}

const authPlugin = fp(authPluginImpl, { name: 'arkflow-auth', fastify: '5.x' });

async function start() {
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024, files: 50 },
  });

  await fastify.register(authPlugin);
  await fastify.register(authRoutes);
  await fastify.register(invoiceRoutes);
  await fastify.register(reconcileRoutes);
  await fastify.register(chaseRoutes);
  await fastify.register(vendorRoutes);

  fastify.get('/health', async (_req, reply) => {
    return reply.send({ status: 'ok', service: 'ark-flow-api', timestamp: new Date().toISOString() });
  });

  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    request.log.error({ err: error, path: request.url }, 'Request error');
    return reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : error.message,
      ...(IS_DEV && statusCode >= 500 ? { stack: error.stack } : {}),
    });
  });

  fastify.setNotFoundHandler((_req, reply) => {
    return reply.status(404).send({ error: 'Not Found' });
  });

  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`ArkFlow API running on ${HOST}:${PORT}`);
}

process.on('SIGTERM', async () => { await fastify.close(); process.exit(0); });
process.on('SIGINT', async () => { await fastify.close(); process.exit(0); });

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
