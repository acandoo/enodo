import fs from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import git, {
    type MessageCallback,
    type ProgressCallback
} from 'isomorphic-git'
import http from 'isomorphic-git/http/node'

interface TempCloneOptions {
    url: string
    ref?: string
    onProgress?: ProgressCallback
    onMessage?: MessageCallback
}

export async function tempClone({
    url,
    ref,
    onProgress = ({ phase, loaded, total }) => {
        if (!loaded) return
        if (total) {
            console.log(`${phase}: ${Math.round((loaded / total) * 100)}%`)
        }
    },
    onMessage = console.log
}: TempCloneOptions): Promise<string> {
    const dir = await fs.promises.mkdtemp(join(tmpdir(), 'repo-'))

    await git.clone({
        fs,
        http,
        dir,
        url,
        ref,
        onProgress,
        onMessage,
        singleBranch: true
    })

    return dir
}
