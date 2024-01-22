import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react'
import {type TextInput} from 'react-native'
import {Spinner, debounce} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Input from '../../Input'
import magnifyingGlass from '../../images/magnifyingGlass'
import {useLocationSearchMolecule} from '../molecule'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

function LoadingIndicator(): JSX.Element | null {
  const {isLoadingAtom} = useLocationSearchMolecule()
  const isLoading = useAtomValue(isLoadingAtom)

  if (isLoading) return <Spinner ml="$1" />
  return null
}

function LocationSearchInput(_: Props, ref: Ref<TextInput>): JSX.Element {
  const inputRef = useRef<TextInput>(null)
  useImperativeHandle<TextInput | null, TextInput | null>(
    ref,
    () => inputRef.current
  )
  const {t} = useTranslation()
  const store = useStore()
  const {searchQueryAtom} = useLocationSearchMolecule()
  const setSearchQuery = useSetAtom(searchQueryAtom)

  const setSearchQueryDebounce = useMemo(
    () =>
      debounce((text: string) => {
        setSearchQuery(text)
      }, 200),
    [setSearchQuery]
  )

  const [inputValue, setInputValue] = useState<string>(() =>
    store.get(searchQueryAtom)
  )

  function onInputValueChange(value: string): void {
    setInputValue(value)

    if (value.trim() === '') setSearchQuery('')
    else setSearchQueryDebounce(value)
  }

  function onClearPress(): void {
    setSearchQuery('')
    setInputValue('')
  }

  return (
    <Input
      ref={inputRef}
      autoFocus
      value={inputValue}
      onChangeText={onInputValueChange}
      textColor="$greyOnBlack"
      icon={magnifyingGlass}
      variant="greyOnBlack"
      rightElement={<LoadingIndicator />}
      placeholder={t('offerForm.location.addCityOrDistrict')}
      showClearButton={!!inputValue}
      onClearPress={onClearPress}
    />
  )
}

export default forwardRef<TextInput, Props>(LocationSearchInput)
