import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import { createPSCAdapter, NodeSyncAdapter } from '@alova/psc';
import { LRUCache } from 'lru-cache';

function lRUCache(options: LRUCache.Options<string, any, any>) {
  const cache = new LRUCache(options);
  return {
    set(key: string, value: any) {
      cache.set(key, value);
    },

    get(key: string) {
      return cache.get(key);
    },

    remove(key: string) {
      cache.delete(key);
    },

    clear() {
      cache.clear();
    }
  };
}

const alovaInstance = createAlova({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001',
  requestAdapter: adapterFetch(),
  responded: (response) => response.json(),
  cacheLogger: false,
  l1Cache: createPSCAdapter(
    NodeSyncAdapter(),
    lRUCache({
      max: 1000,
      ttl: 1000 * 60 * 10,
    }),
  )
});

export default alovaInstance;