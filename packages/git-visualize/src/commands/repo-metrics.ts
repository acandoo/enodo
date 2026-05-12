import fs from 'node:fs'

import confirm from '@inquirer/confirm'

import { getRepoMetrics90d } from '../internal/repo-metrics.ts'

export default async function repoMetrics(
    repo: string,
    output: string,
    pretty: boolean
): Promise<void> {
    if (!output.endsWith('.json')) {
        throw new Error('Output file must have a .json extension')
    }

    if (
        fs.existsSync(output) &&
        !(await confirm({ message: `Would you like to overwrite ${output}?` }))
    ) {
        return
    }

    const metrics = await getRepoMetrics90d(repo)
    await fs.promises.writeFile(
        output,
        JSON.stringify(metrics, null, pretty ? 2 : 0)
    )

    console.log(`Repository metrics written to ${output}`)
}
