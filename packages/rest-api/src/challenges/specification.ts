import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  CreateChallengeRequest,
  CreateChallengeResponse,
  CreateChallengesRequest,
  CreateChallengesResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'

import {MaxExpectedDailyCall} from '@vexl-next/rest-api/src/MaxExpectedDailyCountAnnotation'

export const CreateChallengeEndpoint = HttpApiEndpoint.post(
  'createChallenge',
  '/api/v1/challenges'
)
  .setPayload(CreateChallengeRequest)
  .addSuccess(CreateChallengeResponse)
  .annotate(MaxExpectedDailyCall, 5000)

export const CreateChallengeBatchEndpoint = HttpApiEndpoint.post(
  'createChallengeBatch',
  '/api/v1/challenges/batch'
)
  .setPayload(CreateChallengesRequest)
  .addSuccess(CreateChallengesResponse)
  .annotate(MaxExpectedDailyCall, 5000)

export const ChallengeApiGroup = HttpApiGroup.make('Challenges')
  .add(CreateChallengeEndpoint)
  .add(CreateChallengeBatchEndpoint)

export const ChallengeApiSpecification = HttpApi.make('Challenge API')
  .add(ChallengeApiGroup)
  .addError(NotFoundError, {status: 404})
  .addError(UnexpectedServerError, {status: 500})
