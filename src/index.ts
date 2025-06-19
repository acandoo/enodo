import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js'
import fs from 'node:fs'
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    LinearScale,
    SubTitle,
    Title,
} from 'chart.js'
import { Canvas } from 'skia-canvas'
import fsp from 'node:fs/promises'

const URL = process.argv[2] || 'https://github.com/octocat/Hello-World'
const DIRECTORY = process.argv[3] || './repo'

type Author = {
    name: string
    email: string
    commits: number
}

const authors: Author[] = []

await git.clone({
    fs,
    http,
    dir: DIRECTORY,
    url: URL,
    onProgress: (event) => {
        if (event.loaded) {
            if (event.phase === 'Analyzing workdir') {
                console.log(`${event.phase}: ${event.loaded}`)
                return
            }
            // I have no clue why but the total is double the actual size
            console.log(
                `${event.phase}: ${Math.round((event.loaded / event.total) * 100)}%`
            )
        }
    },
    onMessage: (message) => console.log(`Message: ${message}`),
    singleBranch: true,
})

console.log('Cloned!')

const results = await git.log({
    fs,
    dir: DIRECTORY,
})

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
            authors.push({ name: author.name, email: author.email, commits: 1 })
        }
    })

authors
    .sort((a, b) => {
        if (a.commits !== b.commits) return b.commits - a.commits
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
    })
    .splice(50) // Keep only top 50 authors

// Create a horizontal bar chart using Chart.js

const width = 600
const height = 1080

Chart.register([
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    SubTitle,
])

const canvas = new Canvas(width, height)
const chart = new Chart(canvas, {
    type: 'bar',
    data: {
        labels: authors.map((author) => author.name),
        datasets: [
            {
                label: 'Commits',
                data: authors.map((author) => author.commits),
            },
        ],
    },
    options: {
        indexAxis: 'y',
        plugins: {
            title: {
                display: true,
                text: 'Commits per Author (top 50)',
            },
            subtitle: {
                display: true,
                text: `Repository: ${URL}`,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    },
})

const pngBuffer = await canvas.toBuffer('png', { matte: 'white' })
await fsp.writeFile('commits-per-author.png', pngBuffer)
chart.destroy()
