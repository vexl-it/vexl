import {Stack, TextArea, tokens, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {feedbackMolecule} from '../atoms'

const MAX_INPUT_LENGTH = 200
const TEXT_AREA_HEIGHT =
  tokens.size[10].val + tokens.size[10].val + tokens.size[2].val

function TextComment(): React.ReactElement {
  const {t} = useTranslation()
  const {textCommentAtom} = useMolecule(feedbackMolecule)

  const [textComment, setTextComment] = useAtom(textCommentAtom)

  return (
    <Stack w="100%" gap="$3">
      <TextArea
        height={TEXT_AREA_HEIGHT}
        backgroundColor="$backgroundTertiary"
        borderRadius="$5"
        borderWidth={0}
        color="$foregroundPrimary"
        fontFamily="$body"
        fontSize="$4"
        fontWeight="500"
        lineHeight={24}
        maxLength={MAX_INPUT_LENGTH}
        multiline
        onChangeText={setTextComment}
        padding="$5"
        placeholder={t('messages.typeSomething')}
        placeholderTextColor="$foregroundSecondary"
        value={textComment}
        verticalAlign="top"
      />
      <Stack als="flex-end">
        <Typography variant="micro" color="$foregroundSecondary">
          {`${textComment.length}/${MAX_INPUT_LENGTH}`}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default TextComment
