import type React from 'react'

import {AnimatedNavigationBarScreen} from './AnimatedNavigationBarScreen'
import {AvatarScreen} from './AvatarScreen'
import {BackdropScreen} from './BackdropScreen'
import {BannerScreen} from './BannerScreen'
import {BlogCardScreen} from './BlogCardScreen'
import {BotMessageCardScreen} from './BotMessageCardScreen'
import {BottomSheetPanelScreen} from './BottomSheetPanelScreen'
import {ButtonScreen} from './ButtonScreen'
import {BuySellRangeSliderScreen} from './BuySellRangeSliderScreen'
import {CalendarPickerScreen} from './CalendarPickerScreen'
import {CardButtonScreen} from './CardButtonScreen'
import {ChatBubbleScreen} from './ChatBubbleScreen'
import {ChatComposerScreen} from './ChatComposerScreen'
import {ChatContextBarScreen} from './ChatContextBarScreen'
import {ChatEventCardScreen} from './ChatEventCardScreen'
import {ChatMessageItemScreen} from './ChatMessageItemScreen'
import {ChecklistCellScreen} from './ChecklistCellScreen'
import {ChipScreen} from './ChipScreen'
import {ClubCardScreen} from './ClubCardScreen'
import {ClubReachCardScreen} from './ClubReachCardScreen'
import {CodeBlockScreen} from './CodeBlockScreen'
import {CodeInputScreen} from './CodeInputScreen'
import {CollapseScreen} from './CollapseScreen'
import {CommonFriendsScreen} from './CommonFriendsScreen'
import {CommonFriendsSummaryScreen} from './CommonFriendsSummaryScreen'
import {ContextMenuScreen} from './ContextMenuScreen'
import {CopyFieldScreen} from './CopyFieldScreen'
import {CountBadgeScreen} from './CountBadgeScreen'
import {DateSlotsSummaryRowScreen} from './DateSlotsSummaryRowScreen'
import {DecorativeGraphicsScreen} from './DecorativeGraphicsScreen'
import {DialogScreen} from './DialogScreen'
import {DisclosureScreen} from './DisclosureScreen'
import {DismissKeyboardOnPressOutsideScreen} from './DismissKeyboardOnPressOutsideScreen'
import {DividerScreen} from './DividerScreen'
import {DotScreen} from './DotScreen'
import {DotSeparatedRowScreen} from './DotSeparatedRowScreen'
import {DotTypingIndicatorScreen} from './DotTypingIndicatorScreen'
import {EditRowScreen} from './EditRowScreen'
import {EditStepScreen} from './EditStepScreen'
import {EmptyStateScreen} from './EmptyStateScreen'
import {EventCardScreen} from './EventCardScreen'
import {ExchangeRevealCardScreen} from './ExchangeRevealCardScreen'
import {ExchangeScreen} from './ExchangeScreen'
import {ExpandToggleScreen} from './ExpandToggleScreen'
import {FabButtonScreen} from './FabButtonScreen'
import {FadeGradientScreen} from './FadeGradientScreen'
import {FilterBarScreen} from './FilterBarScreen'
import {FilterTagScreen} from './FilterTagScreen'
import {FriendLevelScreen} from './FriendLevelScreen'
import {GraphicsScreen} from './GraphicsScreen'
import {HighlightedTextScreen} from './HighlightedTextScreen'
import {IconBoxScreen} from './IconBoxScreen'
import {IconLabelScreen} from './IconLabelScreen'
import {IconsScreen} from './IconsScreen'
import {IconTagScreen} from './IconTagScreen'
import {InfoBoxScreen} from './InfoBoxScreen'
import {KeyboardAvoidingViewScreen} from './KeyboardAvoidingViewScreen'
import {KeyValueRowScreen} from './KeyValueRowScreen'
import {LabeledTextAreaScreen} from './LabeledTextAreaScreen'
import {LengthCounterScreen} from './LengthCounterScreen'
import {LiveIndicatorScreen} from './LiveIndicatorScreen'
import {LoadErrorStateScreen} from './LoadErrorStateScreen'
import {LoaderScreen} from './LoaderScreen'
import {LoadingOverlayScreen} from './LoadingOverlayScreen'
import {LocationSuggestionRowScreen} from './LocationSuggestionRowScreen'
import {MapOverlayScreen} from './MapOverlayScreen'
import {MarketplaceEmptyLoaderScreen} from './MarketplaceEmptyLoaderScreen'
import {MarketplaceIntroDialogContentScreen} from './MarketplaceIntroDialogContentScreen'
import {MenuItemScreen} from './MenuItemScreen'
import {MenuScreen} from './MenuScreen'
import {NavButtonScreen} from './NavButtonScreen'
import {NavigationBarScreen} from './NavigationBarScreen'
import {NoteMetaScreen} from './NoteMetaScreen'
import {NoteScreen} from './NoteScreen'
import {NotificationCardScreen} from './NotificationCardScreen'
import {OfferCardScreen} from './OfferCardScreen'
import {OffersReencryptionStatusScreen} from './OffersReencryptionStatusScreen'
import {PersonRowScreen} from './PersonRowScreen'
import {PhotoPickerPlaceholderScreen} from './PhotoPickerPlaceholderScreen'
import {PickerScreen} from './PickerScreen'
import {PriceRangeInputScreen} from './PriceRangeInputScreen'
import {PriceStatusRowScreen} from './PriceStatusRowScreen'
import {ProgressBarScreen} from './ProgressBarScreen'
import {ProgressDialogScreen} from './ProgressDialogScreen'
import {QrCodeFrameScreen} from './QrCodeFrameScreen'
import {QrScannerOverlayScreen} from './QrScannerOverlayScreen'
import {RadioGroupScreen} from './RadioGroupScreen'
import {RangeSliderScreen} from './RangeSliderScreen'
import {ReachStatsScreen} from './ReachStatsScreen'
import {ReactionBarScreen} from './ReactionBarScreen'
import {RefreshControlScreen} from './RefreshControlScreen'
import {ReplyPreviewScreen} from './ReplyPreviewScreen'
import {RowButtonScreen} from './RowButtonScreen'
import {RowCheckboxScreen} from './RowCheckboxScreen'
import {RowRadiobuttonScreen} from './RowRadiobuttonScreen'
import {ScreenScreen} from './ScreenScreen'
import {SearchableSelectListScreen} from './SearchableSelectListScreen'
import {SearchBarScreen} from './SearchBarScreen'
import {SectionHeaderScreen} from './SectionHeaderScreen'
import {SegmentedPickerScreen} from './SegmentedPickerScreen'
import {SelectableItemScreen} from './SelectableItemScreen'
import {SelectClubCellScreen} from './SelectClubCellScreen'
import {SelectorScreen} from './SelectorScreen'
import {SliderScreen} from './SliderScreen'
import {StarRatingScreen} from './StarRatingScreen'
import {StepperCheckScreen} from './StepperCheckScreen'
import {StoryPagerScreen} from './StoryPagerScreen'
import {SwipeableOfferCardScreen} from './SwipeableOfferCardScreen'
import {SwipeableRowScreen} from './SwipeableRowScreen'
import {SwitchCardScreen} from './SwitchCardScreen'
import {SwitchScreen} from './SwitchScreen'
import {TabBarScreen} from './TabBarScreen'
import {TabsScreen} from './TabsScreen'
import {TextFieldScreen} from './TextFieldScreen'
import {TextTagScreen} from './TextTagScreen'
import {TitleBlockScreen} from './TitleBlockScreen'
import {ToastScreen} from './ToastScreen'
import {TrustBadgeScreen} from './TrustBadgeScreen'
import {TrustedFriendExplanationScreen} from './TrustedFriendExplanationScreen'
import {TwoToneCardScreen} from './TwoToneCardScreen'
import {TypographyScreen} from './TypographyScreen'

export interface ScreenEntry {
  readonly label: string
  readonly component: () => React.JSX.Element
}

export const screens: readonly ScreenEntry[] = [
  {label: 'Animated Navigation Bar', component: AnimatedNavigationBarScreen},
  {label: 'Avatar', component: AvatarScreen},
  {label: 'Backdrop', component: BackdropScreen},
  {label: 'Banner', component: BannerScreen},
  {label: 'Blog Card', component: BlogCardScreen},
  {label: 'Buy/Sell Range Slider', component: BuySellRangeSliderScreen},
  {label: 'Bot Message Card', component: BotMessageCardScreen},
  {label: 'Bottom Sheet Panel', component: BottomSheetPanelScreen},
  {label: 'Button', component: ButtonScreen},
  {label: 'Calendar Picker', component: CalendarPickerScreen},
  {label: 'Card Button', component: CardButtonScreen},
  {label: 'Chat Bubble', component: ChatBubbleScreen},
  {label: 'Chat Composer', component: ChatComposerScreen},
  {label: 'Chat Context Bar', component: ChatContextBarScreen},
  {label: 'Chat Event Card', component: ChatEventCardScreen},
  {label: 'Chat Message Item', component: ChatMessageItemScreen},
  {label: 'Checklist Cell', component: ChecklistCellScreen},
  {label: 'Chip', component: ChipScreen},
  {label: 'Club Card', component: ClubCardScreen},
  {label: 'Club Reach Card', component: ClubReachCardScreen},
  {label: 'Code Block', component: CodeBlockScreen},
  {label: 'Code Input', component: CodeInputScreen},
  {label: 'Collapse', component: CollapseScreen},
  {label: 'Common Friends', component: CommonFriendsScreen},
  {label: 'Common Friends Summary', component: CommonFriendsSummaryScreen},
  {label: 'Context Menu', component: ContextMenuScreen},
  {label: 'Copy Field', component: CopyFieldScreen},
  {label: 'Date Slots Summary Row', component: DateSlotsSummaryRowScreen},
  {label: 'Count Badge', component: CountBadgeScreen},
  {label: 'Decorative Graphics', component: DecorativeGraphicsScreen},
  {label: 'Dialog', component: DialogScreen},
  {label: 'Disclosure', component: DisclosureScreen},
  {
    label: 'Dismiss Keyboard On Press Outside',
    component: DismissKeyboardOnPressOutsideScreen,
  },
  {label: 'Divider', component: DividerScreen},
  {label: 'Dot', component: DotScreen},
  {label: 'Dot Separated Row', component: DotSeparatedRowScreen},
  {label: 'Dot Typing Indicator', component: DotTypingIndicatorScreen},
  {label: 'Edit Row', component: EditRowScreen},
  {label: 'Edit Step', component: EditStepScreen},
  {label: 'Empty State', component: EmptyStateScreen},
  {label: 'Event Card', component: EventCardScreen},
  {label: 'Exchange', component: ExchangeScreen},
  {label: 'Exchange Reveal Card', component: ExchangeRevealCardScreen},
  {label: 'Expand Toggle', component: ExpandToggleScreen},
  {label: 'Fab Button', component: FabButtonScreen},
  {label: 'Fade Gradient', component: FadeGradientScreen},
  {label: 'Filter Bar', component: FilterBarScreen},
  {label: 'Filter Tag', component: FilterTagScreen},
  {label: 'Friend Level', component: FriendLevelScreen},
  {label: 'Graphics', component: GraphicsScreen},
  {label: 'Highlighted Text', component: HighlightedTextScreen},
  {label: 'Icon Box', component: IconBoxScreen},
  {label: 'Icon Label', component: IconLabelScreen},
  {label: 'Icon Tag', component: IconTagScreen},
  {label: 'Icons', component: IconsScreen},
  {label: 'Info Box', component: InfoBoxScreen},
  {label: 'Keyboard Avoiding View', component: KeyboardAvoidingViewScreen},
  {label: 'Key Value Row', component: KeyValueRowScreen},
  {label: 'Labeled Text Area', component: LabeledTextAreaScreen},
  {label: 'Length Counter', component: LengthCounterScreen},
  {label: 'Live Indicator', component: LiveIndicatorScreen},
  {label: 'Loader', component: LoaderScreen},
  {label: 'Location Suggestion Row', component: LocationSuggestionRowScreen},
  {label: 'Map Overlay', component: MapOverlayScreen},
  {label: 'Load Error State', component: LoadErrorStateScreen},
  {label: 'Loading Overlay', component: LoadingOverlayScreen},
  {label: 'Marketplace Empty Loader', component: MarketplaceEmptyLoaderScreen},
  {
    label: 'Marketplace Intro Dialog Content',
    component: MarketplaceIntroDialogContentScreen,
  },
  {label: 'Menu', component: MenuScreen},
  {label: 'Menu Item', component: MenuItemScreen},
  {label: 'Nav Button', component: NavButtonScreen},
  {label: 'Navigation Bar', component: NavigationBarScreen},
  {label: 'Note', component: NoteScreen},
  {label: 'Note Meta', component: NoteMetaScreen},
  {label: 'Notification Card', component: NotificationCardScreen},
  {label: 'Offer Card', component: OfferCardScreen},
  {
    label: 'Offers Reencryption Status',
    component: OffersReencryptionStatusScreen,
  },
  {label: 'Person Row', component: PersonRowScreen},
  {
    label: 'Photo Picker Placeholder',
    component: PhotoPickerPlaceholderScreen,
  },
  {label: 'Picker', component: PickerScreen},
  {label: 'Price Range Input', component: PriceRangeInputScreen},
  {label: 'Price Status Row', component: PriceStatusRowScreen},
  {label: 'Progress Bar', component: ProgressBarScreen},
  {label: 'Progress Dialog', component: ProgressDialogScreen},
  {label: 'QR Code Frame', component: QrCodeFrameScreen},
  {label: 'QR Scanner Overlay', component: QrScannerOverlayScreen},
  {label: 'Radio Group', component: RadioGroupScreen},
  {label: 'Range Slider', component: RangeSliderScreen},
  {label: 'Reach Stats', component: ReachStatsScreen},
  {label: 'Reaction Bar', component: ReactionBarScreen},
  {label: 'Refresh Control', component: RefreshControlScreen},
  {label: 'Reply Preview', component: ReplyPreviewScreen},
  {label: 'Row Button', component: RowButtonScreen},
  {label: 'Row Checkbox', component: RowCheckboxScreen},
  {label: 'Row Radiobutton', component: RowRadiobuttonScreen},
  {label: 'Screen', component: ScreenScreen},
  {label: 'Search Bar', component: SearchBarScreen},
  {label: 'Searchable Select List', component: SearchableSelectListScreen},
  {label: 'Section Header', component: SectionHeaderScreen},
  {label: 'Segmented Picker', component: SegmentedPickerScreen},
  {label: 'Selectable Item', component: SelectableItemScreen},
  {label: 'Select Club Cell', component: SelectClubCellScreen},
  {label: 'Selector', component: SelectorScreen},
  {label: 'Slider', component: SliderScreen},
  {label: 'Star Rating', component: StarRatingScreen},
  {label: 'Stepper Check', component: StepperCheckScreen},
  {label: 'Story Pager', component: StoryPagerScreen},
  {label: 'Swipeable Offer Card', component: SwipeableOfferCardScreen},
  {label: 'Swipeable Row', component: SwipeableRowScreen},
  {label: 'Switch', component: SwitchScreen},
  {label: 'Switch Card', component: SwitchCardScreen},
  {label: 'Tab Bar', component: TabBarScreen},
  {label: 'Tabs', component: TabsScreen},
  {label: 'Text Field', component: TextFieldScreen},
  {label: 'Text Tag', component: TextTagScreen},
  {label: 'Title Block', component: TitleBlockScreen},
  {label: 'Toast', component: ToastScreen},
  {label: 'Trust Badge', component: TrustBadgeScreen},
  {
    label: 'Trusted Friend Explanation',
    component: TrustedFriendExplanationScreen,
  },
  {label: 'Two Tone Card', component: TwoToneCardScreen},
  {label: 'Typography', component: TypographyScreen},
]
