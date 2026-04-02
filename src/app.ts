import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middlewares/auth'
import { usageRouter } from './modules/usage/usage.controller'

const app = express()

app.use(cors())
app.use(express.json())
app.use(authMiddleware)

app.use('/api/usage', usageRouter)

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})