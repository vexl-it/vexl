import {ConfigProvider, Effect, Layer} from 'effect'

export const testConfigProviderLayer = Layer.effect(
  ConfigProvider.ConfigProvider,
  Effect.sync(() => ConfigProvider.fromEnvRecord(process.env))
)
