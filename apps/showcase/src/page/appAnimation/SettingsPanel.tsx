import {Typography} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useId, type ReactNode} from 'react'
import {
  ReelCamera,
  ReelColor,
  StepId,
  type AnimationOffer,
  type AppAnimationConfig,
  type ReelMotion,
} from '../../demos/appAnimation/config'
import './settings.css'

export interface SettingsPanelProps {
  readonly config: AppAnimationConfig
  readonly onChange: (config: AppAnimationConfig) => void
  readonly onFocusStep: (stepId: StepId) => void
  readonly onReset: () => void
}

const stepLabels: Record<StepId, string> = {
  welcome: 'Welcome screen',
  phone: 'Phone number',
  contacts: 'Upload contacts',
  browse: 'Browse offers',
  addOffer: 'Add offer',
  request: 'Message request',
  approved: 'Request approved',
  chat: 'Chat',
  letsMeet: 'Let’s meet',
  meeting: 'Place and time',
  success: 'Meeting successful',
}

const cameraLabels: Record<ReelCamera, string> = {
  auto: 'Auto',
  full: 'Whole screen',
  top: 'Zoom on top',
  bottom: 'Zoom on bottom',
  tilt: 'Tilted',
}

const colorLabels: Record<ReelColor, string> = {
  yellow: 'Yellow',
  green: 'Light green',
  pink: 'Light pink',
  black: 'Black',
  darkGreen: 'Dark green',
  darkPink: 'Dark pink',
}

const relations = ['Friend of a friend', 'Direct friend']

const newOffer = (): AnimationOffer => ({
  id: crypto.randomUUID(),
  name: 'Friend of a friend',
  selling: true,
  commonFriends: 1,
  price: 'Up to 10 000 Kč',
  description: 'Cash only, happy to meet in the city centre.',
  location: 'Prague 1',
  language: 'en',
})

const toNonNegativeInt = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0

type ConfigGroup = 'phone' | 'myOffer' | 'messages' | 'meeting' | 'success'

export function SettingsPanel({
  config,
  onChange,
  onFocusStep,
  onReset,
}: SettingsPanelProps): React.JSX.Element {
  const relationsListId = useId()
  const chosenOfferName = useId()

  const set = <K extends keyof AppAnimationConfig>(
    key: K,
    value: AppAnimationConfig[K]
  ): void => {
    onChange({...config, [key]: value})
  }
  const patch = <K extends ConfigGroup>(
    key: K,
    value: Partial<AppAnimationConfig[K]>
  ): void => {
    set(key, {...config[key], ...value})
  }
  const focus = (step: StepId) => (): void => {
    onFocusStep(step)
  }

  const updateOffer = (id: string, value: Partial<AnimationOffer>): void => {
    set(
      'offers',
      Array.map(config.offers, (offer) =>
        offer.id === id ? {...offer, ...value} : offer
      )
    )
  }
  const removeOffer = (id: string): void => {
    const offers = Array.filter(config.offers, (offer) => offer.id !== id)
    onChange({
      ...config,
      offers,
      chosenOfferId:
        config.chosenOfferId === id
          ? pipe(
              Array.head(offers),
              Option.match({onNone: () => '', onSome: (offer) => offer.id})
            )
          : config.chosenOfferId,
    })
  }

  const captionSteps = Array.filter(
    StepId.literals,
    (step) =>
      (step !== 'addOffer' || config.includeAddOffer) &&
      (step !== 'success' || config.includeMeetingSuccess)
  )

  return (
    <div className="settings">
      <div className="settings-grid">
        <Card title="Phone number" onFocus={focus('phone')}>
          <div className="settings-row settings-phone">
            <TextInput
              label="Calling code"
              value={config.phone.callingCode}
              onChange={(callingCode) => {
                patch('phone', {callingCode})
              }}
            />
            <TextInput
              label="Number"
              hint="Spaces split the digit groups"
              value={config.phone.number}
              onChange={(number) => {
                patch('phone', {number})
              }}
            />
          </div>
        </Card>

        <Card
          title="Offers on the marketplace"
          className="settings-offers-card"
          onFocus={focus('browse')}
        >
          <Typography variant="description" color="$foregroundTertiary">
            Shown top to bottom. You message the chosen one.
          </Typography>
          <datalist id={relationsListId}>
            {Array.map(relations, (relation) => (
              <option key={relation} value={relation} />
            ))}
          </datalist>
          {Array.map(config.offers, (offer, index) => (
            <OfferEditor
              key={offer.id}
              offer={offer}
              index={index}
              chosen={offer.id === config.chosenOfferId}
              chosenOfferName={chosenOfferName}
              relationsListId={relationsListId}
              canRemove={config.offers.length > 1}
              onChange={(value) => {
                updateOffer(offer.id, value)
              }}
              onChoose={() => {
                set('chosenOfferId', offer.id)
              }}
              onRemove={() => {
                removeOffer(offer.id)
              }}
            />
          ))}
          <button
            type="button"
            className="settings-button"
            onClick={() => {
              set('offers', Array.append(config.offers, newOffer()))
            }}
          >
            <Typography
              variant="paragraphSmallBold"
              color="$accentYellowPrimary"
            >
              Add an offer
            </Typography>
          </button>
        </Card>

        <Card
          title="Add offer"
          onFocus={config.includeAddOffer ? focus('addOffer') : undefined}
          included={config.includeAddOffer}
          onIncludedChange={(includeAddOffer) => {
            set('includeAddOffer', includeAddOffer)
          }}
        >
          <div className="settings-row">
            <BuySellSelect
              selling={config.myOffer.selling}
              onChange={(selling) => {
                patch('myOffer', {selling})
              }}
            />
            <NumberInput
              label="Max amount"
              value={config.myOffer.maxAmount}
              onChange={(maxAmount) => {
                patch('myOffer', {maxAmount})
              }}
            />
          </div>
          <TextInput
            label="Location"
            value={config.myOffer.location}
            onChange={(location) => {
              patch('myOffer', {location})
            }}
          />
          <TextInput
            label="Description"
            multiline
            value={config.myOffer.description}
            onChange={(description) => {
              patch('myOffer', {description})
            }}
          />
        </Card>

        <Card title="Messages">
          <TextInput
            label="Your request"
            value={config.messages.request}
            onFocus={focus('request')}
            onChange={(request) => {
              patch('messages', {request})
            }}
          />
          <TextInput
            label="Their first message"
            multiline
            value={config.messages.theirFirst}
            onFocus={focus('chat')}
            onChange={(theirFirst) => {
              patch('messages', {theirFirst})
            }}
          />
          <TextInput
            label="Your reply"
            multiline
            value={config.messages.yourReply}
            onFocus={focus('chat')}
            onChange={(yourReply) => {
              patch('messages', {yourReply})
            }}
          />
          <TextInput
            label="Let’s meet"
            value={config.messages.letsMeet}
            onFocus={focus('letsMeet')}
            onChange={(letsMeet) => {
              patch('messages', {letsMeet})
            }}
          />
          <TextInput
            label="Their reply"
            value={config.messages.theirLetsMeetReply}
            onFocus={focus('letsMeet')}
            onChange={(theirLetsMeetReply) => {
              patch('messages', {theirLetsMeetReply})
            }}
          />
        </Card>

        <Card title="Meeting" onFocus={focus('meeting')}>
          <div className="settings-row">
            <TextInput
              label="Weekday"
              value={config.meeting.weekday}
              onChange={(weekday) => {
                patch('meeting', {weekday})
              }}
            />
            <TextInput
              label="Date"
              value={config.meeting.dateLabel}
              onChange={(dateLabel) => {
                patch('meeting', {dateLabel})
              }}
            />
          </div>
          <TextInput
            label="Time"
            value={config.meeting.time}
            onChange={(time) => {
              patch('meeting', {time})
            }}
          />
          <TextInput
            label="Place"
            value={config.meeting.place}
            onChange={(place) => {
              patch('meeting', {place})
            }}
          />
        </Card>

        <Card
          title="Meeting successful"
          onFocus={config.includeMeetingSuccess ? focus('success') : undefined}
          included={config.includeMeetingSuccess}
          onIncludedChange={(includeMeetingSuccess) => {
            set('includeMeetingSuccess', includeMeetingSuccess)
          }}
        >
          <TextInput
            label="Title"
            value={config.success.title}
            onChange={(title) => {
              patch('success', {title})
            }}
          />
          <TextInput
            label="Text"
            multiline
            value={config.success.text}
            onChange={(text) => {
              patch('success', {text})
            }}
          />
        </Card>

        <Card
          title="Animated reel"
          className="settings-captions-card"
          included={config.reelStyle === 'animated'}
          onIncludedChange={(animated) => {
            set('reelStyle', animated ? 'animated' : 'static')
          }}
        >
          <ReelMotionFields
            motion={config.reelMotion}
            steps={captionSteps}
            onChange={(reelMotion) => {
              set('reelMotion', reelMotion)
            }}
            onFocusStep={onFocusStep}
          />
        </Card>

        <Card title="Reel captions" className="settings-captions-card">
          <div className="settings-captions">
            {Array.map(captionSteps, (step) => (
              <TextInput
                key={step}
                label={stepLabels[step]}
                value={config.captions[step]}
                onFocus={focus(step)}
                onChange={(caption) => {
                  set('captions', {...config.captions, [step]: caption})
                }}
              />
            ))}
          </div>
        </Card>
      </div>

      <button
        type="button"
        className="settings-button settings-reset"
        onClick={onReset}
      >
        <Typography variant="paragraphSmallBold" color="$accentYellowPrimary">
          Reset to defaults
        </Typography>
      </button>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}): React.JSX.Element {
  return (
    <label className="settings-switch">
      <Typography variant="description" color="$foregroundSecondary">
        {label}
      </Typography>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
      />
    </label>
  )
}

function Select<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  readonly label: string
  readonly value: T
  readonly options: readonly T[]
  readonly labels: Record<T, string>
  readonly onChange: (value: T) => void
}): React.JSX.Element {
  return (
    <Field label={label}>
      <select
        className="settings-input"
        value={value}
        onChange={(event) => {
          pipe(
            options,
            Array.findFirst((option) => option === event.target.value),
            Option.map(onChange)
          )
        }}
      >
        {Array.map(options, (option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </Field>
  )
}

function ReelMotionFields({
  motion,
  steps,
  onChange,
  onFocusStep,
}: {
  readonly motion: ReelMotion
  readonly steps: readonly StepId[]
  readonly onChange: (motion: ReelMotion) => void
  readonly onFocusStep: (step: StepId) => void
}): React.JSX.Element {
  const patch = (value: Partial<ReelMotion>): void => {
    onChange({...motion, ...value})
  }
  return (
    <>
      <div className="settings-row settings-motion-toggles">
        <Toggle
          label="Logo intro"
          checked={motion.logoIntro}
          onChange={(logoIntro) => {
            patch({logoIntro})
          }}
        />
        <Toggle
          label="Captions word by word"
          checked={motion.wordByWordCaptions}
          onChange={(wordByWordCaptions) => {
            patch({wordByWordCaptions})
          }}
        />
        <Toggle
          label="Color wipe between steps"
          checked={motion.colorWipe}
          onChange={(colorWipe) => {
            patch({colorWipe})
          }}
        />
        <Field label={`Zoom ${motion.zoom.toFixed(1)}×`}>
          <input
            type="range"
            min={1.1}
            max={2.2}
            step={0.1}
            value={motion.zoom}
            onChange={(event) => {
              patch({zoom: event.target.valueAsNumber})
            }}
          />
        </Field>
      </div>
      <div className="settings-captions">
        {Array.map(steps, (step) => (
          <div
            key={step}
            className="settings-motion-step"
            onFocus={() => {
              onFocusStep(step)
            }}
          >
            <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
              {stepLabels[step]}
            </Typography>
            <div className="settings-row">
              <Select
                label="Camera"
                value={motion.steps[step].camera}
                options={ReelCamera.literals}
                labels={cameraLabels}
                onChange={(camera) => {
                  patch({
                    steps: {
                      ...motion.steps,
                      [step]: {...motion.steps[step], camera},
                    },
                  })
                }}
              />
              <Select
                label="Color"
                value={motion.steps[step].color}
                options={ReelColor.literals}
                labels={colorLabels}
                onChange={(color) => {
                  patch({
                    steps: {
                      ...motion.steps,
                      [step]: {...motion.steps[step], color},
                    },
                  })
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Card({
  title,
  className,
  onFocus,
  included,
  onIncludedChange,
  children,
}: {
  readonly title: string
  readonly className?: string
  readonly onFocus?: () => void
  readonly included?: boolean
  readonly onIncludedChange?: (included: boolean) => void
  readonly children: ReactNode
}): React.JSX.Element {
  return (
    <fieldset
      className={className ? `settings-card ${className}` : 'settings-card'}
      onFocus={onFocus}
    >
      <legend className="settings-card-header">
        <Typography variant="paragraphDemibold" color="$foregroundPrimary">
          {title}
        </Typography>
        {onIncludedChange && included !== undefined ? (
          <label className="settings-switch">
            <Typography variant="description" color="$foregroundSecondary">
              Include
            </Typography>
            <input
              type="checkbox"
              role="switch"
              checked={included}
              onChange={(event) => {
                onIncludedChange(event.target.checked)
              }}
            />
          </label>
        ) : null}
      </legend>
      {included === false ? null : children}
    </fieldset>
  )
}

function OfferEditor({
  offer,
  index,
  chosen,
  chosenOfferName,
  relationsListId,
  canRemove,
  onChange,
  onChoose,
  onRemove,
}: {
  readonly offer: AnimationOffer
  readonly index: number
  readonly chosen: boolean
  readonly chosenOfferName: string
  readonly relationsListId: string
  readonly canRemove: boolean
  readonly onChange: (value: Partial<AnimationOffer>) => void
  readonly onChoose: () => void
  readonly onRemove: () => void
}): React.JSX.Element {
  return (
    <div
      className={chosen ? 'settings-offer is-chosen' : 'settings-offer'}
      role="group"
      aria-label={`Offer ${index + 1}`}
    >
      <div className="settings-offer-header">
        <label className="settings-radio">
          <input
            type="radio"
            name={chosenOfferName}
            checked={chosen}
            onChange={onChoose}
          />
          <Typography
            variant="descriptionBold"
            color={chosen ? '$accentYellowPrimary' : '$foregroundSecondary'}
          >
            {chosen ? `Offer ${index + 1} · chosen` : `Offer ${index + 1}`}
          </Typography>
        </label>
        <button
          type="button"
          className="settings-remove"
          disabled={!canRemove}
          aria-label={`Remove offer ${index + 1}`}
          onClick={onRemove}
        >
          <Typography variant="description" color="$foregroundSecondary">
            Remove
          </Typography>
        </button>
      </div>
      <div className="settings-offer-fields">
        <TextInput
          label="Relation"
          list={relationsListId}
          value={offer.name}
          onChange={(name) => {
            onChange({name})
          }}
        />
        <BuySellSelect
          selling={offer.selling}
          onChange={(selling) => {
            onChange({selling})
          }}
        />
        <NumberInput
          label="Common friends"
          value={offer.commonFriends}
          onChange={(commonFriends) => {
            onChange({commonFriends})
          }}
        />
        <TextInput
          label="Price"
          value={offer.price}
          onChange={(price) => {
            onChange({price})
          }}
        />
        <TextInput
          label="Location"
          value={offer.location}
          onChange={(location) => {
            onChange({location})
          }}
        />
        <TextInput
          label="Language"
          value={offer.language}
          onChange={(language) => {
            onChange({language})
          }}
        />
        <div className="settings-offer-description">
          <TextInput
            label="Description"
            value={offer.description}
            onChange={(description) => {
              onChange({description})
            }}
          />
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  readonly label: string
  readonly hint?: string
  readonly children: ReactNode
}): React.JSX.Element {
  return (
    <label className="settings-field">
      <Typography variant="description" color="$foregroundSecondary">
        {label}
      </Typography>
      {children}
      {hint ? (
        <Typography variant="description" color="$foregroundTertiary">
          {hint}
        </Typography>
      ) : null}
    </label>
  )
}

function TextInput({
  label,
  hint,
  value,
  multiline,
  list,
  onFocus,
  onChange,
}: {
  readonly label: string
  readonly hint?: string
  readonly value: string
  readonly multiline?: boolean
  readonly list?: string
  readonly onFocus?: () => void
  readonly onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea
          className="settings-input"
          rows={2}
          value={value}
          onFocus={onFocus}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      ) : (
        <input
          className="settings-input"
          type="text"
          list={list}
          value={value}
          onFocus={onFocus}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      )}
    </Field>
  )
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
}): React.JSX.Element {
  return (
    <Field label={label}>
      <input
        className="settings-input"
        type="number"
        min={0}
        value={value}
        onChange={(event) => {
          onChange(toNonNegativeInt(event.target.valueAsNumber))
        }}
      />
    </Field>
  )
}

function BuySellSelect({
  selling,
  onChange,
}: {
  readonly selling: boolean
  readonly onChange: (selling: boolean) => void
}): React.JSX.Element {
  return (
    <Field label="Type">
      <select
        className="settings-input"
        value={selling ? 'sell' : 'buy'}
        onChange={(event) => {
          onChange(event.target.value === 'sell')
        }}
      >
        <option value="buy">Buying</option>
        <option value="sell">Selling</option>
      </select>
    </Field>
  )
}
