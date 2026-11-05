import {LabeledTextArea, Stack, tokens} from '@vexl-next/ui'
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
    <Stack w="100%">
      <LabeledTextArea
        maxLength={MAX_INPUT_LENGTH}
        minHeight={TEXT_AREA_HEIGHT}
        onChangeText={setTextComment}
        placeholder={t('messages.typeSomething')}
        value={textComment}
      />
    </Stack>
  )
}

export default TextComment
