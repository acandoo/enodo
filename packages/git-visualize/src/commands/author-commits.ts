import cliProgress from 'cli-progress'
import puppeteer, { type ImageFormat } from 'puppeteer'

import * as Plot from '@observablehq/plot'

import { createHTMLChart } from '../internal/create-html-chart.ts'
import { getRepoLog } from '../internal/git-utils.ts'

export default async function createAuthorChart(
    repo: string,
    output: string,
    max: string
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
    const results = await getRepoLog(repo, multibar)

    multibar.stop()
    console.clear()

    type Author = {
        Name: string
        Email: string
        Commits: number
    }
    const authors: Author[] = []

    // Count commits per author
    results
        .map((entry) => entry.commit.author)
        .forEach((author) => {
            // Check if author already exists in authors array
            const existingAuthor = authors.find(
                (a) => a.Name === author.name && a.Email === author.email
            )
            if (existingAuthor) {
                existingAuthor.Commits++
            } else {
                authors.push({
                    Name: author.name,
                    Email: author.email,
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

    await chart?.screenshot({ path: output as `${string}.${ImageFormat}` })
    console.log(`Chart saved to '${output}'. Shutting down...`)
    await browser.close()
}
