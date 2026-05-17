import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs'
import {Button, ScrollView, Stack, tokens, Typography} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useEffect, useMemo, useState} from 'react'
import {type ContactsTabParamsList} from '../../../../navigationTypes'
import {
  normalizedContactsAtom,
  resolveAllContactsAsSeenActionAtom,
} from '../../../../state/contacts/atom/contactsStore'
import {type ContactsFilter} from '../../../../state/contacts/domain'
import {andThenExpectBooleanNoErrors} from '../../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import NormalizeContactsWithLoadingScreen from '../../../NormalizeContactsWithLoadingScreen'
import {contactSelectMolecule, ContactsSelectScope} from './atom'
import FilteredContacts from './components/FilteredContactsWithProvider'
import SearchBar from './components/SearchBar'

const Tab = createMaterialTopTabNavigator<ContactsTabParamsList>()

function ContactsCountIndicator({
  isFocused,
  routeName,
}: {
  isFocused: boolean
  routeName: string
}): React.ReactElement | null {
  const {
    newContactsToDisplayCountAtom,
    submittedContactsToDisplayCountAtom,
    nonSubmittedContactsToDisplayCountAtom,
    allContactsToDisplayCountAtom,
    displayContactsCountAtom,
  } = useMolecule(contactSelectMolecule)

  const displayContactsCount = useAtomValue(displayContactsCountAtom)
  const newContactsToDisplayCount = useAtomValue(newContactsToDisplayCountAtom)
  const submittedContactsToDisplayCount = useAtomValue(
    submittedContactsToDisplayCountAtom
  )
  const nonSubmittedContactsToDisplayCount = useAtomValue(
    nonSubmittedContactsToDisplayCountAtom
  )
  const allContactsToDisplayCount = useAtomValue(allContactsToDisplayCountAtom)

  const contactsCount =
    routeName === 'New'
      ? newContactsToDisplayCount
      : routeName === 'Submitted'
        ? submittedContactsToDisplayCount
        : routeName === 'NonSubmitted'
          ? nonSubmittedContactsToDisplayCount
          : allContactsToDisplayCount

  return displayContactsCount ? (
    <Stack
      position="absolute"
      top={-10}
      right={-5}
      px="$1"
      py={2}
      minWidth={20}
      borderRadius="$2"
      backgroundColor={
        isFocused ? '$backgroundTertiary' : '$accentYellowPrimary'
      }
      alignItems="center"
      justifyContent="center"
      zi="$10"
    >
      <Typography
        variant="descriptionBold"
        color={isFocused ? '$foregroundSecondary' : '$accentHighlightPrimary'}
      >
        {contactsCount}
      </Typography>
    </Stack>
  ) : null
}

function CustomTabBar({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps): React.ReactElement {
  return (
    <Stack>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        gap="$2"
        contentContainerStyle={{
          alignSelf: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: tokens.space[4].val,
          paddingTop: tokens.space[4].val,
        }}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key]
          if (descriptor == null) return null

          const {options} = descriptor
          const isFocused = state.index === index
          const tabLabel =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : route.name

          return (
            <Stack key={route.key} mr="$2">
              <Button
                testID={`@customTabBar/tab${route.name}`}
                onPress={() => {
                  navigation.navigate(route.name, route.params)
                }}
                variant={isFocused ? 'secondary' : 'tertiary'}
                size="small"
              >
                {tabLabel}
              </Button>
              <ContactsCountIndicator
                isFocused={isFocused}
                routeName={route.name}
              />
            </Stack>
          )
        })}
      </ScrollView>
    </Stack>
  )
}

function ContactsListSelect({
  filter,
}: {
  filter?: ContactsFilter
}): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const {
    submitAllSelectedContactsActionAtom,
    checkContactsAccessPrivilegesActionAtom,
  } = useMolecule(contactSelectMolecule)

  const resolveAllContactsAsSeen = useSetAtom(
    resolveAllContactsAsSeenActionAtom
  )
  const submitAllSelectedContacts = useSetAtom(
    submitAllSelectedContactsActionAtom
  )
  const checkContactsAccessPrivileges = useSetAtom(
    checkContactsAccessPrivilegesActionAtom
  )

  useEffect(() => {
    return () => {
      resolveAllContactsAsSeen()
    }
  }, [resolveAllContactsAsSeen])

  useEffect(() => {
    Effect.runFork(checkContactsAccessPrivileges())
  }, [checkContactsAccessPrivileges])

  return (
    <>
      <Stack
        flex={1}
        borderRadius="$5"
        backgroundColor="$backgroundPrimary"
        overflow="hidden"
      >
        <Stack f={1}>
          <SearchBar />
          <Tab.Navigator
            initialRouteName={filter === 'new' ? 'New' : 'All'}
            screenOptions={{
              animationEnabled: true,
            }}
            tabBar={CustomTabBar}
          >
            <Tab.Screen
              name="All"
              options={{
                tabBarLabel: t('postLoginFlow.contactsList.all'),
              }}
              initialParams={{filter: 'all'}}
              component={FilteredContacts}
            />
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
      </Stack>
      <Stack pt="$2" backgroundColor="$backgroundPrimary">
        <Button
          variant="secondary"
          onPress={() => {
            void Effect.runPromise(
              andThenExpectBooleanNoErrors((success) => {
                if (success) goBack()
              })(submitAllSelectedContacts())
            )
          }}
          width="100%"
        >
          {t('common.submit')}
        </Button>
      </Stack>
    </>
  )
}

function ContactListSelectWithProviderComponent({
  filter,
}: {
  filter?: ContactsFilter
}): React.ReactElement {
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
      <ContactsListSelect filter={filter} />
    </ScopeProvider>
  )
}

// This rerenders in PROD only therefore needs memo
export const ContactListSelectWithProvider = React.memo(
  ContactListSelectWithProviderComponent
)

export default function ContactListWithLoadStep({
  filter,
}: {
  filter?: ContactsFilter
}): React.ReactElement {
  return (
    <NormalizeContactsWithLoadingScreen>
      <ContactListSelectWithProvider filter={filter} />
    </NormalizeContactsWithLoadingScreen>
  )
}
