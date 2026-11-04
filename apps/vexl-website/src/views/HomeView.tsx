'use client'

import React from 'react'
import {BottomCtaSection} from './home/BottomCtaSection'
import {ClaimSection} from './home/ClaimSection'
import {FeaturesSection} from './home/FeaturesSection'
import {FoundationSection} from './home/FoundationSection'
import {HeroSection} from './home/HeroSection'
import {HowItWorksSection} from './home/HowItWorksSection'
import {NoKycSection} from './home/NoKycSection'
import {OpenSourceSection} from './home/OpenSourceSection'

export function HomeView(): React.JSX.Element {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <NoKycSection />
      <OpenSourceSection />
      <ClaimSection />
      <FoundationSection />
      <BottomCtaSection />
    </>
  )
}
