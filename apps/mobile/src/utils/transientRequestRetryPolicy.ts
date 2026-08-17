import {Schedule} from 'effect'

export const transientRequestRetryPolicy = Schedule.exponential(500).pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(3))
)
