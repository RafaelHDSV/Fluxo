import type { IncomingMessage, ServerResponse } from 'node:http'

/** Express app as Node request listener */
type AppListener = (req: IncomingMessage, res: ServerResponse) => unknown

let appPromise: Promise<AppListener> | null = null

function loadApp(): Promise<AppListener> {
  if (!appPromise) {
    // api/*.ts is launched as CJS on Vercel; backend is ESM ("type": "module").
    // Dynamic import() is required — static import becomes require() and throws ERR_REQUIRE_ESM.
    appPromise = import('../backend/src/app.js').then((mod) => mod.default as AppListener)
  }
  return appPromise
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await loadApp()
  return app(req, res)
}
