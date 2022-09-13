const ConfigCommand = require('../ConfigCommand.js');
const GetPlaylistCommand = require('./playlist/GetPlaylistCommand.js');
const SetPlaylistCommand = require('./playlist/SetPlaylistCommand.js');
const DisablePlaylistCommand = require('./playlist/DisablePlaylistCommand.js');

class PlaylistCommand extends ConfigCommand {

    static description = 'Configure a YouTube playlist for the video command';

    static usage = 'set|get|disable';

    static names = ['playlist'];

    static userPerms = ['MANAGE_GUILD'];

    static getSubCommands() {
        return [
            GetPlaylistCommand,
            SetPlaylistCommand,
            DisablePlaylistCommand,
        ];
    }
}

module.exports = PlaylistCommand;
