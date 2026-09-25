import type { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthUser {
  sub: string;
  id: string;
  email: string;
  org_id: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  org_id: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export type RouteHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
