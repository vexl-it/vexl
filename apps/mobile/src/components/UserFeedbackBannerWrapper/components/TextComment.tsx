import {useAtom} from 'jotai'
import Input from '../../Input'
import {getTokens, Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'

const MAX_INPUT_LENGTH = 200
function TextComment(): JSX.Element {
  const {t} = useTranslation()
  const {textCommentAtom} = useMolecule(feedbackMolecule)

  const [textComment, setTextComment] = useAtom(textCommentAtom)

  return (
    <Stack w={'100%'} height={150} px={'$2'} pb={'$2'} br="$4" bc="$grey">
      <Stack f={1}>
        <Input
          placeholder={t('messages.typeSomething')}
          placeholderTextColor={getTokens().color.greyOnBlack.val}
          maxLength={MAX_INPUT_LENGTH}
          multiline
          textAlignVertical="top"
          numberOfLines={10}
          variant="transparentOnGrey"
          value={textComment}
          onChangeText={setTextComment}
        />
      </Stack>
      <Stack als="flex-end">
        <Text
          col="$white"
          fos={16}
          ff="$body600"
        >{`${textComment.length}/${MAX_INPUT_LENGTH}`}</Text>
      </Stack>
    </Stack>
  )
}

export default TextComment
