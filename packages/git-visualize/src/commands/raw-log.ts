import fs from 'node:fs'

import confirm from '@inquirer/confirm'

import { getRepoLog } from '../internal/git-utils.ts'

export default async function rawLog(
    repo: string,
    output: string,
    pretty: boolean
): Promise<void> {
    // Validate output file is a JSON
    if (!output.endsWith('.json')) {
        throw new Error('Output file must be a JSON')
    }

    const log = await getRepoLog(repo)

    if (
        fs.existsSync(output) &&
        (await confirm({ message: `Would you like to overwrite ${output}?` }))
    ) {
        await fs.promises.writeFile(
            output,
            JSON.stringify(log, null, pretty ? 2 : 0)
        )

        console.log(`Raw log written to ${output}`)
    }
}
