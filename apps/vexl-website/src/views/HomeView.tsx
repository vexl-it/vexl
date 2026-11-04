'use client'

import React from 'react'
import {BottomCtaSection} from './home/BottomCtaSection'
import {CommunitySection} from './home/CommunitySection'
import {HeroSection} from './home/HeroSection'
import {NoKycSection} from './home/NoKycSection'
import {TradeSection} from './home/TradeSection'
import {TrustSection} from './home/TrustSection'

export function HomeView(): React.JSX.Element {
  return (
    <>
      <HeroSection />
      <TradeSection />
      <NoKycSection />
      <TrustSection />
      <CommunitySection />
      <BottomCtaSection />
    </>
  )
}
