import Config from '../Config.js';
import {Logging} from '@google-cloud/logging';

export default class Logger {

    static #instance = new Logger();

    #config = Config.instance.data.monitoring;

    #cloudLogging = new Logging({
        projectId: this.#config.monitoring.projectId,
        credentials: this.#config.monitoring.credentials
    });

    #cloudLog = this.#cloudLogging.log(this.#config.monitoring.logName);

    /**
     * @returns {Logger}
     */
    static get instance() {
        return this.#instance;
    }

    /**
     * @param {String|Object} message
     * @returns {Promise}
     */
    debug(message){
        return this.#logMessage('DEBUG', console.debug, message);
    }

    /**
     * @param {String|Object} message
     * @returns {Promise}
     */
    info(message){
        return this.#logMessage('INFO', console.log, message);
    }

    /**
     * @param {String|Object} message
     * @returns {Promise}
     */
    notice(message){
        return this.#logMessage('NOTICE', console.log, message);
    }

    /**
     * @param {String|Object} message
     * @returns {Promise}
     */
    warn(message){
        return this.#logMessage('WARNING', console.warn, message);
    }

    /**
     * @param {String|Object} message
     * @returns {Promise}
     */
    error(message){
        return this.#logMessage('ERROR', console.error, message);
    }

    /**
     * @param {string} severity
     * @param {function(string|object)} logFunction
     * @param {String|Object} message
     * @returns {Promise}
     */
    #logMessage(severity, logFunction, message) {
        logFunction(message);

        if (!this.#config.enabled) {
            return Promise.resolve();
        }

        const metadata = {
            resource: {
                type: 'global'
            },
            severity
        };

        message = this.getData(message);

        if (typeof message !== 'string') {
            JSON.stringify(message);
        }

        return this.#cloudLog.write(this.#cloudLog.entry(metadata, message));
    }
    
    getData(object) {
        if (object instanceof Error) {
            return {
                name: object.name,
                message: object.message,
                stack: object.stack,
                raw: object,
            };
        } 
        return object;
    }
}