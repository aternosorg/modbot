const SubCommand = require('./SubCommand');

/**
 * @class
 * @classdesc Get the current configuration
 * @abstract
 */
class GetConfigCommand extends SubCommand {
    static description = 'View the current configuration.';

    static names = ['get', 'status'];
}

module.exports = GetConfigCommand;