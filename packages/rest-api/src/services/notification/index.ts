import {type CreateAxiosDefaults} from 'axios'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCallWithValidation,
  axiosCallWithValidationSchema,
  createAxiosInstanceWithAuthAndLogging,
  type ExtractLeftTE,
  type LoggingFunction,
} from '../../utils'
import {
  GetPublicKeyResponse,
  InvalidFcmCypherError,
  IssueNotificationResponse,
  SendingNotificationError,
  type IssueNotificationRequest,
} from './contract'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: number
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/'),
    },
    loggingFunction
  )

  return {
    getNotificationPublicKey: () => {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            url: '/cypher-public-key',
            method: 'get',
          },
          GetPublicKeyResponse
        )
      )
    },

    issueNotification(request: IssueNotificationRequest) {
      return pipe(
        axiosCallWithValidationSchema(
          axiosInstance,
          {
            url: '/issue-notification',
            method: 'post',
            data: request,
          },
          IssueNotificationResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError' && e.response.status === 400) {
            // TODO this can be written in a better way using schema unions. Let's keep it like this for now
            if (e.response.data._tag === 'InvalidFcmCypherError')
              return new InvalidFcmCypherError()
            if (e.response.data._tag === 'SendingNotificationError')
              return new SendingNotificationError({
                tokenInvalid: e.response.data.tokenInvalid === true,
              })
          }
          return e
        })
      )
    },
  }
}

export type NotificationPrivateApi = ReturnType<typeof privateApi>

export type ApiErrorFetchNotificationToken = ExtractLeftTE<
  ReturnType<NotificationPrivateApi['getNotificationPublicKey']>
>
