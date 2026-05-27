import {runBackofficeMigrations} from './src/server/slideshows/migrations'

export const registerNode = async (): Promise<void> => {
  await runBackofficeMigrations()
}
