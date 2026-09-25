import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import db from '../db/client.js';

const BCRYPT_ROUNDS = 12;

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/api/auth/register', async (req, reply) => {
    const { email, password, name, org_name } = req.body as {
      email: string;
      password: string;
      name?: string;
      org_name?: string;
    };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create org
    const orgResult = await db.query<{ id: string }>(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [org_name ?? `${name ?? email.split('@')[0]}'s Organization`]
    );
    const org_id = orgResult.rows[0].id;

    // Create user
    const userResult = await db.query<{ id: string; email: string; name: string; role: string }>(
      'INSERT INTO users (org_id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [org_id, email, name ?? email.split('@')[0], password_hash, 'admin']
    );
    const user = userResult.rows[0];

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, org_id },
      { expiresIn: process.env.JWT_EXPIRY ?? '7d' }
    );

    return reply.status(201).send({
      token,
      user: { id: user.id, email: user.email, name: user.name, org_id },
    });
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const result = await db.query<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      org_id: string;
      role: string;
    }>('SELECT id, email, name, password_hash, org_id, role FROM users WHERE email = $1', [email]);

    const user = result.rows[0];
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, org_id: user.org_id },
      { expiresIn: process.env.JWT_EXPIRY ?? '7d' }
    );

    return reply.send({
      token,
      user: { id: user.id, email: user.email, name: user.name, org_id: user.org_id },
    });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub: userId, org_id } = req.user;
    const result = await db.query<{ id: string; email: string; name: string; role: string }>(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const orgResult = await db.query<{ id: string; name: string; plan: string }>(
      'SELECT id, name, plan FROM organizations WHERE id = $1',
      [org_id]
    );

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      org_id,
      org: orgResult.rows[0] ?? null,
    });
  });
}
