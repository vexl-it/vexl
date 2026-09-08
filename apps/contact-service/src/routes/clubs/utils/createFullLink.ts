import {type ClubCode} from '@vexl-next/domain/src/general/clubs'
import {Effect, String, type Config} from 'effect'
import {ClubLinkTemplateConfig} from '../../../configs'

export const createFullLink = (
  code: ClubCode
): Effect.Effect<string, Config.ConfigError> =>
  ClubLinkTemplateConfig.pipe(Effect.map(String.replace('{code}', code)))
