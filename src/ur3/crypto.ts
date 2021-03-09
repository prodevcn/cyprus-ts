import * as bcrypt from 'bcryptjs'
import CryptoJS from 'crypto-js'

bcrypt.setRandomFallback(randomBytesGenerator)

let _randomGenSeed = Date.now() * Math.random()

/*eslint-disable @typescript-eslint/explicit-function-return-type*/

export function hash(plaintext: string, additionalSeedSource: {}) {
  setAdditionalSeed(additionalSeedSource)
  const bcryptSaltRounds = 10 // TODO PROD at least 10 asyncly
  return bcrypt.hashSync(plaintext, bcryptSaltRounds)
}

export function setAdditionalSeed(
  stringKeysAndValues: {},
  nonFiniteSeedForCoverage?
) {
  const s = stringKeysAndValues
  const now = Date.now()
  let additionalSeed = now * Math.random() * (Math.random() * 10)
  if (nonFiniteSeedForCoverage != null)
    additionalSeed = nonFiniteSeedForCoverage
  for (let key in s){
    if (s[key] == null) continue
    additionalSeed +=
      (now % key.length)
      + 2147483646 * Math.random()
      - ((now % s[key].length) + 2147483646 * Math.random())
    if (!isFinite(additionalSeed))
      additionalSeed = _randomGenSeed / Date.now() / Math.random()
  }
  _randomGenSeed = additionalSeed
}

export function compare(plaintext: string, hash: string) {
  // return plaintext === hash; // NOPWHASH
  return bcrypt.compareSync(plaintext, hash)
}

export function randomBytesGenerator(
  len: number,
  nonFiniteSeedForCoverage?
) {
  let seed = _randomGenSeed * Date.now() * Math.random()
  if (nonFiniteSeedForCoverage != null) seed = nonFiniteSeedForCoverage
  if (!isFinite(seed)) seed = _randomGenSeed / Date.now() / Math.random()

  _randomGenSeed = seed
  // console.log('randomBytesGenerator len: ' + len + ' seed: ' + _randomGenSeed);
  const rg = new UR3CRandom(_randomGenSeed)
  const randBytes: number[] = new Array(len)
  for (let i = 0; i < len; ++i) randBytes[i] = Math.round(rg.next() % 255)
  return randBytes
}
// https://gist.github.com/blixt/f17b47c62508be59987b
function UR3CRandom(seed) {
  this._seed = seed % 2147483647
  // if (this._seed <= 0)
  //   this._seed *= -1;
  this.next = function () {
    // between 1 and 2^32 - 2
    return (this._seed = (this._seed * 16807) % 2147483647)
  }
}

export function AESEncrypt(message: string, key: string) {
  return CryptoJS.AES.encrypt(message, key).toString()
}

export function AESDecrypt(message: string, key: string) {
  let decrypted = ''
  try {
    const decryptedCryptoJSObject = CryptoJS.AES.decrypt(message, key)

    let isKeyCorrect =
      decryptedCryptoJSObject.sigBytes != null
      && decryptedCryptoJSObject.sigBytes > 0
      && decryptedCryptoJSObject.words != null

    if (isKeyCorrect)
      decrypted = decryptedCryptoJSObject.toString(CryptoJS.enc.Utf8)
  } catch (e){
    decrypted = '' // means key was invalid
  }
  return decrypted
}
