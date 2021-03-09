/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare var Buffer: any

import { randomBytesGenerator as UR3CrandomBytes } from '../ur3/crypto'

// NOTE NodeJS crypto is not readily supported in expo react native
// const cryptoNode = require('crypto');
import CryptoJS from 'crypto-js'
import bs58 from 'bs58'
import secp256k1 from 'secp256k1'

const OPS = {
  OP_PUSHDATA1: 76,
  OP_PUSHDATA2: 77,
  OP_PUSHDATA4: 78,
  OP_DUP: 118,
  OP_HASH160: 169,
  OP_EQUALVERIFY: 136,
  OP_CHECKSIG: 172
}

const HASH_TYPES = {
  ALL: 0x1,
  'SINGLE|ANYONECANPAY': 0x83
}

export function signRawTransaction(decodedTransaction: any, privkey: string) {
  try {
    // convert privkey to ecdsa privkey
    // reference: https://www.multichain.com/developers/address-key-format/
    let privkeyecdsa = Buffer.from(bs58.decode(privkey).slice(1, -5))
    let pubkey = secp256k1.publicKeyCreate(privkeyecdsa, true)
    const signed = signTransaction(decodedTransaction, pubkey, privkeyecdsa)
    return signed
  } catch (signingException) {
    return 'signingException'
  }
}

function signTransaction(transaction: any, publicKey: any, privateKey: any) {
  // ripemd160(sha256(publicKey)); // NOTE signRawTransaction seems to work without this

  let hashType = HASH_TYPES['ALL']
  if (transaction.hashType) hashType = HASH_TYPES[transaction.hashType]

  let newScripts = []
  let fromAddress = transaction.addressToSign
  for (let index = 0, size = transaction.vin.length; index < size; index++) {
    let prevtx = transaction.prevtx[index].scriptPubKey
    let found = false
    for (let i = 0, s = prevtx.addresses.length; i < s; i++) {
      if (prevtx.addresses[i] === fromAddress) {
        found = true
        break
      }
    }
    if (!found) continue

    let oldvin = transaction.vin
    let oldvout = transaction.vout
    if (hashType === HASH_TYPES['SINGLE|ANYONECANPAY']) {
      // only include the first input and first output in the hash
      transaction.vin = [oldvin[0]]
      transaction.vout = [oldvout[0]]
    }

    let scriptPubkey = Buffer.from(prevtx.hex, 'hex')

    for (let i = 0; i < size; i++) delete transaction.vin[i].script

    transaction.vin[index].script = scriptPubkey

    const hashForSignature = hash256(
      Buffer.concat([transactionToBuffer(transaction), uint32Buffer(hashType)])
    )

    // console.log('hash for signature', hashForSignature.toString('hex'));

    const signature = secp256k1.sign(hashForSignature, privateKey).signature
    const signatureDER = secp256k1.signatureExport(signature)

    // console.log('signature', signature.toString('hex'));
    // console.log('signature DER', signatureDER.toString('hex'));

    // public key hash input
    const scriptSignature = Buffer.concat([
      signatureDER,
      uint8Buffer(hashType)
    ])

    // console.log('script signature', scriptSignature.toString('hex'));

    const scriptSig = Buffer.concat([
      pushDataIntBuffer(scriptSignature.length),
      scriptSignature,
      pushDataIntBuffer(publicKey.length),
      publicKey
    ])

    // console.log('script sig', scriptSig.toString('hex'));

    if (hashType === HASH_TYPES['SINGLE|ANYONECANPAY']) {
      // only include the first input and first output in the hash
      transaction.vin = oldvin
      transaction.vout = oldvout
    }

    newScripts[index] = scriptSig
  }
  for (let index = 0, size = transaction.vin.length; index < size; index++)
    transaction.vin[index].script = newScripts[index]

  // console.log(transaction);

  const signedTransaction = transactionToBuffer(transaction, true)

  // console.log('signed transaction', signedTransaction);

  // console.log('signed hex string', signedTransaction.toString('hex'));

  return signedTransaction.toString('hex')
}

// function getpubkeyfromprivkey(privkey: string){
//   // convert privkey to ecdsa privkey
//   // reference: https://www.multichain.com/developers/address-key-format/
//   let privkeyecdsa = Buffer.from(bs58.decode(privkey).slice(1, -5));
//   let pubkey = secp256k1.publicKeyCreate(privkeyecdsa, true);
//   return pubkey.toString('hex');
// }

// function deriveKeys(privkey: string){
//   // convert privkey to ecdsa privkey
//   // reference: https://www.multichain.com/developers/address-key-format/
//   let privkeyecdsa = Buffer.from(bs58.decode(privkey).slice(1, -5));
//   // console.log(privkeyecdsa.toString('hex'));
//   let pubkey = secp256k1.publicKeyCreate(privkeyecdsa, true);
//   // console.log(pubkey.toString('hex'));
//   return { privkeyecdsa, pubkey };
// }

function transactionToBuffer(transaction, includeOldScripts = false) {
  const chunks = []

  chunks.push(uint32Buffer(transaction.version))
  chunks.push(varIntBuffer(transaction.vin.length))

  transaction.vin.forEach(function (txIn) {
    const hash = [].reverse.call(new Buffer(txIn.txid, 'hex'))
    chunks.push(hash)
    chunks.push(uint32Buffer(txIn.vout)) // index

    if (txIn.script != null) {
      chunks.push(varIntBuffer(txIn.script.length))
      chunks.push(txIn.script)
    } else {
      if (includeOldScripts && txIn.scriptSig.hex.length > 0) {
        let oldScript = Buffer.from(txIn.scriptSig.hex, 'hex')
        chunks.push(varIntBuffer(oldScript.length))
        chunks.push(oldScript)
      } else chunks.push(varIntBuffer(0))
    }

    chunks.push(uint32Buffer(txIn.sequence))
  })

  chunks.push(varIntBuffer(transaction.vout.length))
  transaction.vout.forEach(function (txOut) {
    // for some reason this method encodes the values as if it's in satoshis,
    // so let's multiply that up to get native units
    // the multiplier is 10^8 for amberchain
    chunks.push(uint64Buffer(txOut.value * 100000000))

    const script = Buffer.from(txOut.scriptPubKey.hex, 'hex')

    chunks.push(varIntBuffer(script.length))
    chunks.push(script)
  })

  chunks.push(uint32Buffer(transaction.locktime))

  return Buffer.concat(chunks)
}

function pushDataIntBuffer(number) {
  const chunks = []

  const pushDataSize =
    number < OPS.OP_PUSHDATA1 ? 1 : number < 0xff ? 2 : number < 0xffff ? 3 : 5

  if (pushDataSize === 1) chunks.push(uint8Buffer(number))
  else if (pushDataSize === 2) {
    chunks.push(uint8Buffer(OPS.OP_PUSHDATA1))
    chunks.push(uint8Buffer(number))
  } else if (pushDataSize === 3) {
    chunks.push(uint8Buffer(OPS.OP_PUSHDATA2))
    chunks.push(uint16Buffer(number))
  } else {
    chunks.push(uint8Buffer(OPS.OP_PUSHDATA4))
    chunks.push(uint32Buffer(number))
  }

  return Buffer.concat(chunks)
}

function varIntBuffer(number) {
  const chunks = []

  const size =
    number < 253 ? 1 : number < 0x10000 ? 3 : number < 0x100000000 ? 5 : 9

  // 8 bit
  if (size === 1) chunks.push(uint8Buffer(number))
  else if (size === 3) {
    // 16 bit
    chunks.push(uint8Buffer(253))
    chunks.push(uint16Buffer(number))
  } else if (size === 5) {
    // 32 bit
    chunks.push(uint8Buffer(254))
    chunks.push(uint32Buffer(number))
  } else {
    // 64 bit
    chunks.push(uint8Buffer(255))
    chunks.push(uint64Buffer(number))
  }

  return Buffer.concat(chunks)
}

function uint8Buffer(number) {
  const buffer = new Buffer(1)
  buffer.writeUInt8(number, 0)
  return buffer
}

function uint16Buffer(number) {
  const buffer = new Buffer(2)
  buffer.writeUInt16LE(number, 0)
  return buffer
}

function uint32Buffer(number) {
  const buffer = new Buffer(4)
  buffer.writeUInt32LE(number, 0)
  return buffer
}

function uint64Buffer(number) {
  const buffer = new Buffer(8)
  buffer.writeInt32LE(number & -1, 0)
  buffer.writeUInt32LE(Math.floor(number / 0x100000000), 4)
  return buffer
}

function hash256(buffer) {
  return sha256(sha256(buffer))
}

// function ripemd160(buffer){
//   return crypto
//     .createHash('rmd160')
//     .update(buffer)
//     .digest();
// }

function sha256(buffer) {
  const result = Buffer.from(
    CryptoJS.SHA256(bufferToCryptoJSWordArray(buffer)).toString(),
    'hex'
  )
  // NOTE crypto.createHash is not available in expo react native
  // const result = crypto
  //   .createHash('sha256')
  //   .update(buffer)
  //   .digest();
  return result
}

function bufferToCryptoJSWordArray(buffer) {
  const byteArray = [...buffer]
  const wordArray = []
  for (let i = 0; i < byteArray.length; i++)
    wordArray[(i / 4) | 0] |= byteArray[i] << (24 - 8 * i)

  return CryptoJS.lib.WordArray.create(wordArray, byteArray.length)
}

// Begin ECIES encryption support

// @param {Buffer} privateKey - A 32-byte private key
// @return {Buffer} A 65-byte public key
function getPublicKey(privateKey: Buffer) {
  assert(privateKey.length === 32, 'Bad private key')
  // See https://github.com/wanderer/secp256k1-node/issues/46
  const compressed = secp256k1.publicKeyCreate(privateKey)
  return secp256k1.publicKeyConvert(compressed, false)
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

function sha512(msg: any) {
  const result = Buffer.from(
    CryptoJS.SHA512(bufferToCryptoJSWordArray(msg)).toString(),
    'hex'
  )
  // NOTE crypto.createHash is not available in expo react native
  // const result = crypto
  //   .createHash('sha512')
  //   .update(msg)
  //   .digest();
  return result
}

function aes256CbcEncrypt(iv: Buffer, key: Buffer, plaintextString: string /*Buffer*/) {
  const encrypted = CryptoJS.AES.encrypt(
    plaintextString,
    bufferToCryptoJSWordArray(key),
    {
      iv: bufferToCryptoJSWordArray(iv),
      mode: CryptoJS.mode.CBC // default
    }
  )

  const result = Buffer.from(encrypted.ciphertext.toString(), 'hex')
  // const cipher = cryptoNode.createCipheriv('aes-256-cbc', key, iv);
  // const firstChunk = cipher.update(plaintextString);
  // const secondChunk = cipher.final();
  // console.log('CryptoNode 1st & 2nd chunks result', firstChunk, secondChunk);
  // const result = Buffer.concat([ firstChunk, secondChunk ]);
  return result
}

function aes256CbcDecrypt(iv, key, ciphertext) {
  let decryptedHexString = ''
  try {
    const cjsCipherParams = {
      ciphertext: bufferToCryptoJSWordArray(ciphertext)
    }
    const decrypted = CryptoJS.AES.decrypt(
      cjsCipherParams,
      bufferToCryptoJSWordArray(key),
      {
        iv: bufferToCryptoJSWordArray(iv),
        mode: CryptoJS.mode.CBC // default
      }
    )
    decryptedHexString = decrypted.toString()
  } catch (e) {
    decryptedHexString = ''
  }

  const result = Buffer.from(decryptedHexString, 'hex')
  // const cipher = cryptoNode.createDecipheriv('aes-256-cbc', key, iv);
  // const firstChunk = cipher.update(ciphertext);
  // const secondChunk = cipher.final();
  // console.log('DeCryptoNode 1st & 2nd chunks result', firstChunk, secondChunk);
  // const result = Buffer.concat([ firstChunk, secondChunk ]);
  return result
}

function hmacSha256(key: Buffer, msg: Buffer) {
  const resultBuffer = Buffer.from(
    CryptoJS.HmacSHA256(
      msg.toString('hex'),
      bufferToCryptoJSWordArray(key),
      {}
    ).toString(),
    'hex'
  )
  // NOTE crypto.createHash is not available in expo react native
  // const resultNode = cryptoNode
  //   .createHmac('sha256', key)
  //   .update(msg.toString('hex'))
  //   .digest();

  return resultBuffer
}

// Compare two buffers in constant time to prevent timing attacks.
function equalConstTime(b1, b2) {
  if (b1.length !== b2.length) return false

  let res = 0
  for (let i = 0; i < b1.length; i++) res |= b1[i] ^ b2[i]

  return res === 0
}

// Derive shared secret for given private and public keys.
// @param {Buffer} privateKeyA - Sender's private key (32 bytes)
// @param {Buffer} publicKeyB - Recipient's public key (65 bytes)
// @return {Promise.<Buffer>} A promise that resolves with the derived
// shared secret (Px, 32 bytes) and rejects on bad key.
export function deriveSharedSecret(privateKeyA: Buffer, publicKeyB: Buffer) {
  return secp256k1.ecdhUnsafe(publicKeyB, privateKeyA).slice(1)
}

//
// Input/output structure for ECIES operations.
// @typedef {Object} Ecies
// @property {Buffer} iv - Initialization vector (16 bytes)
// @property {Buffer} ephemPublicKey - Ephemeral public key (65 bytes)
// @property {Buffer} ciphertext - The result of encryption (variable size)
// @property {Buffer} mac - Message authentication code (32 bytes)
//

//
// Encrypt message for given recepient's public key.
// @param {string} publicKeyTo - Recipient's public key (65 bytes) in hex
// @param {Buffer} msg - The message being encrypted
// @param {function} callback - A callback function that accepts the encrypted data
//
export function eciesEncrypt(publicKeyTo: string, msg: string) {
  const ephemPrivateKey = new Buffer(UR3CrandomBytes(32))
  const ephemPublicKey = getPublicKey(ephemPrivateKey)
  const sharedSecret = deriveSharedSecret(
    ephemPrivateKey,
    new Buffer(publicKeyTo, 'hex')
  )
  const secretHashed = sha512(sharedSecret)
  const randomIV = new Buffer(UR3CrandomBytes(16))
  const encryptionKey = secretHashed.slice(0, 32)
  const ciphertext = aes256CbcEncrypt(
    randomIV,
    encryptionKey,
    msg /*as Buffer*/
  )
  const dataToMac = Buffer.concat([randomIV, ephemPublicKey, ciphertext])
  const macKey = secretHashed.slice(32)
  const mac = hmacSha256(macKey, dataToMac)
  const eciesStruct = {
    iv: randomIV.toString('hex'),
    ephemPublicKey: ephemPublicKey.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
    mac: mac.toString('hex')
  }
  return Base64.encode(new Buffer(JSON.stringify(eciesStruct)).toString())
}

//
// @param {string} privateKey - A private key in multichain format
// @param {Ecies} enc - ECIES structure (result of ECIES encryption)
//  encoded as a JSON string converted to base64 (output of eciesEncrypt)
// @param {function} callback - A callback function that accepts the decrypted data
//
export function eciesDecrypt(privateKey: string, encrypted: string) {
  const eciesStruct = JSON.parse(Base64.decode(encrypted))
  // need to convert the eciesStruct fields to Buffer again,
  // because that doesnt survive the JSON conversion
  eciesStruct.ephemPublicKey = new Buffer(eciesStruct.ephemPublicKey, 'hex')
  eciesStruct.iv = new Buffer(eciesStruct.iv, 'hex')
  eciesStruct.ciphertext = new Buffer(eciesStruct.ciphertext, 'hex')
  eciesStruct.mac = new Buffer(eciesStruct.mac, 'hex')

  const privkeyecdsa = Buffer.from(bs58.decode(privateKey).slice(1, -5))
  const sharedSecret = deriveSharedSecret(
    privkeyecdsa,
    eciesStruct.ephemPublicKey
  )

  const secretHashed = sha512(sharedSecret)
  const macKey = secretHashed.slice(32)
  const dataToMac = Buffer.concat([
    eciesStruct.iv,
    eciesStruct.ephemPublicKey,
    eciesStruct.ciphertext
  ])
  const realMac = hmacSha256(macKey, dataToMac)
  if (!equalConstTime(eciesStruct.mac, realMac)) return '' // assert('Bad MAC');
  const encryptionKey = secretHashed.slice(0, 32)
  const r = aes256CbcDecrypt(
    eciesStruct.iv,
    encryptionKey,
    eciesStruct.ciphertext
  )
  return Buffer.from(r).toString()
}

const Base64Chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
export const Base64 = {
  encode: (input: string = '') => {
    let str = input
    let output = ''

    for (
      let block = 0, charCode, i = 0, map = Base64Chars;
      str.charAt(i | 0) || ((map = '='), i % 1);
      output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4))

      if (charCode > 0xff) {
        throw new Error(
          '\'btoa\' failed: The string to be encoded contains characters outside of the Latin1 range.'
        )
      }

      block = (block << 8) | charCode
    }

    return output
  },

  decode: (input: string = '') => {
    let str = input.replace(/=+$/, '')
    let output = ''

    if (str.length % 4 === 1) {
      throw new Error(
        '\'atob\' failed: The string to be decoded is not correctly encoded.'
      )
    }
    for (
      let bc = 0, bs = 0, buffer, i = 0;
      (buffer = str.charAt(i++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ?
        (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    )
      buffer = Base64Chars.indexOf(buffer)

    return output
  }
}

export function generateConfirmationCode(privateKey: string, txid: string) {
  const hashedPurchaseTxid = hash256(Buffer.from(txid))

  const privkeyecdsa = Buffer.from(bs58.decode(privateKey).slice(1, -5))
  const privKeyHex = Buffer.from(privkeyecdsa, 'hex')

  const signature = secp256k1.sign(hashedPurchaseTxid, privKeyHex)

  return signature.signature.toString('hex')
}

export function hexStringToBase64(hexString: string) {
  return Buffer.from(hexString, 'hex').toString('base64')
}

export function hexStringToString(hexString: string) {
  return Buffer.from(hexString, 'hex').toString()
}

export function base64StringToHex(b64String: string) {
  return Buffer.from(b64String, 'base64').toString('hex')
}