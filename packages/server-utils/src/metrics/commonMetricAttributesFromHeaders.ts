import {type CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {Option} from 'effect'

export interface CommonMetricAttributes {
  readonly [key: string]: string | number | boolean
  readonly appVersion: string
  readonly appVersionCode: number | 'unknown'
  readonly appPlatform: string
  readonly appSource: string
  readonly clientCountryPrefix: number | 'none'
}

export const commonMetricAttributesFromHeaders = (
  headers: CommonHeaders
): CommonMetricAttributes => ({
  appVersion: Option.getOrElse(headers.clientSemverOrNone, () => 'unknown'),
  appVersionCode: Option.getOrElse(
    headers.clientVersionOrNone,
    () => 'unknown'
  ),
  appPlatform: Option.getOrElse(headers.clientPlatformOrNone, () => 'unknown'),
  appSource: Option.getOrElse(headers.appSourceOrNone, () => 'unknown'),
  clientCountryPrefix: Option.getOrElse(headers.prefixOrNone, () => 'none'),
})
