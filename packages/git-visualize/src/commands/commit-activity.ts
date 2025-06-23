import fs from 'node:fs'

import cliProgress from 'cli-progress'
import { getRepoLog } from '../internal/git-utils.ts'
import {
    CategoryScale,
    Chart,
    Colors,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    SubTitle,
    Title
} from 'chart.js'
import { Canvas } from 'skia-canvas'

export default async function createActivityChart(
    repos: string[],
    output: string
): Promise<void> {
    // Validate output file is a PNG
    if (!output.endsWith('.png')) {
        throw new Error('Output file must be a PNG')
    }
    const multibar = new cliProgress.MultiBar(
        {
            hideCursor: true,
            format: ' {phase} | {bar} | {repo} | {percentage}%'
        },
        cliProgress.Presets.shades_classic
    )
    const results = await Promise.all(
        repos.map(async (repo) => getRepoLog(repo, multibar))
    )
    multibar.stop()
    // console.clear()
    results.forEach((repo, index) => {
        // Placeholder for processing each repository's commits
        console.log(`Repository ${repos[index]} has ${repo.length} commits`)
    })
    const commitTimes = results.map((repo) =>
        repo.map((commit) => ({
            year: new Date(commit.commit.author.timestamp * 1000).getFullYear(),
            month:
                new Date(commit.commit.author.timestamp * 1000).getMonth() + 1
        }))
    )

    // Reverse the commit times to have the most recent commits first
    commitTimes.reverse()

    // Year is the smallest "maximum" year across all repositories, minus the biggest "minimum" year
    // All repositories are already sorted by year, so only the first element is needed
    // If month is negative, decrease the year by 1

    // this code is in serious need of refactoring
    const range = {
        year:
            Math.min(...commitTimes.map((repo) => repo[0]?.year || Infinity)) -
            Math.max(
                ...commitTimes.map((repo) => repo.at(-1)?.year || -Infinity)
            ),
        month:
            Math.min(...commitTimes.map((repo) => repo[0]?.month || Infinity)) -
            Math.max(
                ...commitTimes.map((repo) => repo.at(-1)?.month || -Infinity)
            )
    }
    if (range.month < 0) {
        range.year -= 1
        range.month += 12
    }

    // const totalMonths = range.year * 12 + range.month

    console.log('Date range:', range)

    const width = 1920
    const height = 1080

    Chart.register(
        CategoryScale,
        Colors,
        LinearScale,
        LineController,
        LineElement,
        PointElement,
        SubTitle,
        Title
    )

    const canvas = new Canvas(width, height)
    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: results.map((_, index) => `Repo ${index + 1}`),
            datasets: results.map((repo, index) => ({
                label: repos[index],
                data: repo.map((commit) => commit.commit.author.name.length)
            }))
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Commit Activity Chart'
                },
                subtitle: {
                    display: true,
                    text: 'Activity across multiple repositories'
                }
            },
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Repositories'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Commits'
                    },
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: (value) => value.toString()
                    }
                }
            }
        }
    })

    // Save chart as PNG
    const pngBuffer = await canvas.toBuffer('png', { matte: 'white' })
    await fs.promises.writeFile(output, pngBuffer)
    console.log(`Chart saved to '${output}'`)
    chart.destroy()
}
