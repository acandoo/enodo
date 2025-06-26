import assert from 'node:assert/strict'
import { suite, test } from 'node:test'

import { prettyURL } from '../internal/git-utils.ts'

const urlCases = [
    {
        input: 'https://github.com/user/repo',
        expected: 'user/repo'
    },
    {
        input: 'https://github.com/user/repo/',
        expected: 'user/repo'
    },
    {
        input: 'git+https://github.com/user/repo.js',
        expected: 'user/repo.js'
    },
    {
        input: 'git+https://github.com/user/repo.js/',
        expected: 'user/repo.js'
    },
    {
        input: 'git+https://github.com/user/repo.js.git',
        expected: 'user/repo.js'
    },
    {
        input: 'git+https://github.com/user/repo.js.git/',
        expected: 'user/repo.js'
    },
    {
        input: 'http://git.kernel.org/pub/test/user/repo.git',
        expected: 'user/repo'
    },
    {
        input: 'http://git.kernel.org/pub/test/user/repo.git/',
        expected: 'user/repo'
    },
    {
        input: 'https://github.com/user/repo.git?foo=bar',
        expected: 'user/repo'
    }
]

suite('prettyURL', () => {
    for (const { input, expected } of urlCases) {
        test(`prettyURL('${input}') -> '${expected}'`, () => {
            assert.strictEqual(prettyURL(input), expected)
        })
    }
})
