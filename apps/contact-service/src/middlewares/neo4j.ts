import {type Context, type Next} from 'koa'
import neo4j from 'neo4j-driver'
import {getEnvValue} from '../utils/getEnv'
import {type Session} from 'inspector'
import exitHook from 'exit-hook'

const NEO4J_URI = getEnvValue('NEO4J_URI')
const NEO4J_USERNAME = getEnvValue('NEO4J_USERNAME')
const NEO4J_PASS = getEnvValue('NEO4J_PASS')

const neo4jDriver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASS)
)

export default function createWithNeo4jSession(
  readonly: boolean = false
): (context: Context, next: Next) => Promise<void> {
  return async (context, next) => {
    let session
    try {
      session = neo4jDriver.session({
        defaultAccessMode: readonly ? 'READ' : 'WRITE',
      })
      context.state.neo4j = session
      await next()
    } catch (e) {
      // TODO better error handling
      context.status = 500
      context.body = {
        // code: 'DB_CONNECTION_ERROR',
        // message: 'Error acquiring database session',
      }
    } finally {
      await session?.close()
    }
  }
}

export function extractDb(ctx: Context): Session {
  if (!ctx.state.neo4J) throw new Error('No neo4J in state')
  return ctx.session.neo4j
}

exitHook(async () => {
  console.info('Closing neo4j driver')
  await neo4jDriver.close()
  console.info('Neo4j driver closed')
})
