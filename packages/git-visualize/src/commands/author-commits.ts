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

    const plot = Plot.plot({
        // Titles not compatible with SVG output
        title: `Commits per Author (top ${authors.length})`,
        subtitle: `Repository: ${repo}`,
        document: new JSDOM('').window.document,
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
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #ddddef;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #222;
      margin: 0;
      padding: 2em;
    }
    figure {
      margin: 0 auto;
      box-shadow: 0 2px 12px #aaa4;
      border-radius: 8px;
      background: #ddddef;
      padding: 1em;
    }
    text {
      font-size: 1.1em;
      fill: #222;
    }
    .plot-title, .plot-subtitle {
      text-anchor: middle;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${plot.outerHTML}
</body>
</html>
`
    await page.setContent(html)
    const chart = await page.waitForSelector('figure')

    await chart?.screenshot({ path: coerced })
    console.log(`Chart saved to '${output}'`)
    await browser.close()
}
