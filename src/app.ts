import express from 'express'
import { authMiddleware } from './middlewares/auth'

const app = express()

app.use(express.json())
app.use(authMiddleware)

app.get('/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})