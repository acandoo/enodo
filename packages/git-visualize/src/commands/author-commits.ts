import cliProgress from 'cli-progress'
import puppeteer, { type ImageFormat } from 'puppeteer'

import * as Plot from '@observablehq/plot'

import { createHTMLChart } from '../internal/create-html-chart.ts'
import { getRepoLog } from '../internal/git-utils.ts'

export default async function createAuthorChart(
    repo: string,
    output: string
): Promise<void> {
    const allowedFormats: ImageFormat[] = ['png', 'jpeg', 'webp']

    // Validate output file is an allowed format
    if (!allowedFormats.some((fmt) => output.endsWith(`.${fmt}`))) {
        throw new Error(
            `Output file must be one of: ${allowedFormats.map((f) => `.${f}`).join(', ')}`
        )
    }
    const coerced = output as `${string}.${ImageFormat}`

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
                existingAuthor.Commits += 1
            } else {
                authors.push({
                    Name: author.name,
                    Email: author.email,
                    Commits: 1
                })
            }
        })

    authors.splice(50) // Keep only top 50 authors

    // Create a horizontal bar chart

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const plot = createHTMLChart({
        // Titles not compatible with SVG output
        title: `Commits per Author (top ${authors.length})`,
        subtitle: `Repository: ${repo}`,
        grid: true,
        style: {
            backgroundColor: '#ddddef'
        },
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

    await page.setContent(plot)
    const chart = await page.waitForSelector('figure')

    await chart?.screenshot({ path: coerced })
    console.log(`Chart saved to '${output}'`)
    await browser.close()
}
