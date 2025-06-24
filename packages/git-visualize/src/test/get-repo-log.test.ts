import assert from 'node:assert/strict'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { type TestContext, suite, test } from 'node:test'

import { cleanup, resolveRepoDir } from '../internal/dir-utils.ts'
import { getRepoLog } from '../internal/git-utils.ts'
import {
    EXAMPLE_REPO,
    EXAMPLE_REPO_COMMITS,
    INITIAL_COMMIT,
    LOCAL_REPO_PATH,
    TEST_FAKE_REPO,
    TEST_REPO_COMMITS,
    TEST_REPO_NAME,
    setupTestRepo
} from './test-common.ts'

suite('getRepoLog', () => {
    test('returns the commit log for a valid local git repo', async () => {
        const TEST_REPO_DIR = join(tmpdir(), TEST_REPO_NAME)
        await setupTestRepo(TEST_REPO_DIR)
        const log = await getRepoLog(TEST_REPO_DIR)
        assert.equal(log.length, TEST_REPO_COMMITS)
        assert.equal(log.at(-1)?.commit.message, INITIAL_COMMIT)
        await cleanup(TEST_REPO_DIR)
    })

    test('throws for a non-existent directory', async () => {
        const tmp = await fs.promises.mkdtemp(join(tmpdir(), TEST_FAKE_REPO))
        await fs.promises.rm(tmp, { recursive: true, force: true })
        await assert.rejects(() => getRepoLog(tmp), /does not exist/)
    })

    test('throws for a directory that is not a git repo', async () => {
        const tmp = await fs.promises.mkdtemp(join(tmpdir(), 'not-a-git-'))
        try {
            await assert.rejects(
                async () => await getRepoLog(tmp),
                /is not a Git repository/
            )
        } finally {
            await fs.promises.rm(tmp, { recursive: true, force: true })
        }
    })

    test('can correctly clone a remote repo URL and get its log', async (t) => {
        const dir = await resolveRepoDir(EXAMPLE_REPO)
        t.after(() => fs.promises.rm(dir, { recursive: true, force: true }))
        await t.test(
            'can resolve a remote repo URL (clone) and get its log',
            async (t: TestContext) => {
                const log = await getRepoLog(EXAMPLE_REPO)
                t.assert.strictEqual(log.length, EXAMPLE_REPO_COMMITS)
                t.assert.equal(log.at(-1)?.commit.message, INITIAL_COMMIT)
            }
        )

        await t.test(
            'downloads the repo correctly and retrieves log',
            async (t: TestContext) => {
                // Compare the repo directory with the pre-cloned example repo
                if (!t.filePath)
                    throw new Error('TestContext.filePath is undefined')
                const cloned = await fs.promises.readdir(dir)
                const preCloned = await fs.promises.readdir(
                    join(dirname(t.filePath), LOCAL_REPO_PATH)
                )
                t.assert.deepEqual(
                    cloned,
                    preCloned,
                    'Cloned repo directory should match pre-cloned example repo'
                )
                const log = await getRepoLog(EXAMPLE_REPO)
                t.assert.ok(log.length > 0, 'Log should not be empty')
                t.assert.ok(
                    log.some((commit) =>
                        commit.commit.message.includes(INITIAL_COMMIT)
                    ),
                    'Log should contain initial commit message'
                )
            }
        )
    })
})
