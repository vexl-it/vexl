import {atom} from 'jotai'
import {type YStackProps} from 'tamagui'
import {useSessionAssumeLoggedIn} from '../../../../../state/session'
import openUrl from '../../../../../utils/openUrl'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

const text = `Vexl hledá COO!  🔥

Myslíš, že na to máš?
Pošli nám CV na COO@vexl.it  👀`

const visibleAtom = atom(true)

function VexlCooSuggestion(props: YStackProps): JSX.Element | null {
  const session = useSessionAssumeLoggedIn()

  if (
    !session.phoneNumber.startsWith('+420') &&
    !session.phoneNumber.startsWith('+421')
  ) {
    return null
  }
  return (
    <MarketplaceSuggestion
      buttonText="Jsem to já"
      onButtonPress={() => {
        openUrl(
          `mailto:coo@vexl.it?subject=Chci%20b%C3%BDt%20COO%20Vexlu&body=Ahoj%2C%20%0Achci%20se%20dozv%C4%9Bd%C4%9Bt%20v%C3%ADc%20o%20nab%C3%ADzen%C3%A9%20pozici.%20N%C3%AD%C5%BEe%20p%C5%99ikl%C3%A1d%C3%A1m%20CV%20a%20LinkedIn%20profil.`,
          'coo@vexl.it'
        )()
      }}
      text={text}
      visibleStateAtom={visibleAtom}
      {...props}
    />
  )
}

export default VexlCooSuggestion
