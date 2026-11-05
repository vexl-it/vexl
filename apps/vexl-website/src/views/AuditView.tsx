'use client'

import {
  Button,
  Divider,
  Download,
  KeyValueRow,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe, Record} from 'effect'
import React from 'react'
import {useLocale} from '../components/LocaleProvider'
import {PageHero} from '../components/PageHero'
import {SiteLink} from '../components/SiteLink'
import {externalLinks} from '../config/links'

const AUDIT_REPORT_PATH = '/files/vexl-mobile-app-pentest-report.pdf'

export function AuditView(): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.audit

  return (
    <PageSection alignItems="center">
      <PageHero title={copy.title} text={copy.text} />
      <YStack
        width="100%"
        maxWidth={720}
        gap="$5"
        padding="$7"
        borderRadius="$8"
        backgroundColor="$backgroundSecondary"
      >
        {pipe(
          Record.values(copy.facts),
          Array.map((fact, i) => (
            <YStack key={fact.label} gap="$5">
              {i > 0 ? <Divider /> : null}
              <KeyValueRow
                size="medium"
                label={fact.label}
                value={fact.value}
              />
            </YStack>
          ))
        )}
      </YStack>
      <Typography
        variant="paragraphSmall"
        color="$foregroundSecondary"
        textAlign="center"
        maxWidth={560}
      >
        {copy.note}
      </Typography>
      <XStack gap="$4" flexWrap="wrap" justifyContent="center">
        <SiteLink href={AUDIT_REPORT_PATH}>
          <Button role="none" icon={Download}>
            {copy.download}
          </Button>
        </SiteLink>
        <SiteLink href={externalLinks.github}>
          <Button role="none" variant="tertiary">
            {copy.code}
          </Button>
        </SiteLink>
      </XStack>
    </PageSection>
  )
}
