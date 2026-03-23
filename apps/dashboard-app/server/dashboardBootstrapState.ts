import {Context, Effect, Layer, Stream, SubscriptionRef} from 'effect'
import {DashboardBootstrappingMessage} from '../common/ServerMessage'

type DashboardBootstrapStatus =
  | {
      status: 'loading'
      message: string
    }
  | {
      status: 'ready'
      message: string
    }

const initialStatus: DashboardBootstrapStatus = {
  status: 'loading',
  message: 'Loading dashboard data',
}

export class DashboardBootstrapState extends Context.Tag(
  'DashboardBootstrapState'
)<
  DashboardBootstrapState,
  SubscriptionRef.SubscriptionRef<DashboardBootstrapStatus>
>() {
  static readonly Live = Layer.effect(
    DashboardBootstrapState,
    SubscriptionRef.make(initialStatus)
  )
}

const toMessage = (
  status: DashboardBootstrapStatus
): DashboardBootstrappingMessage => new DashboardBootstrappingMessage(status)

const loadingStatus = (message: string): DashboardBootstrapStatus => ({
  status: 'loading',
  message,
})

const readyStatus = (): DashboardBootstrapStatus => ({
  status: 'ready',
  message: 'Dashboard data ready',
})

export const setDashboardBootstrappingMessage = (
  message: string
): Effect.Effect<void, never, DashboardBootstrapState> =>
  DashboardBootstrapState.pipe(
    Effect.flatMap((state) =>
      SubscriptionRef.set(state, loadingStatus(message))
    )
  )

export const setDashboardReady = DashboardBootstrapState.pipe(
  Effect.flatMap((state) => SubscriptionRef.set(state, readyStatus()))
)

export const getDashboardBootstrapMessage = DashboardBootstrapState.pipe(
  Effect.flatMap(SubscriptionRef.get),
  Effect.map(toMessage)
)

export const isDashboardReady = DashboardBootstrapState.pipe(
  Effect.flatMap(SubscriptionRef.get),
  Effect.map((status) => status.status === 'ready')
)

export const dashboardBootstrapMessages = DashboardBootstrapState.pipe(
  Effect.map((state) => state.changes),
  Stream.unwrap,
  Stream.map(toMessage),
  Stream.changes
)
