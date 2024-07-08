import VisionMigration from './VisionMigration.js';

export default class AutoResponseVisionMigration extends VisionMigration {
    get previousField() {
        return 'channels';
    }

    get table() {
        return 'responses';
    }
}
