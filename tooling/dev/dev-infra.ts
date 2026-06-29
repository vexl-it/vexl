/**
 * Standalone infra starter for local development.
 *
 * Uses the same computed Docker environment as dev:backend so Compose variable
 * substitution is not affected by unrelated exported shell variables.
 */
import {Array, pipe} from 'effect'
import devConfig from '../../dev.config'
import * as docker from './docker'
import {
  buildDockerEnv,
  INFRA_SERVICES,
  OBSERVABILITY_SERVICES,
} from './docker-env'
import {resolvePorts} from './ports'
import {loadRawEnvLocal, loadSecrets} from './secrets'

const ctx = {
  cfg: devConfig,
  ports: resolvePorts(devConfig.ports, loadRawEnvLocal()),
  healthPorts: devConfig.healthPorts,
}
const dockerEnv = buildDockerEnv(ctx, loadSecrets())
const composeServices = [...INFRA_SERVICES, ...OBSERVABILITY_SERVICES]

if (!docker.configValid(dockerEnv)) {
  throw new Error(
    'docker-compose.dev.yaml failed to parse (docker compose config).'
  )
}

console.log(`Starting infra: ${pipe(composeServices, Array.join(', '))}`)
if (!docker.up(dockerEnv, composeServices, true)) {
  throw new Error('docker compose up failed for infra.')
}

console.log('Initializing MinIO bucket...')
if (!docker.runMinioInit(dockerEnv)) {
  console.warn('MinIO init returned non-zero (bucket may already exist).')
}
