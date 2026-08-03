import app from './app.js'
import { PORT } from './globals/Config.js'

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
