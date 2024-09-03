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
     * @returns {?V}
     */
    get(key) {
        return this.getEntry(key)?.value;
    }

    /**
     * get a cache entry
     * @param {K} key
     * @returns {?CacheEntry<V>}
     */
    getEntry(key) {
        return this.#cache.get(key);
    }

    /**
     * set the value of this entry
     * @param {K} key
     * @param {V} value
     * @param {number} ttl cache duration in ms
     */
    set(key, value, ttl) {
        this.#cache.set(key, new CacheEntry(value, ttl));
    }

    /**
     * delete this key from the cache
     * @param {K} key
     */
    delete(key) {
        this.#cache.delete(key);
    }

    checkCache() {
        for (const [key, entry] of this.#cache) {
            if (entry.isCacheTimeOver) {
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

    get isCacheTimeOver() {
        return Date.now() > this.until;
    }
}
