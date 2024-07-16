import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {useSetAtom, useStore} from 'jotai'
import React, {useEffect, useMemo, useState} from 'react'
import {Stack, XStack} from 'tamagui'
import {type ContactsTabParamsList} from '../../../../navigationTypes'
import {
  normalizedContactsAtom,
  resolveAllContactsAsSeenActionAtom,
} from '../../../../state/contacts/atom/contactsStore'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import Button from '../../../Button'
import NormalizeContactsWithLoadingScreen from '../../../NormalizeContactsWithLoadingScreen'
import WhiteContainer from '../../../WhiteContainer'
import {ContactsSelectScope, contactSelectMolecule} from './atom'
import FilteredContacts from './components/FilteredContactsWithProvider'
import SearchBar from './components/SearchBar'

const Tab = createMaterialTopTabNavigator<ContactsTabParamsList>()

function CustomTabBar({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps): JSX.Element {
  return (
    <XStack ai="center" space="$2" px="$4">
      {state.routes.map((route, index) => {
        // as any to solve ts error, that options does not exist
        const {options} = descriptors[route.key] as any
        const isFocused = state.index === index

        return (
          <Button
            testID={`@customTabBar/tab${route.name}`}
            key={options.tabBarLabel}
            onPress={() => {
              navigation.navigate(route.name, route.params)
            }}
            variant={isFocused ? 'secondary' : 'blackOnDark'}
            size="small"
            text={options.tabBarLabel}
          />
        )
      })}
    </XStack>
  )
}

function ContactsListSelect(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const {submitAllSelectedContactsActionAtom} = useMolecule(
    contactSelectMolecule
  )

  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const submitAllSelectedContacts = useSetAtom(
    submitAllSelectedContactsActionAtom
  )

  useEffect(() => {
    return () => {
      resolveAllContactsAsSeen()
    }
  }, [resolveAllContactsAsSeen])

  return (
    <>
      <WhiteContainer noPadding>
        <Stack f={1}>
          <SearchBar />
          <Tab.Navigator
            screenOptions={{
              animationEnabled: true,
            }}
            tabBar={CustomTabBar}
          >
            <Tab.Screen
              name="New"
              options={{
                tabBarLabel: t('postLoginFlow.contactsList.new'),
              }}
              initialParams={{filter: 'new'}}
              component={FilteredContacts}
            />
            <Tab.Screen
              name="NonSubmitted"
              options={{
                tabBarLabel: t('postLoginFlow.contactsList.nonSubmitted'),
              }}
              initialParams={{filter: 'nonSubmitted'}}
              component={FilteredContacts}
            />
            <Tab.Screen
              name="Submitted"
              options={{
                tabBarLabel: t('postLoginFlow.contactsList.submitted'),
              }}
              initialParams={{filter: 'submitted'}}
              component={FilteredContacts}
            />
          </Tab.Navigator>
        </Stack>
      </WhiteContainer>
      <Stack pt="$2" bc="$black">
        <Button
          variant="secondary"
          onPress={() => {
            void submitAllSelectedContacts()().then((success) => {
              if (success) goBack()
            })
          }}
          fullWidth
          text={t('common.submit')}
        />
      </Stack>
    </>
  )
}

export function ContactListSelectWithProvider(): JSX.Element {
  const store = useStore()
  const [reloadContactsValue, setReloadContacts] = useState(0)

  const normalizedContacts = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    reloadContactsValue
    return store.get(normalizedContactsAtom)
  }, [reloadContactsValue, store])

  return (
    <ScopeProvider
      scope={ContactsSelectScope}
      value={{
        normalizedContacts,
        reloadContacts: () => {
          setReloadContacts((v) => v + 1)
        },
      }}
    >
      <ContactsListSelect />
    </ScopeProvider>
  )
}

export default function ContactListWithLoadStep(): JSX.Element {
  return (
    <NormalizeContactsWithLoadingScreen>
      <ContactListSelectWithProvider />
    </NormalizeContactsWithLoadingScreen>
  )
}
