import fs from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'

interface TempCloneOptions {
    url: string
    ref?: string
}

export default async function tempClone({
    url,
    ref
}: TempCloneOptions): Promise<string> {
    const dir = await fs.promises.mkdtemp(join(tmpdir(), 'repo-'))

    await git.clone({
        fs,
        http,
        dir,
        url,
        ref,
        onProgress: ({ phase, loaded, total }) => {
            if (!loaded) return
            if (phase === 'Analyzing workdir') {
                console.log(`${phase}: ${loaded}`)
            } else if (total) {
                console.log(`${phase}: ${Math.round((loaded / total) * 100)}%`)
            }
        },
        onMessage: (message) => console.log(`Message: ${message}`),
        singleBranch: true
    })

    return dir
}
