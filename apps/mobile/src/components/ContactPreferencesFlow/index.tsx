import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {ScopeProvider} from 'bunshi/dist/react'
import React, {useCallback, useMemo, useState} from 'react'
import {type ContactPreferencesStackParamsList} from '../../navigationTypes'
import AddNewContactScreen from '../AddNewContactScreen'
import AddNewContactCountryPickerScreen from '../AddNewContactScreen/AddNewContactCountryPickerScreen'
import ContactPreferencesListScreen from './ContactPreferencesListScreen'
import {ContactsSelectScope} from './components/ContactListSelect/atom'

const Stack = createNativeStackNavigator<ContactPreferencesStackParamsList>()

export default function ContactPreferencesFlow(): React.ReactElement {
  const [, setReloadContacts] = useState(0)
  const reloadContacts = useCallback(() => {
    setReloadContacts((value) => value + 1)
  }, [])
  const contactsSelectScopeValue = useMemo(
    () => ({
      reloadContacts,
    }),
    [reloadContacts]
  )

  return (
    <ScopeProvider scope={ContactsSelectScope} value={contactsSelectScopeValue}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="ContactPreferencesList"
          component={ContactPreferencesListScreen}
        />
        <Stack.Screen name="AddNewContact" component={AddNewContactScreen} />
        <Stack.Screen
          name="AddNewContactCountryPicker"
          component={AddNewContactCountryPickerScreen}
        />
      </Stack.Navigator>
    </ScopeProvider>
  )
}
