import got from 'got';
import {createHash} from 'crypto';

export default class Request {

    request;

    /**
     * @type {string}
     */
    response;

    /**
     * parsed JSON response
     * @type {object}
     */
    JSON;

    constructor(url, options = {}) {
        this.url = url;
        this.options = options;
    }

    /**
     * get raw data
     * @returns {Promise<Request>}
     */
    async get() {
        this.request = await got.get(this.url, this.options);
        this.response = this.request.body.toString();
        return this;
    }

    /**
     * get JSON data and parse it
     * @returns {Promise<Request>}
     */
    async getJSON() {
        await this.get();
        try {
            this.JSON = JSON.parse(this.response);
        }
        catch (e) {
            throw new Error(`Failed to parse JSON response of ${this.url}`, e);
        }
        return this;
    }

    /**
     * request this url and return a sha256 hash of the raw body
     * @returns {Promise<string>}
     */
    async getHash() {
        const response = await got.get(this.url, this.options);
        return createHash('sha256').update(new DataView(response.rawBody.buffer)).digest('hex').toString();
    }
}
