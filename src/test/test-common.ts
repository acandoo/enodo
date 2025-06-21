import fs from 'node:fs'
import { join } from 'node:path'

import git from 'isomorphic-git'

export const EXAMPLE_REPO = 'https://github.com/octocat/Hello-World'
export const TEST_REPO_NAME = 'test-git-repo'
export const TEST_FAKE_REPO = 'not-a-git-repo'
export const GIT_USERNAME = 'Test User'
export const GIT_EMAIL = 'test@example.com'

// Helper to create a dummy git repo
export async function setupTestRepo(testRepo: string): Promise<void> {
    if (!fs.existsSync(testRepo)) {
        await fs.promises.mkdtemp(testRepo)
    }
    await git.init({ fs, dir: testRepo })
    await fs.promises.writeFile(join(testRepo, 'README.md'), '# Test Repo')
    await git.add({ fs, dir: testRepo, filepath: 'README.md' })
    await git.commit({
        fs,
        dir: testRepo,
        author: { name: GIT_USERNAME, email: GIT_EMAIL },
        message: 'Initial commit'
    })
}
