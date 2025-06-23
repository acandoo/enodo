import fs from 'node:fs'
import { join } from 'node:path'

import { tempClone } from './git-utils.ts'
import { MultiBar } from 'cli-progress'

export async function resolveRepoDir(
    repo: string,
    multibar?: MultiBar
): Promise<string> {
    if (URL.canParse(repo)) {
        const bar = multibar?.create(100, 0, {
            phase: 'Cloning',
            repo,
            percentage: 0,
            value: 0,
            total: 0
        })
        // If a URL, clone the repo to a temp directory
        const repoDir = await tempClone({
            url: repo,
            onProgress: bar
                ? ({ phase, loaded, total }) => {
                      if (!loaded) return
                      if (total) {
                          bar?.update((loaded / total) * 100, {
                              phase,
                              repo
                          })
                      }
                  }
                : undefined,
            onMessage: () => {}
        })
        bar?.stop()
        if (bar) multibar?.remove(bar)
        return repoDir
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
