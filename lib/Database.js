const mysql = require('mysql');

class Database {
    /**
     * Database constructor
     *
     * @param options
     */
    constructor(options) {
        this.options = options;
        this.con = null;
        this.waiting = [];
        this._connect();
    }

    /**
     * Wait until a working MySQL connection is available
     *
     * @returns {Promise<unknown>}
     */
    waitForConnection() {
        return new Promise((resolve, reject) => {
            if (this.con !== null) {
                return resolve();
            }
            this.waiting.push([resolve, reject]);
        });
    }

    /**
     * Connect to MySQL
     *
     * @private
     */
    _connect() {
        let newCon = mysql.createConnection(this.options);
        newCon.on('err', (err) => {
            newCon.end();
            this._handleConnectionError(err);
        });
        newCon.connect((err) => {
            if (err) {
                newCon.end();
                return this._handleConnectionError();
            }
            this.con = newCon;
            for (let w of this.waiting) {
                w[0]();
            }
            this.waiting = [];
        });
    }

    /**
     * Handle connection error
     *
     * @param err
     * @private
     */
    _handleConnectionError(err) {
        this.con = null;
        for (let w of this.waiting) {
            w[1](err);
        }
        this.waiting = [];
        setTimeout(this._connect, 5000);
    }

    /**
     * Execute query and return all results
     *
     * @param args
     * @returns {Promise<Object[]>}
     */
    queryAll(...args) {
        return new Promise((resolve, reject) => {
            this.waitForConnection()
                .then(() => {
                    this.con.query(...args, (err, res) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(res);
                    });
                })
                .catch(reject);
        });
    }

    /**
     * Execute query and return the first result
     *
     * @param args
     * @returns {Promise<Object|null>}
     */
    async query(...args) {
        return (await this.queryAll(...args))[0] || null;
    }
}

module.exports = Database;
