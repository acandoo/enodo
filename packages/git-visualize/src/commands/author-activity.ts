import fs from 'node:fs'

import cliProgress from 'cli-progress'
import puppeteer, { type ImageFormat } from 'puppeteer'

import confirm from '@inquirer/confirm'
import * as Plot from '@observablehq/plot'

import { createHTMLChart } from '../internal/create-html-chart.ts'
import { getRepoLog } from '../internal/git-utils.ts'

export default async function authorActivity(
    repo: string,
    output: string,
    max: string,
    interval: string
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

    // Validate interval
    type AllowedIntervals = 'day' | 'month' | 'year'
    const allowedIntervals: AllowedIntervals[] = ['day', 'month', 'year']
    if (!allowedIntervals.includes(interval as AllowedIntervals)) {
        throw new Error(
            `Interval must be one of: ${allowedIntervals.map((f) => `"${f}"`).join(', ')}`
        )
    }
    const safeAllowed = interval as AllowedIntervals

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

    // Group commits by author and interval
    const authorCommits: {
        Date: Date
        Author: string
        _names: Set<string>
        _emails: Set<string>
        Commits: number
    }[] = []

    for (const entry of results) {
        const name = entry.commit.author.name
        const email = entry.commit.author.email
        const d = new Date(entry.commit.author.timestamp * 1000)
        let date: Date
        if (safeAllowed === 'day') {
            date = new Date(
                Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
            )
        } else if (safeAllowed === 'month') {
            date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
        } else {
            date = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        }
        const existing = authorCommits.find(
            (a) =>
                a.Date.getTime() === date.getTime() &&
                a._names.has(name) &&
                a._emails.has(email)
        )
        if (existing) {
            existing._names.add(name)
            existing._emails.add(email)
            existing.Commits++
        } else {
            authorCommits.push({
                Date: date,
                Author: name,
                _names: new Set<string>().add(name),
                _emails: new Set<string>().add(email),
                Commits: 1
            })
        }
    }

    authorCommits.sort((a, b) => a.Date.getTime() - b.Date.getTime())

    // Only show top N authors by total commits
    const authorTotals: Record<string, number> = {}
    for (const a of authorCommits) {
        authorTotals[a.Author] = (authorTotals[a.Author] ?? 0) + a.Commits
    }
    const topAuthors = Object.entries(authorTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxEntries)
        .map(([name]) => name)

    const filtered = authorCommits.filter((a) => topAuthors.includes(a.Author))

    // Create a multi-line chart (one line per author)
    console.log('Creating chart...')
    const plot = createHTMLChart({
        title: `Commits per Author Over Time (top ${maxEntries})`,
        subtitle: `Repository: ${repo}`,
        grid: true,
        color: { legend: true },
        marks: [
            Plot.ruleY([0]),
            Plot.lineY(filtered, {
                x: 'Date',
                y: 'Commits',
                stroke: 'Author'
            }),
            Plot.axisY({
                anchor: 'left',
                label: `Commits per ${safeAllowed}`,
                labelAnchor: 'top'
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
