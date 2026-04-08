import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
    const usernames = (process.env.TEAM_USERNAMES || '')
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean)
    res.json({ usernames, org: process.env.GITHUB_ORG || '' })
})

export default router
