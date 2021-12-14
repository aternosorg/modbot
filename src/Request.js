const got = require('got');
class Request {

    request;

    /**
     * @type {String}
     */
    response;

    /**
     * parsed JSON response
     * @type {Object}
     */
    JSON;

    constructor(url, options = {}) {
        this.url = url;
        this.options = options;
    }

    /**
     * get raw data
     * @return {Promise<Request>}
     */
    async get() {
        this.request = await got.get(this.url, this.options);
        this.response = this.request.body.toString();
        return this;
    }

    /**
     * get JSON data and parse it
     * @return {Promise<Request>}
     */
    async getJSON() {
        await this.get();
        try {
            this.JSON = JSON.parse(this.response);
        }
        catch (e) {
            throw `Failed to parse JSON response of ${this.url}`;
        }
        return this;
    }

    /**
     * Get response headers without loading full response
     * @return {Promise<{redirectUrls: Array<string>}>}
     * @throws Error
     */
    async getResponseHeaders() {
        const request = got(this.url);
        request.on('response', resp => {
            this.response = resp;
            request.cancel();
        });
        try {
            await request;
        }
        // eslint-disable-next-line no-empty
        catch (e) {}
        if(!this.response){
            throw new Error('Could not fetch headers');
        }
        return this.response;
    }
}

module.exports = Request;
