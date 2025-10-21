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

export const CreateChallengeEndpoint = HttpApiEndpoint.post(
  'createChallenge',
  '/api/v1/challenges'
)
  .setPayload(CreateChallengeRequest)
  .addSuccess(CreateChallengeResponse)

export const CreateChallengeBatchEndpoint = HttpApiEndpoint.post(
  'createChallengeBatch',
  '/api/v1/challenges/batch'
)
  .setPayload(CreateChallengesRequest)
  .addSuccess(CreateChallengesResponse)

export const ChallengeApiGroup = HttpApiGroup.make('Challenges')
  .add(CreateChallengeEndpoint)
  .add(CreateChallengeBatchEndpoint)

export const ChallengeApiSpecification = HttpApi.make('Challenge API')
  .add(ChallengeApiGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)
