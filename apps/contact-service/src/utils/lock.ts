import Redlock, {type ExecutionResult} from 'redlock'
import redisClient from './reddis'

const redlock = new Redlock([redisClient])

export default async function lock(
  lockName: string,
  timeoutMS: number = 1000
): Promise<() => Promise<ExecutionResult>> {
  const lock = await redlock.acquire([lockName], timeoutMS)

  return async () => await lock.release()
}
