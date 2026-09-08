import {Schedule} from 'effect'

export const transientRequestRetryPolicy = Schedule.max([
  Schedule.exponential(500).pipe(Schedule.jittered),
  Schedule.recurs(3),
])
