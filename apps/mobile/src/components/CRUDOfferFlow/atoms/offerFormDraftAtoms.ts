import {deepEqual} from 'fast-equals'
import {atom, type Atom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {type EditableOfferField} from '../offerSetupSteps'
import {copyOfferFieldGroup, type OfferFormState} from './offerFormState'

export interface OfferFormDraftAtoms {
  readonly commitFieldChangesActionAtom: WritableAtom<
    null,
    [EditableOfferField],
    void
  >
  readonly discardFieldChangesActionAtom: WritableAtom<
    null,
    [EditableOfferField],
    void
  >
  readonly fieldHasUnsavedChangesAtoms: Record<
    EditableOfferField,
    Atom<boolean>
  >
}

// The form components edit workingFormAtom (the draft). Saving a field copies
// just that field's values into committedFormAtom; discarding copies them back
// the other way. Publishing an edited offer reads the committed state only.
export function createOfferFormDraftAtoms({
  workingFormAtom,
  committedFormAtom,
}: {
  workingFormAtom: PrimitiveAtom<OfferFormState>
  committedFormAtom: PrimitiveAtom<OfferFormState>
}): OfferFormDraftAtoms {
  const commitFieldChangesActionAtom = atom(
    null,
    (get, set, field: EditableOfferField) => {
      set(
        committedFormAtom,
        copyOfferFieldGroup(field, get(workingFormAtom), get(committedFormAtom))
      )
    }
  )

  const discardFieldChangesActionAtom = atom(
    null,
    (get, set, field: EditableOfferField) => {
      set(
        workingFormAtom,
        copyOfferFieldGroup(field, get(committedFormAtom), get(workingFormAtom))
      )
    }
  )

  function createFieldHasUnsavedChangesAtom(
    field: EditableOfferField
  ): Atom<boolean> {
    return atom((get) => {
      const committed = get(committedFormAtom)
      return !deepEqual(
        copyOfferFieldGroup(field, get(workingFormAtom), committed),
        committed
      )
    })
  }

  const fieldHasUnsavedChangesAtoms: Record<
    EditableOfferField,
    Atom<boolean>
  > = {
    amount: createFieldHasUnsavedChangesAtom('amount'),
    location: createFieldHasUnsavedChangesAtom('location'),
    network: createFieldHasUnsavedChangesAtom('network'),
    describe: createFieldHasUnsavedChangesAtom('describe'),
    language: createFieldHasUnsavedChangesAtom('language'),
    productCategory: createFieldHasUnsavedChangesAtom('productCategory'),
    friendLevel: createFieldHasUnsavedChangesAtom('friendLevel'),
    clubs: createFieldHasUnsavedChangesAtom('clubs'),
  }

  return {
    commitFieldChangesActionAtom,
    discardFieldChangesActionAtom,
    fieldHasUnsavedChangesAtoms,
  }
}
