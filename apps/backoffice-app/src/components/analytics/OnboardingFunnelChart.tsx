'use client'

import {type AnalyticsDashboard} from '@/src/services/analytics/domain'
import {OnboardingStep} from '@vexl-next/analytics-definitions/src/definitions/onboarding'
import {Array} from 'effect'
import {
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {CHART_AXIS, CHART_GRID, CHART_ORDINAL} from '../chartTheme'
import {
  AXIS_TICK,
  categorySeries,
  categoryValues,
  CHART_MARGIN,
  ChartLegend,
  ChartSection,
  EmptyChart,
  formatCounts,
  ordinalColors,
  stackedBars,
  WeeklyTable,
  weekPoint,
} from './chartParts'
import {
  CONTACTS_IMPORT_LABELS,
  DURATION_LABELS,
  ONBOARDING_STEP_LABELS,
  OUTCOME_LABELS,
} from './labels'

const series = categorySeries(
  'step',
  OnboardingStep,
  ONBOARDING_STEP_LABELS,
  ordinalColors(CHART_ORDINAL, OnboardingStep.literals.length)
)

export function OnboardingFunnelChart({
  report,
  minGroupSize,
}: {
  readonly report: AnalyticsDashboard['onboarding']
  readonly minGroupSize: number
}) {
  const points = Array.map(report.weeks, (week) =>
    weekPoint(week, categoryValues('step', week.step))
  )

  return (
    <ChartSection
      title="Onboarding funnel by cohort week"
      description="Latest onboarding step of each reporting instance, by the week of first app open. Instances that did not finish within 7 days plus grace are unknown, not churned."
      hiddenWeeks={report.hiddenWeeks}
      minGroupSize={minGroupSize}
    >
      {Array.isNonEmptyReadonlyArray(points) ? (
        <>
          <ChartLegend series={series} />
          <div className="mt-2 h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{width: 640, height: 288}}
            >
              <BarChart data={points} margin={CHART_MARGIN}>
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
                <Tooltip
                  cursor={{fill: CHART_GRID}}
                  formatter={(value, name) => [
                    `${String(value)} reporting instances`,
                    name,
                  ]}
                />
                {stackedBars(series, points, 'step')}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <WeeklyTable
            weeks={report.weeks}
            columns={[
              {
                header: 'Reporting instances',
                cell: (week) => String(week.instances),
              },
              {
                header: 'Outcome',
                cell: (week) => formatCounts(week.outcome, OUTCOME_LABELS),
              },
              {
                header: 'Contacts import',
                cell: (week) =>
                  formatCounts(week.contactsImport, CONTACTS_IMPORT_LABELS),
              },
              {
                header: 'First open to registration',
                cell: (week) =>
                  formatCounts(week.openToRegistration, DURATION_LABELS),
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
