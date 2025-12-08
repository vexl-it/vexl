import {Option, pipe, Schema, String} from 'effect/index'
import {
  type ExpoNotificationToken,
  ExpoNotificationTokenE,
} from './ExpoNotificationToken.brand'

const EXPO_PREFIX = 'expo-'

export const VexlNotificationToken = Schema.String.pipe(
  Schema.brand('VexlNotificaitionToken'),
  Schema.filter(String.startsWith(EXPO_PREFIX))
)
export type VexlNotificationToken = typeof VexlNotificationToken.Type

export const vexlNotificationTokenToExpoToken = (
  vexlNotificationToken: VexlNotificationToken
): Option.Option<ExpoNotificationToken> => {
  return pipe(
    Option.some(vexlNotificationToken),
    Option.filter(String.startsWith(EXPO_PREFIX)),
    Option.map(String.replace(EXPO_PREFIX, '')),
    Option.flatMap(Schema.decodeOption(ExpoNotificationTokenE))
  )
}

export const vexlNotificationTokenFromExpoToken = (
  expoNotificationToken: ExpoNotificationToken
): VexlNotificationToken => {
  return pipe(
    String.concat(EXPO_PREFIX, expoNotificationToken),
    Schema.decodeSync(VexlNotificationToken)
  )
}
