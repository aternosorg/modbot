import Config from '../bot/Config.js';
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
     * @param {Error} [error]
     * @returns {Promise}
     */
    debug(message, error = null) {
        return this.#logMessage('DEBUG', console.debug, message, error);
    }

    /**
     * @param {String|Object} message
     * @param {Error} [error]
     * @returns {Promise}
     */
    info(message, error = null) {
        return this.#logMessage('INFO', console.log, message, error);
    }

    /**
     * @param {String|Object} message
     * @param {Error} [error]
     * @returns {Promise}
     */
    notice(message, error = null) {
        return this.#logMessage('NOTICE', console.log, message, error);
    }

    /**
     * @param {String|Object} message
     * @param {Error} [error]
     * @returns {Promise}
     */
    warn(message, error = null) {
        return this.#logMessage('WARNING', console.warn, message, error);
    }

    /**
     * @param {String|Object} message
     * @param {Error} [error]
     * @returns {Promise}
     */
    error(message, error = null) {
        return this.#logMessage('ERROR', console.error, message, error);
    }

    /**
     * @param {String|Object} message
     * @param {Error} [error]
     * @returns {Promise}
     */
    critical(message, error = null) {
        return this.#logMessage('CRITICAL', console.error, message, error);
    }

    /**
     * @param {string} severity
     * @param {function(string|object)} logFunction
     * @param {String|Object} message
     * @param {Error} [error]
     * @returns {Promise}
     */
    #logMessage(severity, logFunction, message, error = null) {
        logFunction(message);
        if (error) {
            logFunction(error);
            message = {
                message,
                error: this.getData(error),
            };
        }

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