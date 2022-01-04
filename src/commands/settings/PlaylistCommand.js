const ConfigCommand = require('../ConfigCommand');
const GetPlaylistCommand = require('./playlist/GetPlaylistCommand');
const SetPlaylistCommand = require('./playlist/SetPlaylistCommand');
const DisablePlaylistCommand = require('./playlist/DisablePlaylistCommand');

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
