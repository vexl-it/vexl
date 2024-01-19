import Button from '../../Button'
import {type PrimitiveAtom, useAtom} from 'jotai'

interface Props {
  isSelectedAtom: PrimitiveAtom<boolean>
  title: string
}

function ContactsFilterButton({isSelectedAtom, title}: Props): JSX.Element {
  const [isSelected, setIsSelected] = useAtom(isSelectedAtom)
  return (
    <Button
      text={title}
      onPress={() => {
        setIsSelected(!isSelected)
      }}
      variant={isSelected ? 'secondary' : 'blackOnDark'}
      size="small"
    />
  )
}

export default ContactsFilterButton
