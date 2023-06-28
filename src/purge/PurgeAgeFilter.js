import PurgeFilter from './PurgeFilter.js';
import {BULK_DELETE_MAX_AGE} from '../util/apiLimits.js';

/**
 * @class PurgeAgeFilter
 * @classdesc A filter that matches messages younger than the max age
 */
export default class PurgeAgeFilter extends PurgeFilter {
    matches(message) {
        return (Date.now() - message.createdTimestamp) < BULK_DELETE_MAX_AGE;
    }
}