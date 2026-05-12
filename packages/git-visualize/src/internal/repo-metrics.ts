import fs from 'node:fs'

import git, { type ReadCommitResult } from 'isomorphic-git'

import { cleanup, resolveRepoDir } from './dir-utils.ts'

const NINETY_DAYS_IN_SECONDS = 90 * 24 * 60 * 60

export interface RepoMetrics90d {
    commits90d: number
    tags90d: number
    intervalCv90d: number | null
    distinctContributors90d: number
    commitsPerContributorCv90d: number | null
}

interface Contributor {
    names: Set<string>
    emails: Set<string>
    commits: number
}

const getNowTimestamp = (now: Date) => Math.floor(now.getTime() / 1000)

const coefficientOfVariation = (values: number[]): number | null => {
    if (values.length < 2) return null

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    if (mean === 0) return null

    const variance =
        values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
        values.length

    return Math.sqrt(variance) / mean
}

const getCommitTimestamps90d = (
    commits: ReadCommitResult[],
    windowStartTimestamp: number
) =>
    commits
        .map((entry) => entry.commit.author.timestamp)
        .filter((timestamp) => timestamp >= windowStartTimestamp)

const getContributorCommitCounts90d = (
    commits: ReadCommitResult[],
    windowStartTimestamp: number
) => {
    const contributors: Contributor[] = []

    for (const entry of commits) {
        const timestamp = entry.commit.author.timestamp
        if (timestamp < windowStartTimestamp) continue

        const { name, email } = entry.commit.author
        const existingContributor = contributors.find(
            (contributor) =>
                contributor.names.has(name) || contributor.emails.has(email)
        )

        if (existingContributor) {
            existingContributor.names.add(name)
            existingContributor.emails.add(email)
            existingContributor.commits++
            continue
        }

        contributors.push({
            names: new Set<string>().add(name),
            emails: new Set<string>().add(email),
            commits: 1
        })
    }

    return contributors.map((contributor) => contributor.commits)
}

const getTagTimestamps = async (dir: string): Promise<number[]> => {
    const tags = await git.listTags({ fs, dir })
    const timestamps: number[] = []

    for (const tag of tags) {
        const tagRef = `refs/tags/${tag}`
        const oid = await git.resolveRef({ fs, dir, ref: tagRef })
        const annotatedTagTimestamp = await git
            .readTag({ fs, dir, oid })
            .then((tagObject) => tagObject.tag.tagger.timestamp)
            .catch(() => null)
        if (annotatedTagTimestamp !== null) {
            timestamps.push(annotatedTagTimestamp)
            continue
        }

        const commit = await git.readCommit({ fs, dir, oid })
        timestamps.push(commit.commit.author.timestamp)
    }

    return timestamps
}

const getTagTimestamps90d = (
    tagTimestamps: number[],
    windowStartTimestamp: number
) => tagTimestamps.filter((timestamp) => timestamp >= windowStartTimestamp)

export function calculateRepoMetrics90d(
    commits: ReadCommitResult[],
    tagTimestamps: number[],
    now: Date = new Date()
): RepoMetrics90d {
    const nowTimestamp = getNowTimestamp(now)
    const windowStartTimestamp = nowTimestamp - NINETY_DAYS_IN_SECONDS

    const commitTimestamps90d = getCommitTimestamps90d(
        commits,
        windowStartTimestamp
    )
    const tagTimestamps90d = getTagTimestamps90d(
        tagTimestamps,
        windowStartTimestamp
    )
    const contributorCommitCounts90d = getContributorCommitCounts90d(
        commits,
        windowStartTimestamp
    )

    const allEventTimestamps90d = [...commitTimestamps90d, ...tagTimestamps90d]
        .sort((a, b) => a - b)
    const eventIntervals90d = allEventTimestamps90d
        .slice(1)
        .map((timestamp, index) => timestamp - allEventTimestamps90d[index]!)

    return {
        commits90d: commitTimestamps90d.length,
        tags90d: tagTimestamps90d.length,
        intervalCv90d: coefficientOfVariation(eventIntervals90d),
        distinctContributors90d: contributorCommitCounts90d.length,
        commitsPerContributorCv90d: coefficientOfVariation(
            contributorCommitCounts90d
        )
    }
}

export async function getRepoMetrics90d(
    repo: string,
    now: Date = new Date()
): Promise<RepoMetrics90d> {
    const dir = await resolveRepoDir(repo)
    try {
        const commits = await git.log({ fs, dir })
        const tagTimestamps = await getTagTimestamps(dir)
        return calculateRepoMetrics90d(commits, tagTimestamps, now)
    } finally {
        if (URL.canParse(repo)) {
            await cleanup(dir)
        }
    }
}
