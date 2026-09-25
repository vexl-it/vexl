'use client'

import {
  type AnalyticsDashboard,
  type RegistrationWeek,
} from '@/src/services/analytics/domain'
import {
  ActivatedBy,
  ActivationClass,
} from '@vexl-next/analytics-definitions/src/definitions/registrationCohort'
import {Array, Option, pipe} from 'effect'
import {
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {CHART_AXIS, CHART_BLUE, CHART_GRID, CHART_SERIES} from '../chartTheme'
import {
  AXIS_TICK,
  categorySeries,
  categoryValues,
  CHART_MARGIN,
  ChartLegend,
  ChartSection,
  EmptyChart,
  formatCounts,
  formatShare,
  stackedBars,
  WeeklyTable,
  weekPoint,
} from './chartParts'
import {
  ACTIVATED_BY_LABELS,
  ACTIVATION_CLASS_LABELS,
  DAYS_LABELS,
} from './labels'

const classSeries = categorySeries(
  'class',
  ActivationClass,
  ACTIVATION_CLASS_LABELS,
  Array.take(CHART_SERIES, 3)
)
const bySeries = categorySeries(
  'by',
  ActivatedBy,
  ACTIVATED_BY_LABELS,
  pipe(CHART_SERIES, Array.drop(3), Array.take(2))
)

// A count pooled into Other reads as 0, so it yields no share at all.
const shareOf = (count: number, week: RegistrationWeek): number | null =>
  count > 0 ? count / week.instances : null

const activationRate = (week: RegistrationWeek): number | null =>
  shareOf(week.outcome.counts.completed, week)

const noObservedActivationShare = (week: RegistrationWeek): number | null =>
  week.provisional ? null : shareOf(week.outcome.counts.unknown, week)

const formatOptionalShare = (share: number | null): string =>
  share === null ? 'n/a' : formatShare(share)

export function ActivationChart({
  report,
  minGroupSize,
}: {
  readonly report: AnalyticsDashboard['registration']
  readonly minGroupSize: number
}) {
  const points = Array.map(report.weeks, (week, index) =>
    weekPoint(week, {
      ...categoryValues('class', week.activationClass),
      ...categoryValues('by', week.activatedBy),
      finalRate: week.provisional ? null : activationRate(week),
      provisionalRate:
        week.provisional ||
        pipe(
          Array.get(report.weeks, index + 1),
          Option.exists((next) => next.provisional)
        )
          ? activationRate(week)
          : null,
    })
  )

  return (
    <ChartSection
      title="Registration to activation by cohort week"
      description="Share of reporting instances whose first core action (offer or request) happened within 31 days of registration, by registration week. Dashed: provisional cohorts."
      hiddenWeeks={report.hiddenWeeks}
      minGroupSize={minGroupSize}
    >
      {Array.isNonEmptyReadonlyArray(points) ? (
        <>
          <p className="text-xs font-medium text-gray-500">
            Activation rate, share of enrolled reporting instances
          </p>
          <div className="mt-1 h-48">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{width: 640, height: 192}}
            >
              <LineChart
                data={points}
                syncId="registration-activation"
                margin={CHART_MARGIN}
              >
                <CartesianGrid vertical={false} stroke={CHART_GRID} />
                <XAxis dataKey="label" hide />
                <YAxis
                  width={48}
                  domain={[0, 1]}
                  tickFormatter={formatShare}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === 'number' ? formatShare(value) : '',
                    'activation rate',
                  ]}
                />
                <Line
                  dataKey="finalRate"
                  stroke={CHART_BLUE}
                  strokeWidth={2}
                  dot={{r: 4, fill: CHART_BLUE}}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="provisionalRate"
                  stroke={CHART_BLUE}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{r: 4, fill: '#ffffff'}}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-4 text-xs font-medium text-gray-500">
            Activated reporting instances, split by class (left bar) and by
            action (right bar)
          </p>
          <div className="mt-1">
            <ChartLegend series={[...classSeries, ...bySeries]} />
          </div>
          <div className="mt-1 h-56">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{width: 640, height: 224}}
            >
              <BarChart
                data={points}
                syncId="registration-activation"
                margin={CHART_MARGIN}
              >
                <CartesianGrid vertical={false} stroke={CHART_GRID} />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={{stroke: CHART_AXIS}}
                />
                <YAxis
                  width={48}
                  allowDecimals={false}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip cursor={{fill: CHART_GRID}} />
                {stackedBars(classSeries, points, 'class')}
                {stackedBars(bySeries, points, 'by')}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <WeeklyTable
            weeks={report.weeks}
            columns={[
              {
                header: 'Enrolled reporting instances',
                cell: (week) => String(week.instances),
              },
              {
                header: 'Activation rate',
                cell: (week) => formatOptionalShare(activationRate(week)),
              },
              {
                header: 'No observed activation (matured only)',
                cell: (week) =>
                  formatOptionalShare(noObservedActivationShare(week)),
              },
              {
                header: 'Registration to activation',
                cell: (week) =>
                  formatCounts(week.registrationToActivation, DAYS_LABELS),
              },
            ]}
          />
        </>
      ) : (
        <EmptyChart minGroupSize={minGroupSize} />
      )}
    </ChartSection>
  )
}
