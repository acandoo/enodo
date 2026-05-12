import assert from 'node:assert/strict'
import { suite, test } from 'node:test'

import type { ReadCommitResult } from 'isomorphic-git'

import { calculateRepoMetrics90d } from '../internal/repo-metrics.ts'

const DAY_IN_SECONDS = 24 * 60 * 60

const commitEntry = (
    timestamp: number,
    name: string,
    email: string
): ReadCommitResult =>
    ({
        commit: {
            author: {
                name,
                email,
                timestamp
            }
        }
    }) as ReadCommitResult

suite('calculateRepoMetrics90d', () => {
    test('computes expected 90-day metrics', () => {
        const now = new Date('2026-01-01T00:00:00.000Z')
        const nowTimestamp = Math.floor(now.getTime() / 1000)

        const commits: ReadCommitResult[] = [
            commitEntry(nowTimestamp - 10 * DAY_IN_SECONDS, 'Alice', 'a@x.com'),
            commitEntry(nowTimestamp - 20 * DAY_IN_SECONDS, 'Bob', 'b@x.com'),
            commitEntry(
                nowTimestamp - 25 * DAY_IN_SECONDS,
                'Alice Smith',
                'a@x.com'
            ),
            commitEntry(nowTimestamp - 100 * DAY_IN_SECONDS, 'Chris', 'c@x.com')
        ]
        const tagTimestamps = [
            nowTimestamp - 5 * DAY_IN_SECONDS,
            nowTimestamp - 15 * DAY_IN_SECONDS,
            nowTimestamp - 110 * DAY_IN_SECONDS
        ]

        const metrics = calculateRepoMetrics90d(commits, tagTimestamps, now)

        assert.equal(metrics.commits90d, 3)
        assert.equal(metrics.tags90d, 2)
        assert.equal(metrics.distinctContributors90d, 2)
        assert.equal(metrics.intervalCv90d, 0)
        assert.ok(metrics.commitsPerContributorCv90d !== null)
        assert.equal(
            metrics.commitsPerContributorCv90d?.toFixed(6),
            (1 / 3).toFixed(6)
        )
    })

    test('returns null coefficient values with insufficient data', () => {
        const now = new Date('2026-01-01T00:00:00.000Z')
        const nowTimestamp = Math.floor(now.getTime() / 1000)

        const commits: ReadCommitResult[] = [
            commitEntry(nowTimestamp - DAY_IN_SECONDS, 'Alice', 'a@x.com')
        ]

        const metrics = calculateRepoMetrics90d(commits, [], now)

        assert.equal(metrics.commits90d, 1)
        assert.equal(metrics.tags90d, 0)
        assert.equal(metrics.distinctContributors90d, 1)
        assert.equal(metrics.intervalCv90d, null)
        assert.equal(metrics.commitsPerContributorCv90d, null)
    })
})
