import SelectableCell from '../SelectableCell'
import useContent from './useContent'
import {type PaymentMethod as PaymentMethodType} from '@vexl-next/domain/dist/general/offers'
import {useAtom, useAtomValue} from 'jotai'
import {XStack} from 'tamagui'
import {useMolecule} from 'jotai-molecules'
import {offerFormStateMolecule} from '../../atoms/offerFormStateAtoms'

function PaymentMethod(): JSX.Element {
  const content = useContent()
  const {locationStateAtom, paymentMethodAtom} = useMolecule(
    offerFormStateMolecule
  )
  const [paymentMethod, setPaymentMethod] = useAtom(paymentMethodAtom)
  const locationState = useAtomValue(locationStateAtom)

  const onMethodCellPress = (methodType: PaymentMethodType): void => {
    if (
      locationState !== 'IN_PERSON' &&
      paymentMethod.includes(methodType) &&
      paymentMethod.length > 1
    ) {
      const selectedMethods = paymentMethod.filter(
        (method) => method !== methodType
      )
      setPaymentMethod(selectedMethods)
    } else if (!paymentMethod.includes(methodType)) {
      setPaymentMethod([...paymentMethod, methodType])
    }
  }

  if (locationState === 'IN_PERSON') {
    return (
      <SelectableCell
        key={content[locationState][0].type}
        fullWidth={false}
        selected={paymentMethod.includes(content[locationState][0].type)}
        onPress={onMethodCellPress}
        title={content[locationState][0].title}
        type={content[locationState][0].type}
      />
    )
  }

  return (
    <XStack space="$2" ai="center">
      {content.ONLINE.map((method) => (
        <SelectableCell
          key={method.type}
          fullWidth={false}
          selected={paymentMethod.includes(method.type)}
          onPress={onMethodCellPress}
          title={method.title}
          type={method.type}
        />
      ))}
    </XStack>
  )
}

export default PaymentMethod
