import {z} from 'zod'
export const UnixMilliseconds = z
  .number()
  .int()
  .positive()
  .brand<'UnixMilliseconds'>()
export type UnixMilliseconds = z.TypeOf<typeof UnixMilliseconds>
