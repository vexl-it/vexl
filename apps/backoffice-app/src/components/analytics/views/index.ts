import {ActivityView} from './ActivityView'
import {ChatsView} from './ChatsView'
import {ClubsView} from './ClubsView'
import {FunnelView} from './FunnelView'
import {LiquidityView} from './LiquidityView'
import {NudgesView} from './NudgesView'
import {RetentionView} from './RetentionView'

export const ANALYTICS_VIEWS = [
  {
    slug: 'funnel',
    name: 'New-user funnel',
    question:
      'Do new installs get from first open to a first real action, and where do they drop?',
    View: FunnelView,
  },
  {
    slug: 'liquidity',
    name: 'Liquidity',
    question: 'Can people find anything where they live?',
    View: LiquidityView,
  },
  {
    slug: 'activity',
    name: 'Activity',
    question: 'How many installs actually use Vexl?',
    View: ActivityView,
  },
  {
    slug: 'retention',
    name: 'Retention & reactivation',
    question: 'Do people come back, and do dormant users return?',
    View: RetentionView,
  },
  {
    slug: 'clubs',
    name: 'Clubs → marketplace',
    question:
      'Do Clubs lead people into the main marketplace, or keep them away from it?',
    View: ClubsView,
  },
  {
    slug: 'nudges',
    name: 'Notifications & prompts',
    question: 'Do our nudges lead to real actions?',
    View: NudgesView,
  },
  {
    slug: 'chats',
    name: 'Chats → trades',
    question: 'Do conversations become trades?',
    View: ChatsView,
  },
] as const
