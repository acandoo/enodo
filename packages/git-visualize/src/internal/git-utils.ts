import fs from 'node:fs'

import type { MultiBar } from 'cli-progress'
import git, { type ReadCommitResult } from 'isomorphic-git'

import { cleanup, resolveRepoDir } from './dir-utils.ts'

export async function getRepoLog(
    repo: string,
    multibar?: MultiBar
): Promise<ReadCommitResult[]> {
    // Check if repo is a valid URL or a local path
    const dir = await resolveRepoDir(repo, multibar)

    // Get all commits
    const repoResult = await git.log({
        fs,
        dir
    })

    if (URL.canParse(repo)) {
        await cleanup(dir)
    }
    return repoResult
}
