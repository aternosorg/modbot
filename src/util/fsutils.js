import * as fs from 'fs/promises';
import {readFile} from 'fs/promises';

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export async function exists(path) {
    try {
        await fs.stat(path);
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        }
        throw e;
    }
    return true;
}

/**
 * read a json file
 * @param {string} path
 * @returns {Promise<*>}
 */
export async function readJSON(path) {
    return JSON.parse((await readFile(path)).toString());
}