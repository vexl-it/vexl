import React from 'react'
import PageWithNavigationHeader from '../../PageWithNavigationHeader'

export default function TradeChecklistFlowPageContainer({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return <PageWithNavigationHeader>{children}</PageWithNavigationHeader>
}
