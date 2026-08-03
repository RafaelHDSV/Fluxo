import cors from 'cors'
import express from 'express'
import { ensureDatabase } from './config/database.js'
import { CORS_ORIGIN } from './globals/Config.js'
import healthRoutes from './routes/healthRoutes.js'
import accountsRoutes from './modules/accounts/accountsRoutes.js'
import categoriesRoutes from './modules/categories/categoriesRoutes.js'
import transactionsRoutes from './modules/transactions/transactionsRoutes.js'
import importsRoutes from './modules/imports/importsRoutes.js'
import budgetsRoutes from './modules/budgets/budgetsRoutes.js'
import goalsRoutes from './modules/goals/goalsRoutes.js'
import reportsRoutes from './modules/reports/reportsRoutes.js'
import wishlistRoutes from './modules/wishlist/wishlistRoutes.js'
import descriptionRulesRoutes from './modules/descriptionRules/descriptionRulesRoutes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '2mb' }))

  app.use(async (_req, _res, next) => {
    try {
      await ensureDatabase()
      next()
    } catch (error) {
      next(error)
    }
  })

  app.get('/', (_req, res) => {
    res.json({ name: 'Fluxo API', status: 'ok' })
  })

  app.use(healthRoutes)
  app.use('/api/accounts', accountsRoutes)
  app.use('/api/categories', categoriesRoutes)
  app.use('/api/transactions', transactionsRoutes)
  app.use('/api/imports', importsRoutes)
  app.use('/api/description-rules', descriptionRulesRoutes)
  app.use('/api/budgets', budgetsRoutes)
  app.use('/api/goals', goalsRoutes)
  app.use('/api/wishlist', wishlistRoutes)
  app.use('/api/reports', reportsRoutes)

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error', error instanceof Error ? error.message : 'unknown')
    res.status(500).json({ error: 'Erro interno' })
  })

  return app
}

const app = createApp()
export default app
