import VisionMigration from './VisionMigration.js';

export default class BadWordVisionMigration extends VisionMigration {
    get previousField() {
        return 'priority';
    }

    get table() {
        return 'badWords';
    }
}
