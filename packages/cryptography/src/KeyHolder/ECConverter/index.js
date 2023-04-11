/* eslint-disable */
import asn from 'asn1.js'

const util = {
  isString(str) {
    return typeof str === 'string'
  },

  isBuffer(b) {
    return Buffer.isBuffer(b)
  },

  isObject(o) {
    return o && typeof o === 'object'
  },
}

/* ========================================================================== *
 * From RFC-4492 (Appendix A) Equivalent Curves (Informative)                 *
 * ========================================================================== *
 *                                                                            *
 * +------------------------------------------------------------------------+ *
 * |                         Curve names chosen by                          | *
 * |                   different standards organizations                    | *
 * +-----------+------------+------------+------------+---------------------+ *
 * |   SECG    | ANSI X9.62 |    NIST    |  OpenSSL   |      ASN.1 OID      | *
 * +-----------+------------+------------+------------+---------------------+ *
 * | secp256r1 | prime256v1 | NIST P-256 | prime256v1 | 1.2.840.10045.3.1.7 | *
 * | secp256k1 |            |            | secp256k1  | 1.3.132.0.10        | *
 * | secp384r1 |            | NIST P-384 | secp384r1  | 1.3.132.0.34        | *
 * | secp521r1 |            | NIST P-521 | secp521r1  | 1.3.132.0.35        | *
 * +-----------+------------+------------+------------+---------------------+ *
 * ========================================================================== */

/* Byte lengths for validation */
const lengths = {
  prime256v1: Math.ceil(256 / 8),
  secp256k1: Math.ceil(256 / 8),
  secp384r1: Math.ceil(384 / 8),
  secp521r1: Math.ceil(521 / 8),
  secp224r1: Math.ceil(224 / 8),
}

/* JWK curve names */
const jwkCurves = {
  prime256v1: 'P-256',
  secp256k1: 'P-256K' /* NOT A STANDARD NAME: See the README.md file */,
  secp384r1: 'P-384',
  secp521r1: 'P-521',
  secp224r1: 'P-224',
}

/* OpenSSL curve names */
const curves = {
  'P-256': 'prime256v1',
  'P-256K': 'secp256k1' /* NOT A STANDARD NAME: See the README.md file */,
  'P-384': 'secp384r1',
  'P-521': 'secp521r1',
  'P-224': 'secp224r1',
}

/* ========================================================================== *
 * ASN.1                                                                      *
 * ========================================================================== */

const ASN1ECRfc5915Key = asn.define('Rfc5915Key', function () {
  this.seq().obj(
    this.key('version').int(),
    this.key('privateKey').octstr(),
    this.key('parameters').optional().explicit(0).objid({
      '1 2 840 10045 3 1 7': 'prime256v1',
      '1 3 132 0 10': 'secp256k1',
      '1 3 132 0 34': 'secp384r1',
      '1 3 132 0 35': 'secp521r1',
      '1 3 132 0 33': 'secp224r1',
    }),
    this.key('publicKey').optional().explicit(1).bitstr()
  )
})

/* ========================================================================== */

const ASN1ECPkcs8Key = asn.define('Pkcs8Key', function () {
  this.seq().obj(
    this.key('version').int(),
    this.key('algorithmIdentifier')
      .seq()
      .obj(
        this.key('privateKeyType').objid({
          '1 2 840 10045 2 1': 'EC',
        }),
        this.key('parameters').objid({
          '1 2 840 10045 3 1 7': 'prime256v1',
          '1 3 132 0 10': 'secp256k1',
          '1 3 132 0 34': 'secp384r1',
          '1 3 132 0 35': 'secp521r1',
          '1 3 132 0 33': 'secp224r1',
        })
      ),
    this.key('privateKey').octstr()
  )
})

/* ========================================================================== */

const ASN1ECSpkiKey = asn.define('SpkiKey', function () {
  this.seq().obj(
    this.key('algorithmIdentifier')
      .seq()
      .obj(
        this.key('publicKeyType').objid({
          '1 2 840 10045 2 1': 'EC',
        }),
        this.key('parameters').objid({
          '1 2 840 10045 3 1 7': 'prime256v1',
          '1 3 132 0 10': 'secp256k1',
          '1 3 132 0 34': 'secp384r1',
          '1 3 132 0 35': 'secp521r1',
          '1 3 132 0 33': 'secp224r1',
        })
      ),
    this.key('publicKey').bitstr()
  )
})

/* ========================================================================== *
 * ASN.1 PARSING                                                              *
 * ========================================================================== */

/* Parse a public key buffer, split X and Y */
function parsePublicKeyBuffer(curve, buffer) {
  const bytes = lengths[curve]
  if (buffer[0] == 4) {
    if (buffer.length != bytes * 2 + 1)
      throw new TypeError('Invalid uncompressed key size')
    return {
      c: curve,
      x: buffer.slice(1, bytes + 1),
      y: buffer.slice(bytes + 1),
    }
  } else {
    throw new TypeError('Compressed key unsupported')
  }
}

/* Parse PKCS8 from RFC 5208 */
function parsePkcs8(buffer) {
  const key = ASN1ECPkcs8Key.decode(buffer, 'der')
  const privateKeyWrapper = ASN1ECRfc5915Key.decode(key.privateKey, 'der')
  const curve = key.algorithmIdentifier.parameters
  const bytes = lengths[curve]

  const privateKey = privateKeyWrapper.privateKey
  if (privateKey.length > bytes) {
    throw new TypeError(
      'Invalid private key size: expected ' +
        bytes +
        ' gotten ' +
        privateKey.length
    )
  }

  const components = parsePublicKeyBuffer(
    curve,
    privateKeyWrapper.publicKey.data
  )
  components.d = privateKey
  return components
}

/* Parse EC from RFC 5915 */
function parseRfc5915(buffer) {
  const key = ASN1ECRfc5915Key.decode(buffer, 'der')
  const bytes = lengths[key.parameters]

  const privateKey = key.privateKey
  if (privateKey.length > bytes) {
    throw new TypeError(
      'Invalid private key size: expected ' +
        bytes +
        ' gotten ' +
        privateKey.length
    )
  }

  const components = parsePublicKeyBuffer(key.parameters, key.publicKey.data)
  components.d = privateKey
  return components
}

/* Parse SPKI from RFC 5280 */
function parseSpki(buffer) {
  const key = ASN1ECSpkiKey.decode(buffer, 'der')
  return parsePublicKeyBuffer(
    key.algorithmIdentifier.parameters,
    key.publicKey.data
  )
}

/* ========================================================================== *
 * PEM PARSING                                                                *
 * ========================================================================== */

const pemRfc5915RE = /-+BEGIN EC PRIVATE KEY-+([\s\S]+)-+END EC PRIVATE KEY-+/m
const pemPkcs8RE = /-+BEGIN PRIVATE KEY-+([\s\S]*)-+END PRIVATE KEY-+/m
const pemSpkiRE = /-+BEGIN PUBLIC KEY-+([\s\S]*)-+END PUBLIC KEY-+/m

function parsePem(pem) {
  if (!util.isString(pem)) throw new TypeError('PEM must be a string')

  let match = null
  if ((match = pem.match(pemRfc5915RE))) {
    var buffer = Buffer.from(match[1].replace(/[\s-]/gm, ''), 'base64')
    return parseRfc5915(buffer)
  } else if ((match = pem.match(pemPkcs8RE))) {
    var buffer = Buffer.from(match[1].replace(/[\s-]/gm, ''), 'base64')
    return parsePkcs8(buffer)
  } else if ((match = pem.match(pemSpkiRE))) {
    var buffer = Buffer.from(match[1].replace(/[\s-]/gm, ''), 'base64')
    return parseSpki(buffer)
  } else {
    throw new TypeError('Unrecognized PEM key structure')
  }
}

/* ========================================================================== *
 * CLASS DEFINITION                                                           *
 * ========================================================================== */

function ECKey(key, format) {
  if (!(this instanceof ECKey)) return new ECKey(key, format)

  let curve, d, x, y

  if (!format) format = 'pem'

  // BUFFER KEYS: either in "pkcs8" or "spki" format (base64) or "pem" (ascii)
  if (util.isBuffer(key)) {
    if (format == 'pem') {
      var k = parsePem(key.toString('ascii'))
      curve = k.c
      x = k.x
      y = k.y
      d = k.d
    } else if (format == 'pkcs8' || format == 'rfc5208') {
      var k = parsePkcs8(key)
      curve = k.c
      x = k.x
      y = k.y
      d = k.d
    } else if (format == 'spki' || format == 'rfc5280') {
      var k = parseSpki(key)
      curve = k.c
      x = k.x
      y = k.y
      d = k.d
    } else {
      throw new TypeError('Unknown format for EC Key "' + format + '"')
    }
  }

  // STRING KEYS: base64 all the time, but also allowed in PEM
  else if (util.isString(key)) {
    if (format == 'pem') {
      var k = parsePem(key)
      curve = k.c
      x = k.x
      y = k.y
      d = k.d
    } else if (format == 'pkcs8' || format == 'rfc5208') {
      var k = parsePkcs8(Buffer.from(key, 'base64'))
      curve = k.c
      x = k.x
      y = k.y
      d = k.d
    } else if (format == 'spki' || format == 'rfc5280') {
      var k = parseSpki(Buffer.from(key, 'base64'))
      curve = k.c
      x = k.x
      y = k.y
      d = k.d
    } else {
      throw new TypeError('Unknown format for EC Key "' + format + '"')
    }
  }

  // OBJECT KEY: needs to contain "(curve|crv)", "(d|privateKey)" if it's a
  // private key and "(publicKey|x,y)" always required (both for priv and pub)
  else if (util.isObject(key)) {
    // Curves
    if (util.isString(key.curve)) {
      curve = key.curve
    } else if (util.isString(key.crv)) {
      curve = curves[key.crv] || key.crv
    }

    // Private key or "d"
    if (util.isBuffer(key.privateKey)) {
      d = key.privateKey
    } else if (util.isString(key.privateKey)) {
      d = Buffer.from(key.privateKey, 'base64')
    } else if (util.isBuffer(key.d)) {
      d = key.d
    } else if (util.isString(key.d)) {
      d = Buffer.from(key.d, 'base64')
    }

    // Public key, or x and y
    if (util.isBuffer(key.publicKey)) {
      var k = parsePublicKeyBuffer(curve, key.publicKey)
      x = k.x
      y = k.y
    } else if (util.isString(key.publicKey)) {
      var k = parsePublicKeyBuffer(curve, Buffer.from(key.publicKey, 'base64'))
      x = k.x
      y = k.y
    } else {
      // Need to get x and y
      if (util.isBuffer(key.x)) {
        x = key.x
      } else if (util.isString(key.x)) {
        x = Buffer.from(key.x, 'base64')
      }

      if (util.isBuffer(key.y)) {
        y = key.y
      } else if (util.isString(key.y)) {
        y = Buffer.from(key.y, 'base64')
      }
    }
  } else {
    throw new TypeError('Unrecognized format for EC key')
  }

  // Validate curve, d, x and y
  if (!curve) throw new TypeError('EC Key curve not specified')
  if (!x || !y) throw new TypeError('Public EC Key point unavailable')

  const length = lengths[curve]
  if (!length) throw new TypeError('EC Key curve "' + curve + '" invalid')
  if (x.length != length)
    throw new TypeError('Public EC Key point X of wrong length')
  if (y.length != length)
    throw new TypeError('Public EC Key point Y of wrong length')
  if (d && y.length != length)
    throw new TypeError('Private EC Key of wrong length')

  // Define our properties
  Object.defineProperties(this, {
    'curve': {
      enumerable: true,
      configurable: false,
      value: curve,
    },
    'isPrivateECKey': {
      enumerable: true,
      configurable: false,
      value: d != null,
    },
    'x': {
      enumerable: true,
      configurable: false,
      get: function () {
        return Buffer.from(x)
      },
    },
    'y': {
      enumerable: true,
      configurable: false,
      get: function () {
        return Buffer.from(y)
      },
    },

    // "non-enumerable"
    'jsonCurve': {
      enumerable: false,
      configurable: false,
      value: jwkCurves[curve],
    },
    'publicCodePoint': {
      enumerable: false,
      configurable: false,
      get: function () {
        return Buffer.concat([Buffer.from([0x04]), x, y])
      },
    },
  })

  // The "d" (private key) is optional
  if (d)
    Object.defineProperty(this, 'd', {
      enumerable: true,
      configurable: false,
      get: function () {
        return Buffer.from(d)
      },
    })
}

ECKey.createECKey = function (curve) {
  if (!curve) curve = 'prime256v1'
  if (curves[curve]) curve = curves[curve]
  if (!jwkCurves[curve])
    throw new TypeError('Invalid/unknown curve "' + curve + '"')

  const ecdh = crypto.createECDH(curve)

  ecdh.generateKeys()
  return new ECKey({
    privateKey: ecdh.getPrivateKey(),
    publicKey: ecdh.getPublicKey(),
    curve,
  })
}

/* ========================================================================== *
 * ECDH/SIGNING/VALIDATION                                                    *
 * ========================================================================== */

ECKey.prototype.computeSecret = function computeSecret(key) {
  return this.createECDH().computeSecret(key)
}

ECKey.prototype.createECDH = function createECDH() {
  if (this.isPrivateECKey) {
    const ecdh = crypto.createECDH(this.curve)
    ecdh.setPublicKey(this.publicCodePoint)
    ecdh.setPrivateKey(this.d)

    const ecdhComputeSecret = ecdh.computeSecret
    ecdh.computeSecret = function (key) {
      if (key instanceof ECKey) {
        return ecdhComputeSecret.call(ecdh, key.publicCodePoint)
      } else {
        return ecdhComputeSecret.apply(ecdh, arguments)
      }
    }
    return ecdh
  } else {
    throw new Error('Can only create ECDH from private keys')
  }
}

ECKey.prototype.createSign = function createSign(hash) {
  if (!this.isPrivateECKey) throw new Error('EC Private Key needed to sign')
  const sign = crypto.createSign('RSA-' + hash) // RSA works with EC keys, too
  const signFunction = sign.sign
  const self = this
  sign.sign = function (format) {
    return signFunction.call(sign, self.toString('pem'), format)
  }
  return sign
}

ECKey.prototype.createVerify = function createVerify(hash) {
  const verify = crypto.createVerify('RSA-' + hash) // RSA works with EC keys, too
  const verifyFunction = verify.verify
  const key = this.isPrivateECKey ? this.asPublicECKey() : this
  verify.verify = function (signature, format) {
    return verifyFunction.call(verify, key.toString('pem'), signature, format)
  }
  return verify
}

ECKey.prototype.asPublicECKey = function asPublicECKey() {
  if (!this.isPrivateECKey) return this
  return new ECKey({
    curve: this.curve,
    x: this.x,
    y: this.y,
  })
}

/* ========================================================================== *
 * CONVERSION                                                                 *
 * ========================================================================== */

ECKey.prototype.toBuffer = function toBuffer(format) {
  if (!format) format = 'pem'

  // Simple PEM conversion, wrapping the string in the buffer
  if (format == 'pem') return Buffer.from(this.toString('pem'), 'ascii')

  if (this.isPrivateECKey) {
    // Strip leading zeroes from private key
    let d = this.d
    while (d[0] == 0) d = d.slice(1)

    // Known formats: "pkcs8" (default), "pem", "openssl"
    if (format == 'pkcs8' || format == 'rfc5208') {
      // Encode in PKCS8
      return ASN1ECPkcs8Key.encode(
        {
          version: 0,
          algorithmIdentifier: {
            privateKeyType: 'EC',
            parameters: this.curve,
          },
          // Private key is RFC5915 minus curve
          privateKey: ASN1ECRfc5915Key.encode(
            {
              version: 1,
              privateKey: d,
              publicKey: {data: this.publicCodePoint},
            },
            'der'
          ),
        },
        'der'
      )
    } else if (format == 'rfc5915') {
      // Simply encode in ASN.1
      return ASN1ECRfc5915Key.encode(
        {
          version: 1,
          privateKey: d,
          parameters: this.curve,
          publicKey: {data: this.publicCodePoint},
        },
        'der'
      )
    } else {
      throw new TypeError('Unknown format for private key "' + format + '"')
    }
  } else {
    if (format == 'spki' || format == 'rfc5280') {
      return ASN1ECSpkiKey.encode(
        {
          algorithmIdentifier: {
            publicKeyType: 'EC',
            parameters: this.curve,
          },
          publicKey: {data: this.publicCodePoint},
        },
        'der'
      )
    } else {
      throw new TypeError('Unknown format for public key "' + format + '"')
    }
  }
}

ECKey.prototype.toString = function toString(format) {
  if (!format) format = 'pem'

  if (this.isPrivateECKey) {
    if (format == 'pem') {
      // pkcs8, wrapped
      return (
        '-----BEGIN PRIVATE KEY-----\n' +
        this.toBuffer('pkcs8')
          .toString('base64')
          .match(/.{1,64}/g)
          .join('\n') +
        '\n-----END PRIVATE KEY-----\n'
      )
    } else if (format == 'rfc5915') {
      // rfc5915, wrapped
      return (
        '-----BEGIN EC PRIVATE KEY-----\n' +
        this.toBuffer('rfc5915')
          .toString('base64')
          .match(/.{1,64}/g)
          .join('\n') +
        '\n-----END EC PRIVATE KEY-----\n'
      )
    } else if (format == 'pkcs8' || format == 'rfc5208') {
      return this.toBuffer('pkcs8').toString('base64')
    } else if (format == 'spki' || format == 'rfc5280') {
      return this.toBuffer('spki').toString('base64')
    } else {
      throw new TypeError('Unknown format for private key "' + format + '"')
    }
  } else {
    if (format == 'pem') {
      return (
        '-----BEGIN PUBLIC KEY-----\n' +
        this.toBuffer('spki')
          .toString('base64')
          .match(/.{1,64}/g)
          .join('\n') +
        '\n-----END PUBLIC KEY-----\n'
      )
    } else if (format == 'spki' || format == 'rfc5280') {
      return this.toBuffer('spki').toString('base64')
    } else {
      throw new TypeError('Unknown format for public key "' + format + '"')
    }
  }
}

ECKey.prototype.toJSON = function toJSON() {
  function urlsafe(buffer) {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  const jwk = {
    kty: 'EC',
    crv: jwkCurves[this.curve],
    x: urlsafe(this.x),
    y: urlsafe(this.y),
    d: null,
  }

  let d = this.d
  if (d) {
    const bytes = lengths[this.curve]
    if (d.length < bytes) {
      const remaining = bytes - d.length
      d = Buffer.concat([Buffer.alloc(remaining, 0), d])
    }
    jwk.d = urlsafe(d)
  }

  return jwk
}

/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

export default ECKey
