import {isAuthDisabledInProduction} from './src/server/config'
import {runBackofficeMigrations} from './src/server/migrations'

export const registerNode = async (): Promise<void> => {
  // Next.js only logs a failing hook and keeps serving, so exit instead.
  if (isAuthDisabledInProduction()) {
    console.error(
      'BACKOFFICE_DISABLE_AUTH=true is not allowed in production. Refusing to start.'
    )
    process.exit(1)
  }
  await runBackofficeMigrations()
}
