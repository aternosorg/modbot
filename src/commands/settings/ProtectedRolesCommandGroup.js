import SubCommandGroup from '../SubCommandGroup.js';
import AddProtectedRoleCommand from './protected-roles/AddProtectedRoleCommand.js';
import RemoveProtectedRoleCommand from './protected-roles/RemoveProtectedRoleCommand.js';
import ListProtectedRolesCommand from './protected-roles/ListProtectedRolesCommand.js';

export default class ProtectedRolesCommandGroup extends SubCommandGroup {

    getChildren() {
        return [
            new AddProtectedRoleCommand(),
            new RemoveProtectedRoleCommand(),
            new ListProtectedRolesCommand(),
        ];
    }

    getDescription() {
        return 'Manage roles protected from moderations';
    }

    getName() {
        return 'protected-roles';
    }
}