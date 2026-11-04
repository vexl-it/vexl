'use client'

import {Button, Download, PageSection} from '@vexl-next/ui'
import React from 'react'
import {useLocale} from '../components/LocaleProvider'
import {PageHero} from '../components/PageHero'
import {SiteLink} from '../components/SiteLink'

const AUDIT_REPORT_PATH = '/files/vexl-mobile-app-pentest-report.pdf'

export function AuditView(): React.JSX.Element {
  const {t} = useLocale()
  return (
    <PageSection alignItems="center" minHeight="50vh" justifyContent="center">
      <PageHero title={t.audit.title} />
      <SiteLink href={AUDIT_REPORT_PATH}>
        <Button role="none" icon={Download}>
          {t.audit.download}
        </Button>
      </SiteLink>
    </PageSection>
  )
}
