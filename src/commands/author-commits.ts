import fs from 'node:fs'

import cliProgress from 'cli-progress'

import { getRepoLog } from '../internal/git-utils.js'

import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    LinearScale,
    SubTitle,
    Title
} from 'chart.js'
import { Canvas } from 'skia-canvas'

export default async function createAuthorChart(
    repo: string,
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

    // Sort authors by number of commits and name, descending
    authors
        .sort((a, b) => {
            if (a.commits !== b.commits) return b.commits - a.commits
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
            if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
            return 0
        })
        .splice(50) // Keep only top 50 authors

    // Create a horizontal bar chart

    const width = 600
    const height = 1080

    Chart.register([
        BarController,
        BarElement,
        CategoryScale,
        LinearScale,
        Title,
        SubTitle
    ])

    const canvas = new Canvas(width, height)
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: authors.map((author) => `${author.name} <${author.email}>`),
            datasets: [
                {
                    label: 'Commits',
                    data: authors.map((author) => author.commits)
                }
            ]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                title: {
                    display: true,
                    text: 'Commits per Author (top 50)'
                },
                subtitle: {
                    display: true,
                    text: `Repository: ${repo}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true
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
