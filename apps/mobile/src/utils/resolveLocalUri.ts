import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Option, Schema} from 'effect/index'
import {Paths} from 'expo-file-system'
import {Platform} from 'react-native'

export default function resolveLocalUri(uri: UriString): UriString {
  if (Platform.OS === 'android') return uri

  if (!uri.startsWith('file://')) {
    return uri
  }

  if (!Paths.cache || !Paths.document) return uri

  const replaced = uri
    .replace(
      /file:\/\/\/.*?Containers\/Data\/Application\/[A-Z0-9-]+\/Documents\//,
      Paths.document.uri ?? ''
    )
    .replace(
      /file:\/\/\/.*?Containers\/Data\/Application\/[A-Z0-9-]+\/Library\/Caches\//,
      Paths.cache.uri ?? ''
    )

  const parsed = Schema.decodeUnknownOption(UriString)(replaced)
  if (Option.isNone(parsed)) return uri
  return parsed.value
}
