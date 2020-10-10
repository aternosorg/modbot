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
     * @returns {Promise<void>}
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
        newCon.on('error', (err) => {
            newCon.end();
            this._handleConnectionError(err);
        });
        newCon.connect((err) => {
            if (err) {
                newCon.end();
                return this._handleConnectionError(err);
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
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access to database denied. Make sure your config and database are set up correctly!');
            process.exit(1);
        }

        this.con = null;
        for (let w of this.waiting) {
            w[1](err);
        }
        this.waiting = [];
        setTimeout(this._connect.bind(this), 5000);
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
                            if(err.fatal){
                                this.con.end();
                                this._handleConnectionError(err);
                                return this.queryAll(...args).then(resolve).catch(reject);
                            }
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
