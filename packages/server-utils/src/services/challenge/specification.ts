import {ServerSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  CreateChallengeRequest,
  CreateChallengeResponse,
  CreateChallengesRequest,
  CreateChallengesResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Api, ApiGroup} from 'effect-http'

export const CreateChallengeEndpoint = Api.post(
  'createChallenge',
  '/api/v1/challenges'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateChallengeRequest),
  Api.setResponseBody(CreateChallengeResponse)
)

export const CreateChallengeBatchEndpoint = Api.post(
  'createChallengeBatch',
  '/api/v1/challenges/batch'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(CreateChallengesRequest),
  Api.setResponseBody(CreateChallengesResponse)
)

export const ChallengeApiGroup = ApiGroup.make('Challenges').pipe(
  ApiGroup.addEndpoint(CreateChallengeEndpoint),
  ApiGroup.addEndpoint(CreateChallengeBatchEndpoint)
)

export const ChallengeApiSpecification = Api.make({
  title: 'Challenge API',
  version: '1.0.0',
}).pipe(Api.addGroup(ChallengeApiGroup))
