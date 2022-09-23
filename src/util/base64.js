export function encode64(string) {
    return new Buffer.from(string).toString('base64');
}

export function decode64(string) {
    return new Buffer.from(string, 'base64').toString('utf-8');
}