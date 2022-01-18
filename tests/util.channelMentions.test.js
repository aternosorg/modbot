const util = require('../src/util');
const {Guild, Client} = require('discord.js');
const guild = new Guild(new Client({ intents: [] }), {
    channels: [
        {
            id: '000000001',
            type: 0
        },
        {
            id: '000000002',
            type: 0
        },
        {
            id: '000000003',
            type: 0
        }
    ],
    id: '107936397578489856'
});

test('get channel mentions of empty array', () => {
    expect(util.channelMentions(guild, [])).toStrictEqual([]);
});


test('get channel mentions of non-channel-names array', () => {
    expect(util.channelMentions(guild, ['not a channel'])).toStrictEqual([]);
});


test('get channel mentions of single id', () => {
    expect(util.channelMentions(guild, ['000000001'])).toStrictEqual(['000000001']);
});

test('get channel mentions of single mention', () => {
    expect(util.channelMentions(guild, ['<#000000001>'])).toStrictEqual(['000000001']);
});


test('get channel mentions of single id and not channel name', () => {
    expect(util.channelMentions(guild, ['000000001', 'not a channel'])).toStrictEqual(['000000001']);
});

test('get channel mentions of two ids', () => {
    expect(util.channelMentions(guild, ['000000001', '000000002'])).toStrictEqual(['000000001', '000000002']);
});

test('get channel mentions of two mentions', () => {
    expect(util.channelMentions(guild, ['<#000000001>', '<#000000002>'])).toStrictEqual(['000000001', '000000002']);
});

test('get channel mentions of real and fake id', () => {
    expect(util.channelMentions(guild, ['000000001', '0000000090'])).toStrictEqual(['000000001']);
});

test('get channel mentions of three mentions messed up by discord or a user', () => {
    expect(util.channelMentions(guild, ['<#000000001><#000000002><#000000003>'])).toStrictEqual(['000000001', '000000002', '000000003']);
});