const monitor = require('../../Monitor').getInstance();

exports.event = async(options, rateLimitInfo) => {
    await monitor.warn('The bot hit a ratelimit', rateLimitInfo);
    console.log('The bot hit a ratelimit', rateLimitInfo);
}
