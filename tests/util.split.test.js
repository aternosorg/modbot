const util = require('../src/util');

test('split a simple string', () => {
    expect(util.split("a simple string", " ")).toStrictEqual(["a", "simple", "string"]);
})

test('split a string in quotes', () => {
    expect(util.split("'a string in quotes'", " ")).toStrictEqual(["a string in quotes"]);
})

test('split a string in double quotes', () => {
    expect(util.split('"a string in quotes"', " ")).toStrictEqual(["a string in quotes"]);
})

test('split a string with quotes in double quotes', () => {
    expect(util.split('"a string \' in quotes"', " ")).toStrictEqual(["a string \' in quotes"]);
})

test('split a string with double quotes in quotes', () => {
    expect(util.split("'a string \" in quotes'", " ")).toStrictEqual(["a string \" in quotes"]);
})

test('split a string with an apostrophe', () => {
    expect(util.split("this isn't in quotes", " ")).toStrictEqual(["this", "isn't", "in", "quotes"]);
})

test('split a string with a single quote', () => {
    expect(util.split("this 'quote never ends", " ")).toStrictEqual(["this", "'quote", "never", "ends"]);
})

test('split a string with a single quote at the end', () => {
    expect(util.split("this quote never ends '", " ")).toStrictEqual(["this", "quote", "never", "ends", "'"]);
})

test('split a string with a single double quote', () => {
    expect(util.split('this "quote never ends', " ")).toStrictEqual(["this", '"quote', "never", "ends"]);
})

test('split a string with a single double quote at the end', () => {
    expect(util.split('this quote never ends "', " ")).toStrictEqual(["this", "quote", "never", "ends", '"']);
})
