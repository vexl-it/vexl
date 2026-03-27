import {
  // Icons
  AddUserPersonContact,
  ArchiveInbox,
  ArrowLeft,
  ArrowRight,
  ArrowsHorizontal,
  ArrowsVerticalSort,
  BellNotification,
  BoltElectric,
  Book,
  BoxProduct,
  BulletListMenu,
  Calendar,
  Camera,
  CellPhoneMobileDevice,
  ChatBubbles,
  CheckboxFilled,
  Checklist,
  Checkmark,
  CherriesFoodFruit,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClockTime,
  ConferenceClub,
  Copy,
  CurrencyBitcoinCircle,
  DiplomaAsset,
  DocumentsFiles,
  Download,
  DuoToneContrastTheme,
  EuroCurrency,
  ExchangeIcon,
  EyeOpen,
  EyeShut,
  FlagReport,
  Gift,
  GoldBricks,
  Help,
  HomeHomemade,
  type IconProps,
  InfoCircle,
  Kebab,
  Language,
  ListWriteDocument,
  Lock,
  LogConsole,
  Map,
  MathCalculate,
  MegaphoneNotifications,
  Microphone,
  MoneyBankNotes,
  More,
  OfferHandCash,
  Pause,
  PencilWriteEdit,
  PeopleUsers,
  PhoneCall,
  PinBoard,
  PinBoardFilled,
  PinGeolocation,
  Play,
  PlusAdd,
  QrCode,
  QuestionmarkCircle,
  QuestionsFaq,
  RadiobuttonCircleEmpty,
  RadiobuttonCircleFilled,
  Refresh,
  RefreshArrowsRectangle,
  Rejected,
  SandWatch,
  ScreenCaptureShot,
  SearchMagnifyGlass,
  Send,
  Share,
  SignOut,
  SizableText,
  Snowflake,
  SquareOutline,
  StarFilled,
  StarOutline,
  TagLabel,
  TelescopeExplore,
  Theme,
  Toolbox,
  Tools,
  TrashBin,
  TuneSettings,
  UnarchiveInbox,
  UserProfile,
  WardrobeFurniture,
  XStack,
  XTwitter,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const allIcons: ReadonlyArray<{
  readonly label: string
  readonly Icon: (props: IconProps) => React.JSX.Element
}> = [
  {label: 'SquareOutline', Icon: SquareOutline},
  {label: 'TuneSettings', Icon: TuneSettings},
  {label: 'Map', Icon: Map},
  {label: 'BulletListMenu', Icon: BulletListMenu},
  {label: 'SearchMagnifyGlass', Icon: SearchMagnifyGlass},
  {label: 'UserProfile', Icon: UserProfile},
  {label: 'MathCalculate', Icon: MathCalculate},
  {label: 'CurrencyBitcoinCircle', Icon: CurrencyBitcoinCircle},
  {label: 'BoxProduct', Icon: BoxProduct},
  {label: 'Tools', Icon: Tools},
  {label: 'PeopleUsers', Icon: PeopleUsers},
  {label: 'PlusAdd', Icon: PlusAdd},
  {label: 'ArrowsHorizontal', Icon: ArrowsHorizontal},
  {label: 'ArrowsVerticalSort', Icon: ArrowsVerticalSort},
  {label: 'ChatBubbles', Icon: ChatBubbles},
  {label: 'XmarkCancelClose', Icon: XmarkCancelClose},
  {label: 'ChevronLeft', Icon: ChevronLeft},
  {label: 'ChevronRight', Icon: ChevronRight},
  {label: 'ChevronDown', Icon: ChevronDown},
  {label: 'ChevronUp', Icon: ChevronUp},
  {label: 'CheckboxFilled', Icon: CheckboxFilled},
  {label: 'RadiobuttonCircleEmpty', Icon: RadiobuttonCircleEmpty},
  {label: 'RadiobuttonCircleFilled', Icon: RadiobuttonCircleFilled},
  {label: 'BoltElectric', Icon: BoltElectric},
  {label: 'Book', Icon: Book},
  {label: 'HomeHomemade', Icon: HomeHomemade},
  {label: 'Toolbox', Icon: Toolbox},
  {label: 'DiplomaAsset', Icon: DiplomaAsset},
  {label: 'GoldBricks', Icon: GoldBricks},
  {label: 'WardrobeFurniture', Icon: WardrobeFurniture},
  {label: 'CherriesFoodFruit', Icon: CherriesFoodFruit},
  {label: 'PinGeolocation', Icon: PinGeolocation},
  {label: 'EyeShut', Icon: EyeShut},
  {label: 'EyeOpen', Icon: EyeOpen},
  {label: 'Rejected', Icon: Rejected},
  {label: 'SignOut', Icon: SignOut},
  {label: 'ArrowLeft', Icon: ArrowLeft},
  {label: 'ArrowRight', Icon: ArrowRight},
  {label: 'Checklist', Icon: Checklist},
  {label: 'InfoCircle', Icon: InfoCircle},
  {label: 'Microphone', Icon: Microphone},
  {label: 'Camera', Icon: Camera},
  {label: 'PencilWriteEdit', Icon: PencilWriteEdit},
  {label: 'PinBoard', Icon: PinBoard},
  {label: 'ConferenceClub', Icon: ConferenceClub},
  {label: 'Calendar', Icon: Calendar},
  {label: 'Help', Icon: Help},
  {label: 'QuestionsFaq', Icon: QuestionsFaq},
  {label: 'TrashBin', Icon: TrashBin},
  {label: 'DocumentsFiles', Icon: DocumentsFiles},
  {label: 'Gift', Icon: Gift},
  {label: 'LogConsole', Icon: LogConsole},
  {label: 'MegaphoneNotifications', Icon: MegaphoneNotifications},
  {label: 'CellPhoneMobileDevice', Icon: CellPhoneMobileDevice},
  {label: 'XTwitter', Icon: XTwitter},
  {label: 'TelescopeExplore', Icon: TelescopeExplore},
  {label: 'OfferHandCash', Icon: OfferHandCash},
  {label: 'QuestionmarkCircle', Icon: QuestionmarkCircle},
  {label: 'FlagReport', Icon: FlagReport},
  {label: 'ListWriteDocument', Icon: ListWriteDocument},
  {label: 'MoneyBankNotes', Icon: MoneyBankNotes},
  {label: 'Exchange', Icon: ExchangeIcon},
  {label: 'ClockTime', Icon: ClockTime},
  {label: 'Lock', Icon: Lock},
  {label: 'Refresh', Icon: Refresh},
  {label: 'Send', Icon: Send},
  {label: 'QrCode', Icon: QrCode},
  {label: 'Copy', Icon: Copy},
  {label: 'AddUserPersonContact', Icon: AddUserPersonContact},
  {label: 'ScreenCaptureShot', Icon: ScreenCaptureShot},
  {label: 'Language', Icon: Language},
  {label: 'DuoToneContrastTheme', Icon: DuoToneContrastTheme},
  {label: 'EuroCurrency', Icon: EuroCurrency},
  {label: 'Snowflake', Icon: Snowflake},
  {label: 'BellNotification', Icon: BellNotification},
  {label: 'TagLabel', Icon: TagLabel},
  {label: 'RefreshArrowsRectangle', Icon: RefreshArrowsRectangle},
  {label: 'SandWatch', Icon: SandWatch},
  {label: 'StarOutline', Icon: StarOutline},
  {label: 'StarFilled', Icon: StarFilled},
  {label: 'PinBoardFilled', Icon: PinBoardFilled},
  {label: 'ArchiveInbox', Icon: ArchiveInbox},
  {label: 'UnarchiveInbox', Icon: UnarchiveInbox},
  {label: 'Checkmark', Icon: Checkmark},
  {label: 'PhoneCall', Icon: PhoneCall},
  {label: 'Pause', Icon: Pause},
  {label: 'Play', Icon: Play},
  {label: 'Download', Icon: Download},
  {label: 'Share', Icon: Share},
  {label: 'Kebab', Icon: Kebab},
  {label: 'More', Icon: More},
]

function ThemedColumn({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const color = theme === 'light' ? '#000' : '#FFF'
  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
        flex={1}
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <YStack gap="$3">
          {allIcons.map((entry) => (
            <XStack key={entry.label} alignItems="center" gap="$3">
              <entry.Icon size={24} color={color} />
              <SizableText
                fontFamily="$body"
                fontWeight="500"
                fontSize={14}
                color="$foregroundTertiary"
              >
                {entry.label}
              </SizableText>
            </XStack>
          ))}
        </YStack>
      </YStack>
    </Theme>
  )
}

export function IconsScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Icons
        </SizableText>

        <ThemedColumn theme="light" />
        <ThemedColumn theme="dark" />
      </YStack>
    </ScrollView>
  )
}
