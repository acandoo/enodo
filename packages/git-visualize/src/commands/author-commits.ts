import fs from 'node:fs'

import cliProgress from 'cli-progress'
import puppeteer, { type ImageFormat } from 'puppeteer'

import confirm from '@inquirer/confirm'
import * as Plot from '@observablehq/plot'

import { createHTMLChart } from '../internal/create-html-chart.ts'
import { getRepoLog } from '../internal/git-utils.ts'

export default async function authorCommits(
    repo: string,
    output: string,
    max: string,
    filepath?: string
): Promise<void> {
    // Set maxEntries
    const maxEntries = parseInt(max, 10)

    // Validate output file is an allowed format
    const allowedFormats: ImageFormat[] = ['png', 'jpeg', 'webp']
    if (!allowedFormats.some((fmt) => output.endsWith(`.${fmt}`))) {
        throw new Error(
            `Output file must be one of: ${allowedFormats.map((f) => `.${f}`).join(', ')}`
        )
    }

    const multibar = new cliProgress.MultiBar(
        {
            hideCursor: true,
            format: ' {phase} | {bar} | {repo} | {percentage}%'
        },
        cliProgress.Presets.shades_classic
    )

    // Get all commits
    const results = await getRepoLog(repo, multibar, { filepath })

    multibar.stop()
    console.clear()

    type Author = {
        Name: string
        Email: string
        _names: Set<string>
        _emails: Set<string>
        Commits: number
    }
    const authors: Author[] = []

    // Count commits per author
    results
        .map((entry) => entry.commit.author)
        .forEach((author) => {
            // Check if author already exists in authors array
            const existingAuthor = authors.find(
                (a) => a._names.has(author.name) || a._emails.has(author.email)
            )
            if (existingAuthor) {
                existingAuthor._names.add(author.name)
                existingAuthor._emails.add(author.email)
                existingAuthor.Commits++
            } else {
                authors.push({
                    Name: author.name,
                    Email: author.email,
                    _names: new Set<string>().add(author.name),
                    _emails: new Set<string>().add(author.email),
                    Commits: 1
                })
            }
        })

    authors.splice(maxEntries) // Keep only top 50 (by default) authors

    // Create a horizontal bar chart

    console.log('Creating chart...')
    const plot = createHTMLChart({
        title: `Commits per Author (top ${authors.length})`,
        subtitle: `Repository: ${repo}`,
        grid: true,
        x: {
            tickFormat: (d) => (Number.isInteger(d) ? d : '')
        },
        y: {
            label: null
        },
        marginLeft: 200,
        marks: [
            Plot.barX(authors, {
                x: 'Commits',
                y: 'Name',
                fill: 'darkblue',
                sort: { y: '-x' }
            })
        ]
    })

    console.log('Rendering...')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(plot)
    const chart = await page.waitForSelector('figure')

    if (
        (fs.existsSync(output) &&
            (await confirm({
                message: `Would you like to overwrite ${output}?`
            }))) ||
        !fs.existsSync(output)
    ) {
        await chart?.screenshot({ path: output as `${string}.${ImageFormat}` })
        console.log(`Chart saved to '${output}'. Shutting down...`)
    }
    await browser.close()
}
