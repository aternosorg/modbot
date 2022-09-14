import {Collection} from 'discord.js';

/**
 * @class
 * @template K,V
 */
export default class Cache {
    /**
     * @type {Collection<K, CacheEntry<V>>}
     */
    #cache = new Collection();

    constructor() {
        setInterval(this.checkCache.bind(this), 5000);
    }

    /**
     * get the value of a cache entry
     * @param {K} key
     * @return {?V}
     */
    get(key) {
        return this.getEntry(key)?.value;
    }

    /**
     * get a cache entry
     * @param {K} key
     * @return {?CacheEntry<V>}
     */
    getEntry(key) {
        return this.#cache.get(key);
    }

    /**
     * set the value of this entry
     * @param {K} key
     * @param {V} value
     * @param {number} ttl
     */
    set(key, value, ttl) {
        this.#cache.set(key, new CacheEntry(value, ttl));
    }

    checkCache() {
        for (const [key, entry] of this.#cache) {
            if (entry.shouldBeCleared) {
                this.#cache.delete(key);
            }
        }
    }
}

/**
 * @class
 * @template V
 */
export class CacheEntry {
    /**
     * @param {V} value
     * @param {number} ttl cache duration in ms
     */
    constructor(value, ttl) {
        this.value = value;
        this.until = Date.now() + ttl;
    }

    get shouldBeCleared() {
        return Date.now() > this.until;
    }
}