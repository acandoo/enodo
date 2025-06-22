import cliProgress from 'cli-progress'
import { getRepoLog } from '../internal/git-utils.js'

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
            hideCursor: true,
            format: ' {phase} | {bar} | {repo} | {percentage}%'
        },
        cliProgress.Presets.shades_classic
    )
    const results = await Promise.all(
        repos.map(async (repo) => getRepoLog(repo, multibar))
    )
    multibar.stop()
    console.clear()
    results.forEach((repo, index) => {
        // Placeholder for processing each repository's commits
        console.log(`Repository ${repos[index]} has ${repo.length} commits`)
    })
    console.log(
        results.map((repo) => repo.map((commit) => commit.commit.author))
    )
    return
}
