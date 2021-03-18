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
        this.response = this.request.body.toString()
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
}

module.exports = Request;
