import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Input from '../../Input'
import {type SetStateAction, useAtom, type WritableAtom} from 'jotai'

const MAX_INPUT_LENGTH = 140

interface Props {
  offerDescriptionAtom: WritableAtom<string, [SetStateAction<string>], void>
}

function Description({offerDescriptionAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const [offerDescription, setOfferDescription] = useAtom(offerDescriptionAtom)

  const handleInputChange = (text: string): void => {
    setOfferDescription(text)
  }
  return (
    <Stack>
      <Text ff="$body600" fos={16} col="$greyOnBlack">
        {t('offerForm.description.writeWhyPeopleShouldTake')}
      </Text>
      <Stack mt="$4" br="$4" p="$4" bc="$grey">
        <Input
          maxLength={MAX_INPUT_LENGTH}
          multiline
          textAlignVertical="top"
          numberOfLines={5}
          variant="transparentOnGrey"
          value={offerDescription}
          onChangeText={handleInputChange}
        />
        <Stack ai="flex-end">
          <Text
            col="$white"
            fos={16}
            ff="$body600"
          >{`${offerDescription.length}/${MAX_INPUT_LENGTH}`}</Text>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default Description
