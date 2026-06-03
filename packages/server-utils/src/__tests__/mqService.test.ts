import {Effect, Exit} from 'effect/index'
import {validateBullMqJobOptions} from '../mqService'

describe('validateBullMqJobOptions', () => {
  it('fails before BullMQ receives a custom job ID containing a colon', async () => {
    const result = await Effect.runPromiseExit(
      validateBullMqJobOptions({jobId: 'invalid:job-id'}, (character) => ({
        character,
      }))
    )

    expect(Exit.isFailure(result)).toBe(true)
  })

  it('allows custom job IDs without colons', async () => {
    const result = await Effect.runPromiseExit(
      validateBullMqJobOptions({jobId: 'valid-job-id'}, (character) => ({
        character,
      }))
    )

    expect(Exit.isSuccess(result)).toBe(true)
  })

  it('allows options without a custom job ID', async () => {
    const result = await Effect.runPromiseExit(
      validateBullMqJobOptions({}, (character) => ({character}))
    )

    expect(Exit.isSuccess(result)).toBe(true)
  })

  it('allows undefined options', async () => {
    const result = await Effect.runPromiseExit(
      validateBullMqJobOptions(undefined, (character) => ({character}))
    )

    expect(Exit.isSuccess(result)).toBe(true)
  })
})
