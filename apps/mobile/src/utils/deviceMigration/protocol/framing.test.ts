import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {IncrementalFrameDecoder, encodeLengthPrefixedFrame} from './framing'

describe('device migration framing', () => {
  it('decodes byte-accurately across every chunk boundary', () => {
    const first = Uint8Array.of(1, 2, 3)
    const second = Uint8Array.of(4, 5)
    const encodedFirst = encodeLengthPrefixedFrame(first)
    const encodedSecond = encodeLengthPrefixedFrame(second)
    const all = new Uint8Array(encodedFirst.length + encodedSecond.length)
    all.set(encodedFirst)
    all.set(encodedSecond, encodedFirst.length)
    const decoder = new IncrementalFrameDecoder()
    const output: Uint8Array[] = []
    for (const byte of all) output.push(...decoder.push(Uint8Array.of(byte)))
    decoder.finish()
    expect(output).toEqual([first, second])
  })

  it('rejects an oversized advertised length as soon as the header arrives', () => {
    const decoder = new IncrementalFrameDecoder({maximumFrameBytes: 8})
    const header = new Uint8Array(4)
    new DataView(header.buffer).setUint32(0, 9, false)
    expect(() => decoder.push(header)).toThrow(DeviceMigrationError)
  })

  it('detects a partial frame when transport closes', () => {
    const decoder = new IncrementalFrameDecoder()
    decoder.push(Uint8Array.of(0, 0, 0, 2, 1))
    expect(() => {
      decoder.finish()
    }).toThrow(DeviceMigrationError)
  })
})
