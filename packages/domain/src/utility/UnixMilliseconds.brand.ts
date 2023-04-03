import {z} from 'zod'
export const UnixMilliseconds = z
  .number()
  .int()
  .positive()
  .brand<'UnixMilliseconds'>()
export type UnixMilliseconds = z.TypeOf<typeof UnixMilliseconds>

export function now(): UnixMilliseconds {
  return UnixMilliseconds.parse(Date.now())
}
