import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js' // TODO file issue upstream to fix their package.json

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

export default async function createAuthorChart(repo: string, output: string) {
    // Validate output file is a PNG
    if (!output.endsWith('.png')) {
        throw new Error('Output file must be a PNG')
    }

    // Check if repo is a valid URL or a local path
    let dir: string
    if (URL.canParse(repo) !== true) {
        dir = repo
        if (!fs.existsSync(dir)) {
            throw new Error(`Directory ${dir} does not exist`)
        }
        if (!fs.existsSync(join(dir, '.git'))) {
            throw new Error(`Directory ${dir} is not a Git repository`)
        }
    } else {
        // If a URL, clone the repo to a temp directory
        dir = await fsp.mkdtemp(join(tmpdir(), 'repo-'))

        await git.clone({
            fs,
            http,
            dir,
            url: repo,
            onProgress: (event) => {
                if (event.loaded) {
                    if (event.phase === 'Analyzing workdir') {
                        console.log(`${event.phase}: ${event.loaded}`)
                        return
                    }
                    console.log(
                        `${event.phase}: ${Math.round((event.loaded / event.total) * 100)}%`
                    )
                }
            },
            onMessage: (message) => console.log(`Message: ${message}`),
            singleBranch: true
        })

        console.log('Cloned!')
    }

    // Get all commits
    const results = await git.log({
        fs,
        dir
    })

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
            labels: authors.map((author) => author.name),
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
    await fsp.writeFile(output, pngBuffer)
    chart.destroy()
}
