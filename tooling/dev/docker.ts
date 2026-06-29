/**
 * Thin wrappers around `docker compose -f docker-compose.dev.yaml ...` for the
 * infra + observability stack. All commands inherit stdio and receive the merged
 * env so `${VAR:-default}` substitutions in the compose file resolve.
 */
import {spawnSync} from 'node:child_process'
import {join} from 'node:path'
import {repoRoot} from './secrets'

export const composeFile = join(repoRoot, 'docker-compose.dev.yaml')

export type DockerEnv = Record<string, string | undefined>

const run = (args: readonly string[], env: DockerEnv): boolean => {
  const result = spawnSync('docker', ['compose', '-f', composeFile, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    env,
  })
  return result.status === 0
}

export const configValid = (env: DockerEnv): boolean =>
  run(['config', '-q'], env)

export const up = (
  env: DockerEnv,
  services: readonly string[],
  wait: boolean
): boolean => run(['up', '-d', ...(wait ? ['--wait'] : []), ...services], env)

export const runMinioInit = (env: DockerEnv): boolean =>
  run(['run', '--rm', 'minio-init'], env)

export const downWithVolumes = (env: DockerEnv): boolean =>
  run(['down', '-v'], env)

export const stop = (env: DockerEnv): boolean => run(['stop'], env)
