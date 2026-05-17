import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {type EditIdentityStackParamsList} from '../../navigationTypes'
import {prepareEditProfileIdentityDraftActionAtom} from './atoms/editIdentityAtoms'
import EditIdentityNicknameScreen from './components/EditIdentityNicknameScreen'
import EditIdentityPhotoScreen from './components/EditIdentityPhotoScreen'
import EditIdentitySummaryScreen from './components/EditIdentitySummaryScreen'

const Stack = createNativeStackNavigator<EditIdentityStackParamsList>()

function EditIdentityScreen(): React.ReactElement {
  const prepareDraft = useSetAtom(prepareEditProfileIdentityDraftActionAtom)

  useEffect(() => {
    prepareDraft()
  }, [prepareDraft])

  return (
    <Stack.Navigator
      initialRouteName="EditIdentityPhoto"
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="EditIdentityPhoto"
        component={EditIdentityPhotoScreen}
      />
      <Stack.Screen
        name="EditIdentityNickname"
        component={EditIdentityNicknameScreen}
      />
      <Stack.Screen
        name="EditIdentitySummary"
        component={EditIdentitySummaryScreen}
      />
    </Stack.Navigator>
  )
}

export default EditIdentityScreen
