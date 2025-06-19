#!/bin/env node

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js'
import fs from 'node:fs'

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
            // I have no clue why but the total is double the actual size
            console.log(
                `${event.phase}: ${Math.round((event.loaded / event.total) * 50)}%`
            )
        }
    },
    onMessage: (message) => console.log(`Message: ${message}`),
    singleBranch: true,
})

const results = await git.log({
    fs,
    dir: DIRECTORY,
})

console.log('Cloned!')

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

authors.sort((a, b) => b.commits - a.commits)

console.log(authors)
