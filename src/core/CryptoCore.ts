import {
  signRawTransaction,
  // eciesEncrypt,
  // eciesDecrypt
} from '../ur3/signtxbundled'
// import CoreResultObject, { AriaCore, CoreResult, } from './AriaCore'
import * as UR3C from '../ur3/crypto'

export default class CryptoCore {
  private _publicKeys = {}
  private _privateKey: string

  public constructor(privateKey: string) {
    this._privateKey = privateKey
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public signRawTransaction(decoded: any, privateKey: string): string {
    return signRawTransaction(decoded, privateKey)
  }

  public AESdecrypt(message: string, key: string): string {
    return UR3C.AESDecrypt(message, key)
  }

  public AESencrypt(object: {}, key: string): string {
    return UR3C.AESEncrypt(JSON.stringify(object), key)
  }

  public AESencryptAString(plainText: string, key: string): string {
    return UR3C.AESEncrypt(plainText, key)
  }

  public static getRandomBytesAsKey(length: number): string {
    return CryptoCore.toHexString(UR3C.randomBytesGenerator(length))
  }

  public static toHexString(byteArray: number[]): string {
    return byteArray.reduce(
      (output, element): string => output + ('0' + element.toString(16)).slice(-2),
      ''
    )
  }
}