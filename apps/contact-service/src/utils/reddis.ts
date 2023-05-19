import {getEnvValue} from './getEnv'
import redis from 'redis'
import exitHook from 'exit-hook'

const REDIS_URI = getEnvValue('REDIS_URI')
const redisClient = redis.createClient({url: REDIS_URI})

console.info('Connecting redis')
await redisClient.connect()
console.info('Redis connected')

exitHook(() => {
  void redisClient.disconnect()
  console.info('Redis disconnected')
})

export default redisClient
