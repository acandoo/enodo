import fs from 'node:fs'
import { join } from 'node:path'

import { tempClone } from './git-utils.ts'

export async function resolveRepoDir(repo: string): Promise<string> {
    if (URL.canParse(repo)) {
        // If a URL, clone the repo to a temp directory
        return await tempClone({ url: repo })
    }
    if (!fs.existsSync(repo)) {
        throw new Error(`Directory ${repo} does not exist`)
    }
    if (!fs.existsSync(join(repo, '.git'))) {
        throw new Error(`Directory ${repo} is not a Git repository`)
    }
    return repo
}

export async function cleanup(dir: string): Promise<void> {
    if (fs.existsSync(dir)) {
        await fs.promises.rm(dir, {
            recursive: true,
            force: true
        })
    }
}
