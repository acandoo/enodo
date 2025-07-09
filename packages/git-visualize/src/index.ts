import { program } from '@commander-js/extra-typings'

import pkg from '../package.json' with { type: 'json' }
import authorActivity from './commands/author-activity.ts'
import authorCommits from './commands/author-commits.ts'
import commitActivity from './commands/commit-activity.ts'
import rawLog from './commands/raw-log.ts'

program.name(pkg.name).description(pkg.description).version(pkg.version)

program
    .command('author-commits')
    .description('See the commits per author in a repository')
    .argument('<repo>', 'Repository URL or path')
    .option(
        '-o, --output <file>',
        'Output PNG/JPEG/WEBP file',
        './commits-per-author.png'
    )
    .option(
        '-m, --max <authors>',
        'Maximum number of authors displayed in the graph',
        '50'
    )
    .action(async (repo, options) => {
        await authorCommits(repo, options.output, options.max)
    })

program
    .command('commit-activity')
    .description(
        'Compare commit activity over time across multiple repositories'
    )
    .argument('<repos...>', 'Repository URL(s) or path(s)')
    .option('-o, --output <file>', 'Output PNG file', './commit-activity.png')
    .option(
        '-i, --interval <interval>',
        'Aggregation interval: "day", "month", or "year"',
        'month'
    )
    .action(async (repos, options) => {
        await commitActivity(repos, options.output, options.interval)
    })

program
    .command('raw-log')
    .description('Get raw JSON commit log for a repository')
    .argument('<repo>', 'Repository URL or path')
    .option('-o, --output <file>', 'Output JSON file', './repo-log.json')
    .option('--pretty', 'Pretty print JSON output', false)
    .action(async (repo, options) => {
        await rawLog(repo, options.output, options.pretty)
    })

program
    .command('author-activity')
    .description('Compare author activity over time for a repository')
    .argument('<repo>', 'Repository URL or path')
    .option('-o, --output <file>', 'Output PNG file', './author-activity.png')
    .option(
        '-m, --max <authors>',
        'Maximum number of authors displayed in the graph',
        '10'
    )
    .option(
        '-i, --interval <interval>',
        'Aggregation interval: "day", "month", or "year"',
        'month'
    )
    .action(async (repo, options) => {
        await authorActivity(
            repo,
            options.output,
            options.max,
            options.interval
        )
    })

program.parse()

/*
// For now commented out as this is highly subject to change
// should i create separarte api/ folder?
export {
    createAuthorChart,
    createActivityChart,
    tempClone,
    getRepoLog,
    resolveRepoDir,
    cleanup
}
*/
