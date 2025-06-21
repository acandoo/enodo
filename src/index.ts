import { program } from '@commander-js/extra-typings'
import pkg from '../package.json' with { type: 'json' }
import createAuthorChart from './commands/author-commits.ts'
import createActivityChart from './commands/commit-activity.ts'

program.name(pkg.name).description(pkg.description).version(pkg.version)

program
    .command('author-commits')
    .description('See the commits per author in a repository')
    .argument('<repo>', 'Repository URL or path')
    .option(
        '-o, --output <file>',
        'Output PNG file',
        './commits-per-author.png'
    )
    .action(async (repo, options) => {
        await createAuthorChart(repo, options.output)
    })

program
    .command('commit-activity')
    .description('Compare commit activity across multiple repositories')
    .argument('<repos...>', 'Repository URL(s) or path(s)')
    .option('-o, --output <file>', 'Output PNG file', './commit-activity.png')
    .action(async (repos, options) => {
        await createActivityChart(repos, options.output)
    })

program.parse()

export { createAuthorChart, createActivityChart }
