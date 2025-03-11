import {type ClubCode} from '@vexl-next/domain/src/general/clubs'
import {type ConfigError, Effect, String} from 'effect'
import {ClubLinkTemplateConfig} from '../../../configs'

export const createFullLink = (
  code: ClubCode
): Effect.Effect<string, ConfigError.ConfigError> =>
  ClubLinkTemplateConfig.pipe(Effect.map(String.replace('{code}', code)))
