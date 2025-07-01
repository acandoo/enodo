import cliProgress from 'cli-progress'
import puppeteer, { type ImageFormat } from 'puppeteer'

import * as Plot from '@observablehq/plot'

import { createHTMLChart } from '../internal/create-html-chart.ts'
import { getRepoLog, prettyURL } from '../internal/git-utils.ts'

export default async function createActivityChart(
    repos: string[],
    output: string
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
                const date = new Date(
                    d.getUTCFullYear(),
                    d.getUTCMonth(),
                    d.getUTCDate()
                )
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
            return repoCommits
        })
        .flat()

    // Create a horizontal bar chart
    const subtitleBeginning = repos.length === 1 ? 'Repository' : 'Repositories'

    console.log('Creating chart...')
    const plot = createHTMLChart({
        title: `Commit Activity Chart`,
        subtitle: `${subtitleBeginning}: ${repos.reduce(
            (prev, curr) => `${prev}, ${curr}`
        )}`,
        grid: true,
        color: { legend: true },
        marks: [
            Plot.ruleY([0]),
            Plot.lineY(commitTimes, {
                x: 'Date',
                y: 'Commits',
                stroke: 'Repo'
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
