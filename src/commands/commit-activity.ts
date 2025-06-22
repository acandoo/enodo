import git from 'isomorphic-git'
import cliProgress from 'cli-progress'
import fs from 'node:fs'
import { resolveRepoDir, cleanup } from '../internal/dir-utils.ts'

export default async function createActivityChart(
    repos: string[],
    output: string
): Promise<void> {
    // Validate output file is a PNG
    if (!output.endsWith('.png')) {
        throw new Error('Output file must be a PNG')
    }
    const multibar = new cliProgress.MultiBar(
        {
            clearOnComplete: false,
            hideCursor: false,
            format: ' {phase} | {bar} | {repo} | {percentage}%'
        },
        cliProgress.Presets.shades_classic
    )
    const results = await Promise.all(
        repos.map(async (repo) => {
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
        })
    )
    multibar.stop()
    results.forEach((repo, index) => {
        // Placeholder for processing each repository's commits
        console.log(`Repository ${repos[index]} has ${repo.length} commits`)
    })
    return
}
