import { devConsoleLog } from '../ur3/utilities'

import bip39 from 'bip39'
// import { HDNode } from 'bitcoinjs-lib'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bip32 = require('bip32')
import { payments } from 'bitcoinjs-lib'

import * as UR3C from './crypto'

interface WalletAndKeys {
  walletAddress: string;
  privateKey: string;
  publicKey: string;
  phrase: string;
}

//eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function calcBip32ExtendedKey(derivationPath, hdNodeBip32RootKey) {
  let extendedKey = hdNodeBip32RootKey

  const pathBits = derivationPath.split('/')
  for (let i = 0; i < pathBits.length; i++) {
    const bit = pathBits[i]
    const index = parseInt(bit)
    if (isNaN(index)) continue

    const hardened = bit[bit.length - 1] === '\''
    // const isDerivationPathInvalid = hardened && extendedKey.isNeutered();

    // if (isDerivationPathInvalid)
    //   extendedKey = null;
    // else
    if (hardened) extendedKey = extendedKey.deriveHardened(index)
    else extendedKey = extendedKey.derive(index)
  }

  return extendedKey
}

// should be mirror of web / mgmt console
export function generateWalletAndPrivateKeyFromPhrase(
  mnemonic: string,
  language: string
): WalletAndKeys {
  const bip39Language = convertToBip39WordlistKey(language)
  if (!bip39.validateMnemonic(mnemonic, bip39.wordlists[bip39Language]))
    throw 'recoveraccount:invalidsecretphrase'

  const ariaDerivationPath = 'm/44\'/41754\'/0\'/0'

  // HDNode approach
  // const seedAsHexString = bip39.mnemonicToSeedHex(mnemonic)
  // const hdNodeBip32 = HDNode.fromSeedHex(seedAsHexString)
  // const accountExtendedKey = calcBip32ExtendedKey(ariaDerivationPath, hdNodeBip32)
  // if (accountExtendedKey) {
  //   const derivedKey = accountExtendedKey.derive(0 /*index*/)
  //   const keyPair = derivedKey.keyPair
  //   const walletAddress = keyPair.getAddress().toString()
  //   const privateKey = keyPair.toWIF()
  //   const publicKey = keyPair.getPublicKeyBuffer().toString('hex')
  //   devConsoleLog('HDNode w', { walletAddress, privateKey, publicKey, phrase: mnemonic })
  // }

  // BIP32 approach
  const seedAsBuffer = bip39.mnemonicToSeed(mnemonic)
  const bip32node = bip32.fromSeed(seedAsBuffer)
  const derived = bip32node.derivePath(ariaDerivationPath)
  const walletAddress = payments.p2pkh({ pubkey: derived.publicKey }).address,
    privateKey = derived.toWIF(),
    publicKey = derived.publicKey.toString('hex')

  const w = { walletAddress, privateKey, publicKey, phrase: mnemonic }
  devConsoleLog('bip32 w', w)

  return w
}

export function generateWithSeedSource(
  seedSource: {},
  language = 'en'
): WalletAndKeys {
  const bip39Language = convertToBip39WordlistKey()

  UR3C.setAdditionalSeed(seedSource)

  const twelveWords = bip39.generateMnemonic(
    128,
    UR3C.randomBytesGenerator,
    bip39.wordlists[bip39Language]
  )

  return generateWalletAndPrivateKeyFromPhrase(twelveWords, language)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function convertToBip39WordlistKey(language = 'en'): string {
  return 'english'
}
