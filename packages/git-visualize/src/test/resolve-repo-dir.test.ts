import assert from 'node:assert/strict'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { type TestContext, suite, test } from 'node:test'

import { cleanup, resolveRepoDir } from '../internal/dir-utils.ts'
import {
    EXAMPLE_REPO,
    TEST_FAKE_REPO,
    TEST_REPO_NAME,
    setupTestRepo
} from './test-common.ts'

suite('resolveRepoDir', () => {
    test('returns the same path for a valid local git repo', async () => {
        const TEST_REPO_DIR = join(tmpdir(), TEST_REPO_NAME)
        await setupTestRepo(TEST_REPO_DIR)
        const dir = await resolveRepoDir(TEST_REPO_DIR)
        assert.equal(dir, TEST_REPO_DIR)
        await cleanup(TEST_REPO_DIR)
    })

    test('throws for a non-existent directory', async () => {
        const tmp = await fs.promises.mkdtemp(join(tmpdir(), TEST_FAKE_REPO))
        await fs.promises.rm(tmp, { recursive: true, force: true })
        // Now `tmp` is a guaranteed non-existent directory path
        await assert.rejects(() => resolveRepoDir(tmp), /does not exist/)
    })

    test('throws for a directory that is not a git repo', async () => {
        const tmp = await fs.promises.mkdtemp(join(tmpdir(), 'not-a-git-'))
        try {
            await assert.rejects(
                async () => await resolveRepoDir(tmp),
                /is not a Git repository/
            )
        } finally {
            await fs.promises.rm(tmp, { recursive: true, force: true })
        }
    })

    test('can correctly clone a remote repo URL', async (t) => {
        const dir = await resolveRepoDir(EXAMPLE_REPO)
        t.after(() => fs.promises.rm(dir, { recursive: true, force: true }))

        t.test(
            'can resolve a remote repo URL (clone)',
            async (t: TestContext) => {
                t.assert.ok(fs.readdirSync(join(dir, '.git')))
            }
        )

        t.test('downloads the repo correctly', async (t: TestContext) => {
            // Compare the repo directory with the pre-cloned example repo
            if (!t.filePath)
                throw new Error('TestContext.filePath is undefined')
            const cloned = await fs.promises.readdir(dir)
            const preCloned = await fs.promises.readdir(
                join(dirname(t.filePath), 'assets/EXAMPLE_REPO')
            )
            t.assert.deepEqual(
                cloned,
                preCloned,
                'Cloned repo contents should match the example repo contents'
            )
        })
    })
})
