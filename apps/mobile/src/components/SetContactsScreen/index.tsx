import useSafeGoBack from '../../utils/useSafeGoBack'
import ContactsListSelect from '../ContactListSelect'
import Button from '../Button'
import {useTranslation} from '../../utils/localization/I18nProvider'
import ScreenTitle from '../ScreenTitle'
import Screen from '../Screen'
import {useCallback} from 'react'
import {Stack} from 'tamagui'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'

function SetContactsScreen(): JSX.Element {
  const goBack = useSafeGoBack()
  const {t} = useTranslation()

  const renderButton = useCallback(
    ({onSubmit}: {onSubmit: () => void}) => {
      return (
        <Stack mt={'$2'}>
          <Button
            variant={'secondary'}
            onPress={onSubmit}
            fullWidth
            text={t('common.submit')}
          />
        </Stack>
      )
    },
    [t]
  )

  return (
    <>
      <Screen>
        <ScreenTitle p={'$2'} text={t('loginFlow.importContacts.action')}>
          <IconButton variant="dark" icon={closeSvg} onPress={goBack} />
        </ScreenTitle>
        <Stack f={1} mx={'$2'}>
          <ContactsListSelect
            onContactsSubmitted={goBack}
            renderFooter={renderButton}
          />
        </Stack>
      </Screen>
    </>
  )
}

export default SetContactsScreen
