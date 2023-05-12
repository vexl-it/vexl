import {type Command} from 'commander'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import getDummyOffer from './outputDummyOffer'
import matchAndOutputResultOrError from '../utils/matchAndOutputResultOrError'
import createOffer from './createOffer'
import {z} from 'zod'
import {safeParse} from '@vexl-next/resources-utils/dist/utils/parsing'
import deleteOffer from './deleteOffer'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {
  IntendedConnectionLevel,
  SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import updatePublicPart from './updatePublicPart'
import refreshOffer from './refreshOffer'
import addPrivatePart from './addPrivatePart'
import {IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {getNewOffers} from './getNewOffers'

const CreateOfferArgs = z.object({
  credentialsJson: z.string(),
  offerPayloadJson: z.string(),
  intendedConnectionLevel: IntendedConnectionLevel,
})

const DeleteOfferArgs = z.object({
  adminIds: z.string(),
  credentialsJson: z.string(),
})

const GetNewOffersArgs = z.object({
  credentialsJson: z.string(),
  modifiedAt: IsoDatetimeString,
})

const RefreshOfferArgs = z.object({
  adminIds: z.string(),
  credentialsJsonString: z.string(),
})

const AddPrivatePartArgs = z.object({
  adminId: OfferAdminId,
  credentialsJson: z.string(),
  privatePartsJson: z.string(),
})

// const UpdatePublicPartReencryptArgs = z.object({
//   ownerCredentialsJson: z.string(),
//   adminId: OfferAdminId,
//   publicPayloadJson: z.string(),
//   intendedConnectionLevel: IntendedConnectionLevel,
// })

const UpdatePublicPartArgs = z.object({
  ownerCredentialsJson: z.string(),
  adminId: OfferAdminId,
  symmetricKey: SymmetricKey,
  publicPayloadJson: z.string(),
})

export function addOfferCommands(command: Command): Command {
  const offerSubcommand = command
    .command('offer')
    .description(
      'Offers utils. Create, modify, delete, etc. Run `help offer` to see all subcommands.'
    )

  offerSubcommand
    .command('dummy')
    .description(
      'Output dummy offer in json format. Useful for creating new offer.'
    )
    .action(async () => {
      await pipe(getDummyOffer(), TE.fromEither, matchAndOutputResultOrError)()
    })

  offerSubcommand
    .command('create')
    .description(
      'Create a new offer and encrypt it for contacts fetched from server.'
    )
    .requiredOption('-c, --credentials <string>', 'Path to auth file')
    .requiredOption('--level <string>', 'Friend level (FIRST or SECOND)')
    .argument(
      '<string>',
      'Offer json (generate dummy with `offer dummy` command)'
    )
    .action(
      async (
        offer,
        {
          credentials,
          level,
        }: {
          credentials: string
          offer: string
          level: string
        }
      ) => {
        await pipe(
          safeParse(CreateOfferArgs)({
            credentialsJson: credentials,
            offerPayloadJson: offer,
            intendedConnectionLevel: level,
          }),
          TE.fromEither,
          TE.chainW(createOffer),
          matchAndOutputResultOrError
        )()
      }
    )

  offerSubcommand
    .command('delete')
    .description('Delete an offer')
    .argument(
      '<adminIds>',
      'adminIds of the offer. Separated by comma or new line.'
    )
    .requiredOption('-c, --credentials <credentialsJson>', 'Path to auth file')
    .action(
      async (
        adminIds,
        {
          credentials,
        }: {
          credentials: string
        }
      ) => {
        await pipe(
          safeParse(DeleteOfferArgs)({credentialsJson: credentials, adminIds}),
          TE.fromEither,
          TE.chainW(deleteOffer),
          matchAndOutputResultOrError
        )()
      }
    )

  offerSubcommand
    .command('update')
    .description('update public part of the offer')
    .requiredOption('-c, --credentials <string>', 'Path to auth file.')
    .requiredOption('--adminId <string>', 'Admin Id of the offer.')
    .requiredOption('--symmetricKey <string>', 'Symmetric key.')
    .argument(
      '<string>',
      'Offer json (generate dummy with `offer dummy` command)'
    )
    .action(async (offerJson, {credentials, adminId, symmetricKey}) => {
      await pipe(
        safeParse(UpdatePublicPartArgs)({
          ownerCredentialsJson: credentials,
          adminId,
          symmetricKey,
          publicPayloadJson: offerJson,
        }),
        TE.fromEither,
        TE.chainW(updatePublicPart),
        matchAndOutputResultOrError
      )()
    })

  // offerSubcommand
  //   .command('update-reencrypt')
  //   .description(
  //     'update public part of the offer and re encrypt it for all contacts'
  //   )
  //   .requiredOption('-c, --credentials <string>', 'Path to auth file.')
  //   .requiredOption('--adminId <string>', 'Admin Id of the offer.')
  //   .requiredOption('--level <string>', 'Friend level (FIRST or SECOND)')
  //   .argument(
  //     '<string>',
  //     'Offer json (generate dummy with `offer dummy` command)'
  //   )
  //   .action(async (offerJson, {credentials, adminId, level}) => {
  //     await pipe(
  //       safeParse(UpdatePublicPartReencryptArgs)({
  //         ownerCredentialsJson: credentials,
  //         adminId,
  //         intendedConnectionLevel: level,
  //         publicPayloadJson: offerJson,
  //       }),
  //       TE.fromEither,
  //       TE.chainW(updatePublicPartReencryptAll),
  //       matchAndOutputResultOrError
  //     )()
  //   })

  offerSubcommand
    .command('add-private')
    .description('create private part of the offer.')
    .requiredOption('-c, --credentials <string>', 'Path to auth file.')
    .requiredOption('--adminId <string>', 'Admin Id of the offer.')
    .argument(
      '<privatePart>',
      'Private parts in json. {toPublicKey: "key", payloadPrivate: {commonFriends: ["hashes"], friendLevel: ["FIRST_DEGREE", "SECOND_DEGREE"], "symmetricKey": "Some key"}}'
    )
    .action(async (privatePartsJson, {credentials, adminId}) => {
      await pipe(
        safeParse(AddPrivatePartArgs)({
          ownerCredentialsJson: credentials,
          adminId,
          privatePartsJson,
        }),
        TE.fromEither,
        TE.chainW(addPrivatePart),
        matchAndOutputResultOrError
      )()
    })

  offerSubcommand
    .command('refresh')
    .description('Refresh an offer. Prevent server from removing it.')
    .argument(
      '<adminIds>',
      'adminIds of the offers, divided by comma or new line.'
    )
    .requiredOption('-c, --credentials <string>', 'Path to auth file')
    .action(async (adminIds, {credentials}) => {
      await pipe(
        safeParse(RefreshOfferArgs)({
          adminIds,
          credentialsJsonString: credentials,
        }),
        TE.fromEither,
        TE.chainW(refreshOffer),
        matchAndOutputResultOrError
      )()
    })

  offerSubcommand
    .command('get-new')
    .description(
      'Get list of decrypted offers (or errors if decryption failed)'
    )
    .requiredOption('-c, --credentials <string>', 'Path to auth file')
    .option(
      '--modifiedAt',
      'Only newer than this date (in iso datetime string). Defaults to 1970-01-01T00:00:00.000Z',
      '1970-01-01T00:00:00.000Z'
    )
    .action(async ({credentials, modifiedAt}) => {
      await pipe(
        safeParse(GetNewOffersArgs)({
          modifiedAt,
          credentialsJson: credentials,
        }),
        TE.fromEither,
        TE.chainW(getNewOffers),
        matchAndOutputResultOrError
      )()
    })

  return command
}
