import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { type MultiBar } from 'cli-progress'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'

export async function resolveRepoDir(
    repo: string,
    multibar?: MultiBar,
    ref?: string
): Promise<string> {
    if (URL.canParse(repo)) {
        const bar = multibar?.create(100, 0, {
            phase: 'Cloning',
            repo
        })
        // If a URL, clone the repo to a temp directory
        const dir = await fs.promises.mkdtemp(join(tmpdir(), 'repo-'))

        await git.clone({
            fs,
            http,
            dir,
            url: repo,
            ref,
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
            onMessage: () => {},
            singleBranch: true
        })

        bar?.stop()
        if (bar) multibar?.remove(bar)
        return dir
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
