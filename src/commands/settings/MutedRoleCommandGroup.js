import SubCommandGroup from '../SubCommandGroup.js';
import CreateMutedRoleCommand from './muted-role/CreateMutedRoleCommand.js';
import SetMutedRoleCommand from './muted-role/SetMutedRoleCommand.js';
import DisableMutedRoleCommand from './muted-role/DisableMutedRoleCommand.js';

export default class MutedRoleCommandGroup extends SubCommandGroup {

    getChildren() {
        return [
            new CreateMutedRoleCommand(),
            new SetMutedRoleCommand(),
            new DisableMutedRoleCommand(),
        ];
    }

    getDescription() {
        return 'Manage the muted role (required for long or permanent mutes)';
    }

    getName() {
        return 'muted-role';
    }
}