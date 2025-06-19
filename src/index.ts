import { program } from 'commander'
import pkg from '../package.json' with { type: 'json' }
import createAuthorChart from './author-commits.ts'

program.name(pkg.name).description(pkg.description).version(pkg.version)

program
    .command('author-commits')
    .description('Generate a commits per author chart')
    .argument('<repo>', 'Git repository URL') // TODO add support for local path and rework CLI to use mkdtemp
    .option(
        '-o, --output <file>',
        'Output PNG file',
        './commits-per-author.png'
    )
    .action(async (repo, options) => {
        await createAuthorChart(repo, options.output)
    })

program.parse()
