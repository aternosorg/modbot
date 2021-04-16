const monitor = require('../../Monitor').getInstance();

exports.event = async (options, warning) => {
    await monitor.error('The discord client emitted a warning', warning);
    console.error('The discord client emitted a warning', warning);
}
