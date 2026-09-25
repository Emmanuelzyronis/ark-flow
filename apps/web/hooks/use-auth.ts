'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi, ApiError } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  org_id: string;
  org?: { name: string };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ark_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('ark_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('ark_token', res.token);
    setUser(res.user as AuthUser);
    return res;
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name?: string,
    org_name?: string
  ) => {
    const res = await authApi.register({ email, password, name, org_name });
    localStorage.setItem('ark_token', res.token);
    setUser(res.user as AuthUser);
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ark_token');
    setUser(null);
    window.location.href = '/auth/login';
  }, []);

  return { user, loading, login, register, logout };
}
