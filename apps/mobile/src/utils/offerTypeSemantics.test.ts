import {getOtherSideRole} from './offerTypeSemantics'

describe('getOtherSideRole', () => {
  it.each([
    {
      listingType: undefined,
      offerType: 'SELL',
      author: 'seller',
      requester: 'buyer',
    },
    {
      listingType: 'BITCOIN',
      offerType: 'BUY',
      author: 'buyer',
      requester: 'seller',
    },
    {
      listingType: 'PRODUCT',
      offerType: 'BUY',
      author: 'seller',
      requester: 'buyer',
    },
    {
      listingType: 'PRODUCT',
      offerType: 'SELL',
      author: 'buyer',
      requester: 'seller',
    },
    {
      listingType: 'OTHER',
      offerType: 'BUY',
      author: 'seller',
      requester: 'buyer',
    },
    {
      listingType: 'OTHER',
      offerType: 'SELL',
      author: 'buyer',
      requester: 'seller',
    },
  ] satisfies ReadonlyArray<{
    listingType: 'BITCOIN' | 'PRODUCT' | 'OTHER' | undefined
    offerType: 'BUY' | 'SELL'
    author: 'seller' | 'buyer'
    requester: 'seller' | 'buyer'
  }>)(
    'resolves $listingType $offerType in both chat directions',
    ({listingType, offerType, author, requester}) => {
      const offer = {listingType, offerType}
      expect(getOtherSideRole({offer})).toBe(author)
      expect(getOtherSideRole({offer, otherSideIsAuthor: false})).toBe(
        requester
      )
    }
  )

  it('uses other person for notes and missing offers', () => {
    expect(getOtherSideRole({})).toBe('otherSide')
    expect(getOtherSideRole({otherSideIsAuthor: false})).toBe('otherSide')
  })
})
