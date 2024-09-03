import jsdoc from 'eslint-plugin-jsdoc';
import json from 'eslint-plugin-json';
import globals from 'globals';
import js from '@eslint/js';

export default [
    js.configs.recommended,
    json.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        files: ['**/*.js'],
        plugins: {
            jsdoc,
        },
        rules: {
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/require-property-description': 'off',
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },

            ecmaVersion: 'latest',
            sourceType: 'module',
        },

        rules: {
            indent: ['error', 4, {
                SwitchCase: 1,
            }],

            'linebreak-style': ['error', 'unix'],

            'no-unused-vars': ['error', {
                vars: 'all',
                args: 'none',
                ignoreRestSiblings: false,
            }],

            semi: ['error', 'always'],
        },
    }
];