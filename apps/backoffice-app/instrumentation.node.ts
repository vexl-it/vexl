import {runBackofficeMigrations} from './src/server/migrations'

export const registerNode = async (): Promise<void> => {
  await runBackofficeMigrations()
}
