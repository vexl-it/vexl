import {dotenvLoad} from 'dotenv-mono'
import {Console, Effect} from 'effect'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Find project root by looking for root package.json with workspaces
 */
export const findProjectRoot = (): string => {
  let dir = process.cwd()
  while (dir !== '/') {
    const pkgPath = path.join(dir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      if (pkg.workspaces) {
        return dir
      }
    }
    dir = path.dirname(dir)
  }
  throw new Error(
    'Could not find project root (no package.json with workspaces)'
  )
}

export class EnvLocalNotFound {
  readonly _tag = 'EnvLocalNotFound'
  constructor(
    readonly created: boolean,
    readonly path: string
  ) {}
}

/**
 * Ensures .env.local exists at project root.
 * If not, copies from .env.example and returns an error with instructions.
 */
export const ensureEnvLocalExists = Effect.gen(function* () {
  const projectRoot = findProjectRoot()
  const envLocalPath = path.join(projectRoot, '.env.local')
  const envExamplePath = path.join(projectRoot, '.env.example')

  if (fs.existsSync(envLocalPath)) {
    yield* Console.log(`Found .env.local at ${envLocalPath}`)
    return {exists: true as const, path: envLocalPath}
  }

  if (!fs.existsSync(envExamplePath)) {
    yield* Console.error('No .env.example found at project root')
    return yield* Effect.fail(new Error('Missing .env.example'))
  }

  fs.copyFileSync(envExamplePath, envLocalPath)
  yield* Console.log('')
  yield* Console.log('='.repeat(60))
  yield* Console.log('Created .env.local from .env.example')
  yield* Console.log('')
  yield* Console.log('Please fill in the required values in .env.local:')
  yield* Console.log(`  ${envLocalPath}`)
  yield* Console.log('')
  yield* Console.log('Required values:')
  yield* Console.log(
    '  - Security keys (SECRET_PUBLIC_KEY, SECRET_PRIVATE_KEY, etc.)'
  )
  yield* Console.log('  - External service credentials (if needed)')
  yield* Console.log('')
  yield* Console.log('Then run the command again.')
  yield* Console.log('='.repeat(60))
  yield* Console.log('')

  return yield* Effect.fail(new EnvLocalNotFound(true, envLocalPath))
})

/**
 * Loads environment variables from .env.local using dotenv-mono
 */
export const loadEnvLocal = Effect.gen(function* () {
  const projectRoot = findProjectRoot()

  // Load .env.local with dotenv-mono
  dotenvLoad({
    path: path.join(projectRoot, '.env.local'),
    depth: 0, // Only load from specified path, don't search
  })

  yield* Console.log('Loaded environment from .env.local')
})
