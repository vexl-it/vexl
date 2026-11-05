'use client'

import React from 'react'
import {BottomCta} from '../components/BottomCta'
import {CommunitySection} from './home/CommunitySection'
import {HeroSection} from './home/HeroSection'
import {HowItWorksSection} from './home/HowItWorksSection'
import {NoKycSection} from './home/NoKycSection'
import {TrustSection} from './home/TrustSection'

export function HomeView(): React.JSX.Element {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <NoKycSection />
      <TrustSection />
      <CommunitySection />
      <BottomCta />
    </>
  )
}
