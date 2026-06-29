import {type Secrets} from './secrets'
import {type EnvContext} from './services'

export const OBSERVABILITY_SERVICES: readonly string[] = [
  'loki',
  'tempo',
  'grafana',
]
export const INFRA_SERVICES: readonly string[] = ['postgres', 'redis', 'minio']

export function buildDockerEnv(
  ctx: EnvContext,
  secrets: Secrets
): Record<string, string | undefined> {
  const {infra} = ctx.cfg
  return {
    ...process.env,
    POSTGRES_USER: infra.postgres.user,
    POSTGRES_PASSWORD: infra.postgres.password,
    POSTGRES_DB: 'postgres',
    POSTGRES_PORT: String(ctx.ports.postgres),
    REDIS_PORT: String(ctx.ports.redis),
    MINIO_ROOT_USER: infra.minio.rootUser,
    MINIO_ROOT_PASSWORD: infra.minio.rootPassword,
    MINIO_API_PORT: String(ctx.ports.minioApi),
    MINIO_CONSOLE_PORT: String(ctx.ports.minioConsole),
    S3_BUCKET_NAME: infra.minio.bucket,
    GRAFANA_PORT: String(ctx.ports.grafana),
    LOKI_PORT: String(ctx.ports.loki),
    TEMPO_PORT: String(ctx.ports.tempo),
    TEMPO_OTLP_HTTP_PORT: String(ctx.ports.tempoOtlpHttp),
    TEMPO_OTLP_GRPC_PORT: String(ctx.ports.tempoOtlpGrpc),
    // Optional docker credentials from .env.local may override local defaults.
    ...secrets,
  }
}
