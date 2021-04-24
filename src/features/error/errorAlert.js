const monitor = require('../../Monitor').getInstance();

exports.event = async (options, error) => {
    await monitor.error('The discord client experienced an error', error);
    console.error('The discord client experienced an error', error);
}
