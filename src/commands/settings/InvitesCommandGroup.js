import SubCommandGroup from '../SubCommandGroup.js';
import ShowInvitesCommand from './invites/ShowInvitesCommand.js';
import SetInvitesCommand from './invites/SetInvitesCommand.js';

export default class InvitesCommandGroup extends SubCommandGroup {

    getChildren() {
        return [
            new ShowInvitesCommand(),
            new SetInvitesCommand(),
        ];
    }

    getDescription() {
        return 'Prevent users from sending invites';
    }

    getName() {
        return 'invites';
    }
}