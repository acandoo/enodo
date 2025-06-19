#!/bin/env node

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js'
import fs from 'node:fs'

const URL = 'https://github.com/octocat/Hello-World'
const DIRECTORY = process.argv[2] || './repo'

await git.clone({
    fs,
    http,
    dir: DIRECTORY, // local directory to clone into
    url: URL, // repository URL
})

const results = await git.log({
    fs,
    dir: DIRECTORY,
})

console.log(results)
