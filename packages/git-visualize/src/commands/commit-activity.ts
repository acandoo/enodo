import fs from 'node:fs'

import cliProgress from 'cli-progress'
import puppeteer, { type ImageFormat } from 'puppeteer'

import confirm from '@inquirer/confirm'
import * as Plot from '@observablehq/plot'

import { createHTMLChart } from '../internal/create-html-chart.ts'
import { getRepoLog, prettyURL } from '../internal/git-utils.ts'

export default async function commitActivity(
    repos: string[],
    output: string,
    interval: string
): Promise<void> {
    // Validate output file is an allowed format
    const allowedFormats: ImageFormat[] = ['png', 'jpeg', 'webp']
    if (!allowedFormats.some((fmt) => output.endsWith(`.${fmt}`))) {
        throw new Error(
            `Output file must be one of: ${allowedFormats.map((f) => `.${f}`).join(', ')}`
        )
    }

    // Ensure repos don't contain duplicates
    if (new Set(repos).size !== repos.length) {
        throw new Error('Duplicate repositories found in the input array')
    }

    // Handle interval option
    // (this type definition is not confusing at all)
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
    const results = await Promise.all(
        repos.map((repo) => getRepoLog(repo, multibar))
    )
    multibar.stop()
    console.clear()

    const commitTimes = results
        .map((repo, index) => {
            const repoCommits: {
                Date: Date
                Repo: string
                Commits: number
            }[] = []
            const prettyRepo = prettyURL(repos[index]!)
            for (const commit of repo) {
                const d = new Date(commit.commit.author.timestamp * 1000)
                let date: Date
                if (safeAllowed === 'day') {
                    date = new Date(
                        Date.UTC(
                            d.getUTCFullYear(),
                            d.getUTCMonth(),
                            d.getUTCDate()
                        )
                    )
                } else if (safeAllowed === 'month') {
                    date = new Date(
                        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
                    )
                } else {
                    date = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
                }

                const existingDate = repoCommits.find(
                    (a) => a.Date.getTime() === date.getTime()
                )
                if (existingDate) {
                    existingDate.Commits++
                } else {
                    repoCommits.push({
                        Date: date,
                        Commits: 1,
                        // TODO figure out if there are any edge cases for this
                        Repo: prettyRepo || repos[index]!
                    })
                }
            }
            repoCommits.sort((a, b) => a.Date.getTime() - b.Date.getTime())
            return repoCommits
        })
        .flat()

    // Create a horizontal bar chart
    const subtitleBeginning = repos.length === 1 ? 'Repository' : 'Repositories'

    console.log('Creating chart...')
    const plot = createHTMLChart({
        title: `Commit Activity Over Time`,
        subtitle: `${subtitleBeginning}: ${repos.join(', ')}`,
        grid: true,
        color: { legend: true },
        marks: [
            Plot.ruleY([0]),
            Plot.lineY(commitTimes, {
                x: 'Date',
                y: 'Commits',
                stroke: 'Repo'
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
        fs.existsSync(output) &&
        (await confirm({ message: `Would you like to overwrite ${output}?` }))
    ) {
        await chart?.screenshot({ path: output as `${string}.${ImageFormat}` })
        console.log(`Chart saved to '${output}'. Shutting down...`)
    }
    await browser.close()
}
