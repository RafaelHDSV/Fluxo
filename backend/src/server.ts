import cors from 'cors'
import express from 'express'
import connectDatabase from './config/database.js'
import { PORT } from './globals/Config.js'
import healthRoutes from './routes/healthRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

await connectDatabase()

app.get('/', (_req, res) => {
  res.send('Back-end funcionando com sucesso!')
})

app.use(healthRoutes)

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
