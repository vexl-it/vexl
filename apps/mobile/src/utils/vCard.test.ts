import {contactsToVcardString, parseVcardString} from './vCard'

describe('contactsToVcardString', () => {
  it('generates one vCard 3.0 entry per contact', () => {
    const result = contactsToVcardString([
      {name: 'Satoshi', phoneNumbers: ['+420777888999'], emails: []},
      {name: 'Hal', phoneNumbers: ['+15551234567'], emails: []},
    ])

    expect(result).toBe(
      'BEGIN:VCARD\r\n' +
        'VERSION:3.0\r\n' +
        'N:;Satoshi;;;\r\n' +
        'FN:Satoshi\r\n' +
        'TEL;TYPE=CELL:+420777888999\r\n' +
        'END:VCARD\r\n' +
        'BEGIN:VCARD\r\n' +
        'VERSION:3.0\r\n' +
        'N:;Hal;;;\r\n' +
        'FN:Hal\r\n' +
        'TEL;TYPE=CELL:+15551234567\r\n' +
        'END:VCARD\r\n'
    )
  })

  it('writes every phone number and email of a contact into one card', () => {
    const result = contactsToVcardString([
      {
        name: 'Satoshi',
        phoneNumbers: ['+420777888999', '+420111222333'],
        emails: ['satoshi@example.com'],
      },
      {name: 'Hal', phoneNumbers: [], emails: ['hal@example.com']},
    ])

    expect(result).toBe(
      'BEGIN:VCARD\r\n' +
        'VERSION:3.0\r\n' +
        'N:;Satoshi;;;\r\n' +
        'FN:Satoshi\r\n' +
        'TEL;TYPE=CELL:+420777888999\r\n' +
        'TEL;TYPE=CELL:+420111222333\r\n' +
        'EMAIL:satoshi@example.com\r\n' +
        'END:VCARD\r\n' +
        'BEGIN:VCARD\r\n' +
        'VERSION:3.0\r\n' +
        'N:;Hal;;;\r\n' +
        'FN:Hal\r\n' +
        'EMAIL:hal@example.com\r\n' +
        'END:VCARD\r\n'
    )
  })

  it('escapes special characters in names', () => {
    const result = contactsToVcardString([
      {
        name: 'Doe; John, \\backslash\nnewline',
        phoneNumbers: ['+420777888999'],
        emails: [],
      },
    ])

    expect(result).toContain('FN:Doe\\; John\\, \\\\backslash\\nnewline')
    expect(result).toContain('N:;Doe\\; John\\, \\\\backslash\\nnewline;;;')
  })

  it('trims contact names', () => {
    const result = contactsToVcardString([
      {name: '  Satoshi  ', phoneNumbers: ['+420777888999'], emails: []},
    ])

    expect(result).toContain('FN:Satoshi\r\n')
  })
})

describe('parseVcardString', () => {
  it('round-trips what contactsToVcardString exports', () => {
    const exported = contactsToVcardString([
      {
        name: 'Satoshi',
        phoneNumbers: ['+420777888999'],
        emails: ['satoshi@example.com'],
      },
      {name: 'Doe; John, Jr.', phoneNumbers: ['+15551234567'], emails: []},
    ])

    expect(parseVcardString(exported)).toEqual([
      {
        name: 'Satoshi',
        phoneNumbers: ['+420777888999'],
        emails: ['satoshi@example.com'],
      },
      {name: 'Doe; John, Jr.', phoneNumbers: ['+15551234567'], emails: []},
    ])
  })

  it('parses multiple TEL entries and TEL params', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\r\n' +
        'VERSION:3.0\r\n' +
        'FN:Satoshi\r\n' +
        'TEL;TYPE=CELL:+420777888999\r\n' +
        'item1.TEL;TYPE=HOME:+420111222333\r\n' +
        'END:VCARD\r\n'
    )

    expect(result).toEqual([
      {
        name: 'Satoshi',
        phoneNumbers: ['+420777888999', '+420111222333'],
        emails: [],
      },
    ])
  })

  it('falls back to the structured N property when FN is missing', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\nVERSION:3.0\nN:Nakamoto;Satoshi;;Dr.;\nTEL:+420777888999\nEND:VCARD\n'
    )

    expect(result).toEqual([
      {
        name: 'Dr. Satoshi Nakamoto',
        phoneNumbers: ['+420777888999'],
        emails: [],
      },
    ])
  })

  it('unfolds continuation lines', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\r\n' +
        'FN:Satoshi\r\n' +
        ' Nakamoto\r\n' +
        'TEL:+42077\r\n' +
        ' 7888999\r\n' +
        'END:VCARD\r\n'
    )

    expect(result).toEqual([
      {name: 'SatoshiNakamoto', phoneNumbers: ['+420777888999'], emails: []},
    ])
  })

  it('decodes a quoted-printable UTF-8 formatted name', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\r\n' +
        'VERSION:2.1\r\n' +
        'FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=C5=A0t=C4=9Bp=C3=A1n\r\n' +
        'TEL:+420777888999\r\n' +
        'END:VCARD\r\n'
    )

    expect(result).toEqual([
      {name: 'Štěpán', phoneNumbers: ['+420777888999'], emails: []},
    ])
  })

  it('recognizes the bare quoted-printable parameter', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\n' +
        'FN;CHARSET=UTF-8;QUOTED-PRINTABLE:=C5=A0t=C4=9Bp=C3=A1n\n' +
        'TEL:+420777888999\n' +
        'END:VCARD\n'
    )

    expect(result).toEqual([
      {name: 'Štěpán', phoneNumbers: ['+420777888999'], emails: []},
    ])
  })

  it('joins and decodes quoted-printable soft line breaks', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\r\n' +
        'FN;ENCODING=QUOTED-PRINTABLE:=C5=A0t=C4=\r\n' +
        '=9Bp=C3=A1n\r\n' +
        'TEL:+420777888999\r\n' +
        'END:VCARD\r\n'
    )

    expect(result).toEqual([
      {name: 'Štěpán', phoneNumbers: ['+420777888999'], emails: []},
    ])
  })

  it('parses a vCard 2.1 structured quoted-printable name', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\r\n' +
        'VERSION:2.1\r\n' +
        'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=C4=8Cern=C3=BD;Jan;;;\r\n' +
        'TEL;CELL:+420777888999\r\n' +
        'END:VCARD\r\n'
    )

    expect(result).toEqual([
      {name: 'Jan Černý', phoneNumbers: ['+420777888999'], emails: []},
    ])
  })

  it('keeps malformed quoted-printable values without throwing', () => {
    const malformedEscape = parseVcardString(
      'BEGIN:VCARD\n' +
        'FN;ENCODING=QUOTED-PRINTABLE:=ZZ\n' +
        'TEL:+420777888999\n' +
        'END:VCARD\n'
    )
    const invalidUtf8 = parseVcardString(
      'BEGIN:VCARD\n' +
        'FN;ENCODING=QUOTED-PRINTABLE:=FF\n' +
        'TEL:+420111222333\n' +
        'END:VCARD\n'
    )

    expect(malformedEscape).toEqual([
      {name: '=ZZ', phoneNumbers: ['+420777888999'], emails: []},
    ])
    expect(invalidUtf8).toEqual([
      {name: '=FF', phoneNumbers: ['+420111222333'], emails: []},
    ])
  })

  it('joins a soft-break continuation whose content contains a colon', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\n' +
        'FN;ENCODING=QUOTED-PRINTABLE:John =\n' +
        'Smith:Jr\n' +
        'TEL:+420777888999\n' +
        'END:VCARD\n' +
        'BEGIN:VCARD\n' +
        'FN;ENCODING=QUOTED-PRINTABLE:Jane =\n' +
        'SMITH:JR\n' +
        'TEL:+420111222333\n' +
        'END:VCARD\n'
    )

    expect(result).toEqual([
      {name: 'John Smith:Jr', phoneNumbers: ['+420777888999'], emails: []},
      {name: 'Jane SMITH:JR', phoneNumbers: ['+420111222333'], emails: []},
    ])
  })

  it('stops joining at lowercase property and boundary lines', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\n' +
        'FN;ENCODING=QUOTED-PRINTABLE:Alice=\n' +
        'tel:+420777888999\n' +
        'end:vcard\n'
    )

    expect(result).toEqual([
      {name: 'Alice=', phoneNumbers: ['+420777888999'], emails: []},
    ])
  })

  it('does not consume the TEL property or card boundary after a malformed trailing equals sign', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\n' +
        'FN;ENCODING=QUOTED-PRINTABLE:Test=\n' +
        'TEL:+420777888999\n' +
        'END:VCARD\n' +
        'BEGIN:VCARD\n' +
        'FN:Second\n' +
        'TEL:+420111222333\n' +
        'END:VCARD\n'
    )

    expect(result).toEqual([
      {name: 'Test=', phoneNumbers: ['+420777888999'], emails: []},
      {name: 'Second', phoneNumbers: ['+420111222333'], emails: []},
    ])
  })

  it('does not decode literal equals signs without a quoted-printable param', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        'FN:Name=C5=A0\n' +
        'TEL:+420777888999\n' +
        'END:VCARD\n'
    )

    expect(result).toEqual([
      {name: 'Name=C5=A0', phoneNumbers: ['+420777888999'], emails: []},
    ])
  })

  it('ignores other vCard properties and cards without name or contact details', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\n' +
        'FN:Has photo\n' +
        'PHOTO;ENCODING=b:AAAA\n' +
        'NOTE:ignore me\n' +
        'TEL:+420777888999\n' +
        'END:VCARD\n' +
        'BEGIN:VCARD\n' +
        'FN:No number\n' +
        'END:VCARD\n' +
        'BEGIN:VCARD\n' +
        'TEL:+420111222333\n' +
        'END:VCARD\n' +
        'BEGIN:VCARD\n' +
        'FN:Email only\n' +
        'item1.EMAIL;TYPE=INTERNET:Email.Only@Example.com\n' +
        'END:VCARD\n'
    )

    expect(result).toEqual([
      {name: 'Has photo', phoneNumbers: ['+420777888999'], emails: []},
      {
        name: 'Email only',
        phoneNumbers: [],
        emails: ['Email.Only@Example.com'],
      },
    ])
  })

  it('strips control characters from names and caps their length', () => {
    const result = parseVcardString(
      'BEGIN:VCARD\n' +
        `FN:Bad\u0000\u0007name ${'x'.repeat(300)}\n` +
        'TEL:+420777888999\n' +
        'END:VCARD\n'
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.name.startsWith('Bad name x')).toBe(true)
    expect(result[0]?.name.length).toBeLessThanOrEqual(128)
  })

  it('returns empty array for garbage input', () => {
    expect(parseVcardString('this is not a vcard at all')).toEqual([])
    expect(parseVcardString('')).toEqual([])
  })
})
