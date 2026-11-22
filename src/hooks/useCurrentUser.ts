'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAuthMe } from '@/lib/api';
import type { User } from '@/types/user';

export interface UseCurrentUserResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const me = await getAuthMe();
      setUser(me);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { user, isLoading, error, refetch: load };
}