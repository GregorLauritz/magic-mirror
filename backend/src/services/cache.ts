import { CACHE_TTL_MS } from 'config';
import { LOGGER } from 'services/loggers';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ApiCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      LOGGER.debug(`Cache expired for key: ${key}`);
      return undefined;
    }
    return entry.value;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  clear(): void {
    this.store.clear();
  }
}

export const apiCache = new ApiCacheService();
