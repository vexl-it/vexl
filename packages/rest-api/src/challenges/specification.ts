import {Schema} from 'effect'
import {HttpApi, HttpApiEndpoint, HttpApiGroup} from 'effect/unstable/httpapi'
import {commonApiErrors} from '../commonApiErrors'

import {MaxExpectedDailyCall} from '../MaxExpectedDailyCountAnnotation'
import {
  CreateChallengeRequest,
  CreateChallengeResponse,
  CreateChallengesRequest,
  CreateChallengesResponse,
} from './contracts'

export const CreateChallengeEndpoint = HttpApiEndpoint.post(
  'createChallenge',
  '/api/v1/challenges',
  {
    disableCodecs: true,
    payload: CreateChallengeRequest,
    error: Schema.Union([...commonApiErrors]),
    success: CreateChallengeResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

export const CreateChallengeBatchEndpoint = HttpApiEndpoint.post(
  'createChallengeBatch',
  '/api/v1/challenges/batch',
  {
    disableCodecs: true,
    payload: CreateChallengesRequest,
    error: Schema.Union([...commonApiErrors]),
    success: CreateChallengesResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

export const ChallengeApiGroup = HttpApiGroup.make('Challenges')
  .add(CreateChallengeEndpoint)
  .add(CreateChallengeBatchEndpoint)

export const ChallengeApiSpecification =
  HttpApi.make('Challenge API').add(ChallengeApiGroup)
