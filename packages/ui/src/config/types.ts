import type {config} from './tamagui.config'

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
