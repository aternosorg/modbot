const util = require('../src/util');

test('escape simple string', () => {
    expect(util.escapeFormatting('Example String 123!')).toStrictEqual('Example String 123!')
})

test('escape string with one asterisk', () => {
    expect(util.escapeFormatting('* and obelix')).toStrictEqual('\\* and obelix')
})

test('escape string with two asterisks', () => {
    expect(util.escapeFormatting('* and *')).toStrictEqual('\\* and \\*')
})

test('escape string with four asterisks', () => {
    expect(util.escapeFormatting('** and **')).toStrictEqual('\\*\\* and \\*\\*')
})

test('escape string with one underscore', () => {
    expect(util.escapeFormatting('under _')).toStrictEqual('under \\_');
})

test('escape string with two underscores', () => {
    expect(util.escapeFormatting('under __')).toStrictEqual('under \\_\\_');
})

test('escape string with a tilde', () => {
    expect(util.escapeFormatting('~')).toStrictEqual('\\~');
})

test('escape string with two tildes', () => {
    expect(util.escapeFormatting('~~')).toStrictEqual('\\~\\~');
})

test('escape string with various formatting codes', () => {
    expect(util.escapeFormatting('**bold** *cursive* _cursive 2_ __underlined__'))
        .toStrictEqual('\\*\\*bold\\*\\* \\*cursive\\* \\_cursive 2\\_ \\_\\_underlined\\_\\_');
})

test('escape string with various formatting codes combined', () => {
    expect(util.escapeFormatting('__***bold, cursive and underlined***__'))
        .toStrictEqual('\\_\\_\\*\\*\\*bold, cursive and underlined\\*\\*\\*\\_\\_');
})

test('escape string with an url', () => {
    expect(util.escapeFormatting('hi https://github.com/aternosorg/modbot/')).toStrictEqual('hi https://github.com/aternosorg/modbot/');
})

test('escape string with an url with formatting codes', () => {
    expect(util.escapeFormatting('hi https://github.com__/__aternosorg__/modbot~-./'))
        .toStrictEqual('hi https://github.com__/__aternosorg__/modbot~-./');
})

test('escape string with an url and formatting', () => {
    expect(util.escapeFormatting('**hi** https://github.com/aternosorg/modbot/ __ho__'))
        .toStrictEqual('\\*\\*hi\\*\\* https://github.com/aternosorg/modbot/ \\_\\_ho\\_\\_');
})

test('escape string with two urls and formatting', () => {
    expect(util.escapeFormatting('**hi** https://github.com/aternosorg/modbot/ *ha* https://github.com/aternosorg/modbot2/ __ho__'))
        .toStrictEqual('\\*\\*hi\\*\\* https://github.com/aternosorg/modbot/ \\*ha\\* https://github.com/aternosorg/modbot2/ \\_\\_ho\\_\\_');
})

test('escape a short code block', () => {
    expect(util.escapeFormatting('`console.log("hello world!");`')).toStrictEqual('\\`console.log("hello world!");\\`')
})

test('escape a full code block', () => {
    expect(util.escapeFormatting('```js\nconsole.log("hello world!");\n```')).toStrictEqual('\\`\\`\\`js\nconsole.log("hello world!");\n\\`\\`\\`')
})

test('escape a full code block with formatting', () => {
    expect(util.escapeFormatting('```js\nconsole.log("**hello world**__!__");\n```'))
        .toStrictEqual('\\`\\`\\`js\nconsole.log("\\*\\*hello world\\*\\*\\_\\_!\\_\\_");\n\\`\\`\\`')
})