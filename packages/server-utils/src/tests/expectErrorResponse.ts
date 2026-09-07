import {Result, Schema} from 'effect'

export const expectErrorResponse =
  <S extends Schema.Constraint>(response: S) =>
  (failedResponse: Result.Result<unknown, unknown>): void => {
    expect(failedResponse._tag).toEqual('Failure')
    if (Result.isFailure(failedResponse)) {
      expect(Schema.is(response)(failedResponse.failure)).toBe(true)
    }
  }
