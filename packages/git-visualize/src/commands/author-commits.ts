import cliProgress from 'cli-progress'
import { JSDOM } from 'jsdom'
import puppeteer, { type ImageFormat } from 'puppeteer'

import * as Plot from '@observablehq/plot'

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
        name: string
        email: string
        commits: number
    }
    const authors: Author[] = []

    // Count commits per author
    results
        .map((entry) => entry.commit.author)
        .forEach((author) => {
            // Check if author already exists in authors array
            const existingAuthor = authors.find(
                (a) => a.name === author.name && a.email === author.email
            )
            if (existingAuthor) {
                existingAuthor.commits += 1
            } else {
                authors.push({
                    name: author.name,
                    email: author.email,
                    commits: 1
                })
            }
        })

    authors.splice(50) // Keep only top 50 authors

    // Create a horizontal bar chart

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const plot = Plot.plot({
        // Titles not compatible with SVG output
        title: 'Commits per Author (top 50)',
        subtitle: `Repository: ${repo}`,
        document: new JSDOM('').window.document,
        grid: true,
        style: {
            backgroundColor: '#ddddef'
        },
        y: {
            label: null
        },
        marginLeft: 90,
        marks: [
            Plot.barX(authors, {
                x: 'commits',
                y: 'name',
                fill: 'darkblue',
                sort: { y: '-x' }
            })
        ]
    })

    await page.setContent(plot.outerHTML)
    const chart = await page.waitForSelector('figure')

    await chart?.screenshot({ path: coerced })
    console.log(`Chart saved to '${output}'`)
    await browser.close()
}
