import {Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import {Pressable} from 'react-native'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

const BulkSelectionContext = createContext<() => void>(() => {})

export function BulkSelectionProvider({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  const {toggleAllContactsToDisplayActionAtom} = useMolecule(
    contactSelectMolecule
  )
  const toggleAll = useSetAtom(toggleAllContactsToDisplayActionAtom)
  const cancelRef = useRef<(() => void) | undefined>(undefined)
  useEffect(() => () => cancelRef.current?.(), [])
  const onPress = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = toggleAll()
  }, [toggleAll])
  return (
    <BulkSelectionContext.Provider value={onPress}>
      {children}
    </BulkSelectionContext.Provider>
  )
}

export default function BulkSelectionButton(): React.JSX.Element | null {
  const {t} = useTranslation()
  const {
    areAllContactsToDisplaySelectedAtom,
    areThereAnyContactsToDisplayForSelectedTabAtom,
    isBulkSelectionPreparingAtom,
    isContactsPreparingAtom,
  } = useMolecule(contactSelectMolecule)
  const allSelected = useAtomValue(areAllContactsToDisplaySelectedAtom)
  const hasContacts = useAtomValue(
    areThereAnyContactsToDisplayForSelectedTabAtom
  )
  const isPreparing = useAtomValue(isContactsPreparingAtom)
  const isBulkPreparing = useAtomValue(isBulkSelectionPreparingAtom)
  const onPress = useContext(BulkSelectionContext)
  if (!hasContacts) return null
  const disabled = isPreparing || isBulkPreparing
  const label = t(
    allSelected
      ? 'postLoginFlow.contactsList.useNone'
      : 'postLoginFlow.contactsList.useAll'
  )
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
    >
      <Typography
        variant="descriptionBold"
        color="$accentHighlightPrimary"
        opacity={disabled ? 0.45 : 1}
      >
        {label}
      </Typography>
    </Pressable>
  )
}
