import { CACHE_TTL_MS } from 'config';
import { LOGGER } from 'services/loggers';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ApiCacheService {
  private static readonly MAX_SIZE = 500;
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor() {
    // Periodically prune expired entries to prevent memory leaks
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.expiresAt) {
          this.store.delete(key);
        }
      }
    }, 30 * 60 * 1000).unref();
  }

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
    if (!this.store.has(key) && this.store.size >= ApiCacheService.MAX_SIZE) {
      const oldestKey = this.store.keys().next().value as string;
      this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  clear(): void {
    this.store.clear();
  }
}

export const apiCache = new ApiCacheService();
