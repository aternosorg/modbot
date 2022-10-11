import SubCommandGroup from '../SubCommandGroup.js';
import ShowPunishmentsCommand from './punishments/ShowPunishmentsCommand.js';
import SetPunishmentsCommand from './punishments/SetPunishmentsCommand.js';

export default class PunishmentsCommandGroup extends SubCommandGroup {

    getChildren() {
        return [
            new ShowPunishmentsCommand(),
            new SetPunishmentsCommand(),
        ];
    }

    getDescription() {
        return 'Show and manage punishments for reaching specific strike counts.';
    }

    getName() {
        return 'punishments';
    }
}