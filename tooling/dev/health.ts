/**
 * Readiness checks. A backend service is ready when its HEALTH_PORT `ok`
 * endpoint responds; web apps either expose a health route or are probed with a
 * plain TCP connect on their port.
 */
import {connect} from 'node:net'
import {type EnvContext, type RunnableApp} from './services'

export type ReadinessTarget =
  | {readonly kind: 'http'; readonly url: string}
  | {readonly kind: 'tcp'; readonly host: string; readonly port: number}

export function readinessTarget(
  app: RunnableApp,
  ctx: EnvContext
): ReadinessTarget {
  const host = ctx.cfg.infra.host

  if (app.healthPortKey !== undefined) {
    return {
      kind: 'http',
      url: `http://${host}:${ctx.healthPorts[app.healthPortKey]}/`,
    }
  }
  if (app.name === 'backoffice-app') {
    return {
      kind: 'http',
      url: `http://${host}:${ctx.ports.backofficeApp}/api/health`,
    }
  }
  if (app.name === 'dashboard-app') {
    return {
      kind: 'http',
      url: `http://${host}:${ctx.ports.dashboardHealth}/`,
    }
  }
  // web-app and any other web app: plain TCP connect.
  return {kind: 'tcp', host, port: ctx.ports[app.portKey]}
}

async function httpReady(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  try {
    const response = await fetch(url, {signal: controller.signal})
    // Any HTTP response means the server is accepting connections.
    return response.status > 0
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function tcpReady(
  host: string,
  port: number,
  timeoutMs: number
): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = connect({host, port})
    const done = (ok: boolean): void => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => {
      done(true)
    })
    socket.once('timeout', () => {
      done(false)
    })
    socket.once('error', () => {
      done(false)
    })
  })
}

export async function checkOnce(
  target: ReadinessTarget,
  timeoutMs: number
): Promise<boolean> {
  return target.kind === 'http'
    ? await httpReady(target.url, timeoutMs)
    : await tcpReady(target.host, target.port, timeoutMs)
}

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function waitUntilReady(
  target: ReadinessTarget,
  options: {timeoutMs: number; intervalMs: number}
): Promise<boolean> {
  const deadline = Date.now() + options.timeoutMs
  while (Date.now() < deadline) {
    if (await checkOnce(target, options.intervalMs)) return true
    await delay(options.intervalMs)
  }
  return false
}
