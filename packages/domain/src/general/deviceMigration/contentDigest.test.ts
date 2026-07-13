import {sha256} from '@noble/hashes/sha2.js'
import {Schema} from 'effect'
import {SemverString} from '../../utility/SmeverString.brand'
import {UnixMilliseconds} from '../../utility/UnixMilliseconds.brand'
import {ManifestDigest} from './brands'
import {
  computeLeafDigest,
  computeManifestDigest,
  computeSnapshotContentRoot,
  encodeFileLeaf,
  encodeMmkvLeaf,
  encodeSessionLeaf,
  LEAF_KIND_FILE,
  LEAF_KIND_MMKV,
  LEAF_KIND_SESSION,
  mmkvEntryValueBytes,
  SNAPSHOT_DIGEST_DOMAIN_TAG,
  type FileSnapshotLeaf,
  type MmkvSnapshotLeaf,
} from './contentDigest'
import {bytesToHex, u32be, utf8Encode} from './encoding'
import {MmkvEntry} from './snapshotEntries'
import {toCanonicalManifestForDigest} from './snapshotManifest'
import {
  hex64,
  makeTestCanonicalManifest,
  makeTestManifest,
  testManifestDigest,
  testSnapshotContentDigest,
} from './testFixtures'
import {
  CURRENT_MIGRATION_PROTOCOL_VERSION,
  CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
  MigrationProtocolVersion,
  SnapshotStorageSchemaVersion,
} from './version'

const decodeEntry = Schema.decodeUnknownSync(MmkvEntry)

describe('mmkvEntryValueBytes', () => {
  it('encodes every native type canonically', () => {
    expect(
      bytesToHex(
        mmkvEntryValueBytes(
          decodeEntry({type: 'string', key: 'k', value: 'ab'})
        )
      )
    ).toBe('6162')
    expect(
      bytesToHex(
        mmkvEntryValueBytes(
          decodeEntry({type: 'boolean', key: 'k', value: true})
        )
      )
    ).toBe('01')
    expect(
      bytesToHex(
        mmkvEntryValueBytes(
          decodeEntry({type: 'boolean', key: 'k', value: false})
        )
      )
    ).toBe('00')
    // 1.0 as IEEE-754 float64 big-endian
    expect(
      bytesToHex(
        mmkvEntryValueBytes(decodeEntry({type: 'number', key: 'k', value: 1}))
      )
    ).toBe('3ff0000000000000')
    expect(
      bytesToHex(
        mmkvEntryValueBytes(
          decodeEntry({type: 'buffer', key: 'k', value: 'AQID', byteLength: 3})
        )
      )
    ).toBe('010203')
  })
})

describe('leaf encodings', () => {
  const domainTagHex = bytesToHex(utf8Encode(SNAPSHOT_DIGEST_DOMAIN_TAG))
  const domainTagPrefixHex = `${bytesToHex(
    u32be(SNAPSHOT_DIGEST_DOMAIN_TAG.length)
  )}${domainTagHex}`

  it('mmkv leaf uses the documented length-prefixed layout', () => {
    const encoded = encodeMmkvLeaf({
      key: 'ab',
      nativeType: 'string',
      declaredByteLength: 2,
      valueBytes: utf8Encode('hi'),
    })
    expect(bytesToHex(encoded)).toBe(
      `${domainTagPrefixHex}01${'00000002'}${'6162'}01${'00000002'}${'00000002'}${'6869'}`
    )
  })

  it('session leaf uses the fixed identifier and kind byte', () => {
    const encoded = encodeSessionLeaf({
      declaredByteLength: 2,
      valueBytes: utf8Encode('hi'),
    })
    expect(bytesToHex(encoded)).toBe(
      `${domainTagPrefixHex}02${'00000007'}${bytesToHex(
        utf8Encode('session')
      )}${'00000002'}${'00000002'}${'6869'}`
    )
  })

  it('file leaf hashes over the precomputed content digest', () => {
    const fileContentSha256 = sha256(utf8Encode('file-contents'))
    const encoded = encodeFileLeaf({
      path: 'chat-images/a/b.jpg',
      declaredByteLength: 13,
      fileContentSha256,
    })
    expect(bytesToHex(encoded)).toBe(
      `${domainTagPrefixHex}03${'00000013'}${bytesToHex(
        utf8Encode('chat-images/a/b.jpg')
      )}${'0000000d'}${'00000020'}${bytesToHex(fileContentSha256)}`
    )
  })

  it('computeLeafDigest is sha256 of the encoding', () => {
    const encoded = encodeSessionLeaf({
      declaredByteLength: 0,
      valueBytes: new Uint8Array(0),
    })
    expect(bytesToHex(computeLeafDigest(encoded))).toBe(
      bytesToHex(sha256(encoded))
    )
  })

  it('the three leaf kinds are domain separated from each other', () => {
    expect(LEAF_KIND_MMKV).not.toBe(LEAF_KIND_SESSION)
    expect(LEAF_KIND_SESSION).not.toBe(LEAF_KIND_FILE)
    const valueBytes = utf8Encode('session')
    const asMmkv = encodeMmkvLeaf({
      key: 'session',
      nativeType: 'string',
      declaredByteLength: valueBytes.length,
      valueBytes,
    })
    const asSession = encodeSessionLeaf({
      declaredByteLength: valueBytes.length,
      valueBytes,
    })
    expect(bytesToHex(asMmkv)).not.toBe(bytesToHex(asSession))
  })
})

interface RootArgs {
  protocolVersion: MigrationProtocolVersion
  storageSchemaVersion: SnapshotStorageSchemaVersion
  manifestDigest: ManifestDigest
  mmkvLeaves: readonly MmkvSnapshotLeaf[]
  sessionLeaf: {byteLength: number; digest: Uint8Array}
  fileLeaves: readonly FileSnapshotLeaf[]
}

const mmkvLeafOf = (args: {
  key: string
  nativeType: 'string' | 'boolean' | 'number' | 'buffer'
  valueBytes: Uint8Array
}): MmkvSnapshotLeaf => ({
  key: args.key,
  byteLength: args.valueBytes.length,
  digest: computeLeafDigest(
    encodeMmkvLeaf({
      key: args.key,
      nativeType: args.nativeType,
      declaredByteLength: args.valueBytes.length,
      valueBytes: args.valueBytes,
    })
  ),
})

const fileLeafOf = (args: {
  path: string
  contentBytes: Uint8Array
}): FileSnapshotLeaf => ({
  path: args.path,
  byteLength: args.contentBytes.length,
  digest: computeLeafDigest(
    encodeFileLeaf({
      path: args.path,
      declaredByteLength: args.contentBytes.length,
      fileContentSha256: sha256(args.contentBytes),
    })
  ),
})

const makeRootArgs = (): RootArgs => {
  const sessionBytes = utf8Encode('{"session":true}')
  return {
    protocolVersion: CURRENT_MIGRATION_PROTOCOL_VERSION,
    storageSchemaVersion: CURRENT_SNAPSHOT_STORAGE_SCHEMA_VERSION,
    manifestDigest: testManifestDigest,
    mmkvLeaves: [
      mmkvLeafOf({
        key: 'messagingState',
        nativeType: 'string',
        valueBytes: utf8Encode('[]'),
      }),
      mmkvLeafOf({
        key: 'logs_enabled',
        nativeType: 'boolean',
        valueBytes: Uint8Array.of(1),
      }),
    ],
    sessionLeaf: {
      byteLength: sessionBytes.length,
      digest: computeLeafDigest(
        encodeSessionLeaf({
          declaredByteLength: sessionBytes.length,
          valueBytes: sessionBytes,
        })
      ),
    },
    fileLeaves: [
      fileLeafOf({
        path: 'chat-images/a/b.jpg',
        contentBytes: utf8Encode('image-a'),
      }),
      fileLeafOf({
        path: 'profilePicture/me.png',
        contentBytes: utf8Encode('image-b'),
      }),
    ],
  }
}

describe('computeSnapshotContentRoot', () => {
  it('matches the pinned test vector', () => {
    // Pinned v1 vector — a change here means the digest algorithm changed
    // and existing snapshots/QRs would no longer validate.
    expect(computeSnapshotContentRoot(makeRootArgs())).toBe(
      '47e6b1df2c1bc99ecb55c896229bdc332e6bcc279a2d09aeced0b891914646dd'
    )
  })

  it('does not depend on caller-supplied array order', () => {
    const args = makeRootArgs()
    const shuffled: RootArgs = {
      ...args,
      mmkvLeaves: [...args.mmkvLeaves].reverse(),
      fileLeaves: [...args.fileLeaves].reverse(),
    }
    expect(computeSnapshotContentRoot(shuffled)).toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes when any leaf key changes', () => {
    const args = makeRootArgs()
    const changed: RootArgs = {
      ...args,
      mmkvLeaves: [
        mmkvLeafOf({
          key: 'messagingStatf',
          nativeType: 'string',
          valueBytes: utf8Encode('[]'),
        }),
        ...args.mmkvLeaves.slice(1),
      ],
    }
    expect(computeSnapshotContentRoot(changed)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes when a native type changes for the same value bytes', () => {
    const args = makeRootArgs()
    const changed: RootArgs = {
      ...args,
      mmkvLeaves: [
        args.mmkvLeaves[0] ??
          mmkvLeafOf({
            key: 'x',
            nativeType: 'string',
            valueBytes: new Uint8Array(0),
          }),
        mmkvLeafOf({
          key: 'logs_enabled',
          nativeType: 'buffer',
          valueBytes: Uint8Array.of(1),
        }),
      ],
    }
    expect(computeSnapshotContentRoot(changed)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes when a single value byte changes', () => {
    const args = makeRootArgs()
    const changed: RootArgs = {
      ...args,
      mmkvLeaves: [
        mmkvLeafOf({
          key: 'messagingState',
          nativeType: 'string',
          valueBytes: utf8Encode('[}'),
        }),
        ...args.mmkvLeaves.slice(1),
      ],
    }
    expect(computeSnapshotContentRoot(changed)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes when the declared byte length changes for the same bytes', () => {
    const args = makeRootArgs()
    const valueBytes = utf8Encode('[]')
    const changed: RootArgs = {
      ...args,
      mmkvLeaves: [
        {
          key: 'messagingState',
          byteLength: valueBytes.length,
          digest: computeLeafDigest(
            encodeMmkvLeaf({
              key: 'messagingState',
              nativeType: 'string',
              declaredByteLength: valueBytes.length + 1,
              valueBytes,
            })
          ),
        },
        ...args.mmkvLeaves.slice(1),
      ],
    }
    expect(computeSnapshotContentRoot(changed)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes when a file path changes', () => {
    const args = makeRootArgs()
    const changed: RootArgs = {
      ...args,
      fileLeaves: [
        fileLeafOf({
          path: 'chat-images/a/c.jpg',
          contentBytes: utf8Encode('image-a'),
        }),
        ...args.fileLeaves.slice(1),
      ],
    }
    expect(computeSnapshotContentRoot(changed)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes when a file content digest changes', () => {
    const args = makeRootArgs()
    const changed: RootArgs = {
      ...args,
      fileLeaves: [
        fileLeafOf({
          path: 'chat-images/a/b.jpg',
          contentBytes: utf8Encode('image-x'),
        }),
        ...args.fileLeaves.slice(1),
      ],
    }
    expect(computeSnapshotContentRoot(changed)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes when the session leaf changes', () => {
    const args = makeRootArgs()
    const sessionBytes = utf8Encode('{"session":false}')
    const changed: RootArgs = {
      ...args,
      sessionLeaf: {
        byteLength: sessionBytes.length,
        digest: computeLeafDigest(
          encodeSessionLeaf({
            declaredByteLength: sessionBytes.length,
            valueBytes: sessionBytes,
          })
        ),
      },
    }
    expect(computeSnapshotContentRoot(changed)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })

  it('changes with the manifest digest and both protocol versions', () => {
    const args = makeRootArgs()
    expect(
      computeSnapshotContentRoot({
        ...args,
        manifestDigest: Schema.decodeSync(ManifestDigest)(hex64('f')),
      })
    ).not.toBe(computeSnapshotContentRoot(args))
    expect(
      computeSnapshotContentRoot({
        ...args,
        protocolVersion: Schema.decodeSync(MigrationProtocolVersion)(2),
      })
    ).not.toBe(computeSnapshotContentRoot(args))
    expect(
      computeSnapshotContentRoot({
        ...args,
        storageSchemaVersion: Schema.decodeSync(SnapshotStorageSchemaVersion)(
          2
        ),
      })
    ).not.toBe(computeSnapshotContentRoot(args))
  })

  it('distinguishes leaf ordering (swapped digests change the root)', () => {
    const args = makeRootArgs()
    const [first, second] = args.mmkvLeaves
    if (first === undefined || second === undefined)
      throw new Error('fixture must contain two leaves')
    const swapped: RootArgs = {
      ...args,
      mmkvLeaves: [
        {...first, digest: second.digest, byteLength: second.byteLength},
        {...second, digest: first.digest, byteLength: first.byteLength},
      ],
    }
    expect(computeSnapshotContentRoot(swapped)).not.toBe(
      computeSnapshotContentRoot(args)
    )
  })
})

describe('computeManifestDigest', () => {
  it('matches the pinned test vector', () => {
    expect(computeManifestDigest(makeTestCanonicalManifest())).toBe(
      'ba05567bbcf9ec04d3ccc394433a00848acc763667b5aa0b3e51f3da14cc7c24'
    )
  })

  it('ignores the digest fields of the finalized manifest', () => {
    const a = makeTestManifest()
    const b = makeTestManifest({
      manifestDigest: Schema.decodeSync(ManifestDigest)(hex64('e')),
      snapshotContentDigest: testSnapshotContentDigest,
    })
    expect(computeManifestDigest(toCanonicalManifestForDigest(a))).toBe(
      computeManifestDigest(toCanonicalManifestForDigest(b))
    )
  })

  it('does not depend on descriptor array order', () => {
    const manifest = makeTestManifest()
    const canonical = toCanonicalManifestForDigest(manifest)
    const reordered = {
      ...canonical,
      mmkvEntries: [...canonical.mmkvEntries].reverse(),
    }
    expect(computeManifestDigest(reordered)).toBe(
      computeManifestDigest(canonical)
    )
  })

  it('changes when any field changes', () => {
    const canonical = makeTestCanonicalManifest()
    const base = computeManifestDigest(canonical)
    expect(
      computeManifestDigest({...canonical, totalByteLength: 162})
    ).not.toBe(base)
    expect(
      computeManifestDigest({
        ...canonical,
        createdAt: Schema.decodeSync(UnixMilliseconds)(1751000000001),
      })
    ).not.toBe(base)
    expect(
      computeManifestDigest({
        ...canonical,
        appVersion: Schema.decodeSync(SemverString)('1.44.3'),
      })
    ).not.toBe(base)
  })
})
