import { Router } from 'express'
import { Octokit } from '@octokit/rest'

const router = Router()

router.get('/prs', async (req, res) => {
    const token = process.env.GITHUB_TOKEN
    const org = process.env.GITHUB_ORG
    const usernames = (process.env.TEAM_USERNAMES || '').split(',').map((u) => u.trim()).filter(Boolean)

    if (!token || !org) {
        return res.status(500).json({ error: 'GITHUB_TOKEN and GITHUB_ORG must be set in .env' })
    }

    const octokit = new Octokit({ auth: token })

    try {
        const results = await Promise.all(
            usernames.map(async (username) => {
                const { data } = await octokit.request('GET /search/issues', {
                    q: `org:${org} is:pr is:open review-requested:${username}`,
                    per_page: 1,
                })
                return { username, count: data.total_count }
            })
        )

        const prCounts = Object.fromEntries(results.map(({ username, count }) => [username, count]))
        res.json(prCounts)
    } catch (err) {
        console.error('GitHub API error:', err)
        res.status(502).json({ error: 'Failed to fetch data from GitHub API' })
    }
})

export default router
