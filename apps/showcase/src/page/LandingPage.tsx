import {Typography, VexlTextGraphic, YStack} from '@vexl-next/ui'
import {useWindowDimensions} from 'react-native'
import {DemoSection} from './DemoSection'
import {SafetySection} from './SafetySection'

export function LandingPage(): React.JSX.Element {
  const narrow = useWindowDimensions().width < 600
  return (
    <YStack backgroundColor="$backgroundPrimary" minHeight="100vh">
      <header className="page-header page-width">
        <VexlTextGraphic variant="light" />
        <a className="page-link" href="https://vexl.it">
          <Typography variant="paragraphSmallBold" color="$accentYellowPrimary">
            Get Vexl
          </Typography>
        </a>
      </header>
      <main>
        <section className="page-hero page-width">
          <Typography
            variant="micro"
            color="$accentYellowPrimary"
            textTransform="uppercase"
          >
            See it in action
          </Typography>
          <h1 className="page-title">
            <Typography
              variant={narrow ? 'heading2' : 'heading1'}
              color="$foregroundPrimary"
            >
              Trade bitcoin with people your friends know
            </Typography>
          </h1>
          <Typography variant="paragraph" color="$foregroundSecondary">
            Vexl is a bitcoin marketplace built on your phone contacts. You
            trade with friends and friends of friends, chat end-to-end encrypted
            and stay anonymous until you choose to reveal yourself. Pick a demo
            and watch both phones.
          </Typography>
        </section>
        <DemoSection />
        <SafetySection />
      </main>
      <footer className="page-footer page-width">
        <Typography variant="description" color="$foregroundTertiary">
          The people, offers, prices and phone numbers in the demos are
          fictional.
        </Typography>
        <Typography variant="description" color="$foregroundTertiary">
          © Vexl
        </Typography>
      </footer>
    </YStack>
  )
}
