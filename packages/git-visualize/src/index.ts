import { program } from '@commander-js/extra-typings'

import pkg from '../package.json' with { type: 'json' }
import createAuthorChart from './commands/author-commits.ts'
import createActivityChart from './commands/commit-activity.ts'
import createRawLog from './commands/raw-log.ts'

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
        await createAuthorChart(repo, options.output, options.max)
    })

program
    .command('commit-activity')
    .description(
        'Compare commit activity over time across multiple repositories'
    )
    .argument('<repos...>', 'Repository URL(s) or path(s)')
    .option('-o, --output <file>', 'Output PNG file', './commit-activity.png')
    .action(async (repos, options) => {
        await createActivityChart(repos, options.output)
    })

program
    .command('raw-log')
    .description('Get raw JSON commit log for a repository')
    .argument('<repo>', 'Repository URL or path')
    .option('-o, --output <file>', 'Output JSON file', './repo-log.json')
    .option('--pretty', 'Pretty print JSON output', false)
    .action(async (repo, options) => {
        await createRawLog(repo, options.output, options.pretty)
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
