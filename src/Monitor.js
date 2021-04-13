const {Logging} = require('@google-cloud/logging');

class Monitor {

    /**
     *
     * @type {Monitor}
     */
    static #instance = new Monitor(require('../config.json'));

    /**
     * @type {boolean}
     */
    #enabled;

    /**
     * Monitoring configuration
     * @type {Object}
     * @property {String} project_id
     * @property {String} log_name
     */
    #config = {};

    #logging;

    #log;

    /**
     *
     * @param {Object} [config]
     * @property {String} project_id
     * @property {String} log_name
     */
    constructor(config) {
        this.#enabled = config.monitoring && config.monitoring.enabled;

        if (!this.#enabled) return;

        this.#config = config.monitoring;

        this.#logging = new Logging({
            projectId: config.monitoring.project_id,
            credentials: config.monitoring.credentials
        });

        this.#log = this.#logging.log(config.monitoring.log_name)
    }

    /**
     * @return {Monitor}
     */
    static getInstance() {
        return this.#instance;
    }

    /**
     * @param {String|Object} messages
     * @return {Promise<*>}
     */
    info(...messages){
        return this._log({
            severity: 'INFO'
        }, ...messages)
    }

    /**
     * @param {String|Object} messages
     * @return {Promise<*>}
     */
    notice(...messages){
        return this._log({
            severity: 'NOTICE'
        }, ...messages)
    }

    /**
     * @param {String|Object} messages
     * @return {Promise<*>}
     */
    warn(...messages){
        return this._log({
            severity: 'WARNING'
        }, ...messages)
    }

    /**
     * @param {String|Object} messages
     * @return {Promise<*>}
     */
    error(...messages){
        return this._log({
            severity: 'ERROR'
        }, ...messages)
    }

    /**
     * @param {String|Object} messages
     * @return {Promise<*>}
     */
    critical(...messages){
        return this._log({
            severity: 'CRITICAL'
        }, ...messages)
    }

    /**
     * @param {String|Object} messages
     * @return {Promise<*>}
     */
    emergency(...messages){
        return this._log({
            severity: 'EMERGENCY'
        }, ...messages)
    }

    /**
     * @param {Object} metadata
     * @param {String|Object} messages
     * @return {Promise<*>}
     * @private
     */
    async _log(metadata, ...messages) {
        if (!this.#enabled) return null;
        metadata.resource = {type: 'global'};

        const entries = [];
        for (let msg of messages) {
            if (msg instanceof Error) {
                msg = msg.toString();
            }
            else if (typeof(msg) === "object") {
                msg = JSON.stringify(msg);
            }
            entries.push(this.#log.entry(metadata,msg));
        }
        return this.#log.write(entries);
    }
}

module.exports = Monitor;
