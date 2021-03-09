// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
import { __IS_PATIENT_APP__ } from '../../../env'
import CoreResultObject, { AriaCore, CRO, CoreResult } from '../AriaCore'
import { APIFetcher } from '../../accessors/BaseAccessor'
import { UserProfile, RecordDetails } from '../../types'
import { devConsoleLog, toDateString, findSubstringInArray } from '../../ur3/utilities'
import { eciesDecrypt } from '../../ur3/signtxbundled'
import CryptoJS from 'crypto-js'
import CleanHl7 from '../../ur3/declutter'

interface DeleteParams {
  passcode: string;
  otp: string;
}

export default class SecurityCore extends AriaCore {

  private _profile: UserProfile
  private _rawRecords = []

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)
    this.fetchUserProfile()
  }

  public async loadData(): Promise<CoreResultObject> {
    //get user profile and user records(not decrypted) then save
    await this.fetchUserProfile()
    const alreadyHaveWalletKeys = await this.checkWalletKeys()
    if (alreadyHaveWalletKeys)
      return await this.fetchRecords()

    return CRO(CoreResult.NOK)
  }

  public async fetchUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }

  public async checkWalletKeys(): Promise<boolean> {
    return await this._LocalDBAccessor.checkWalletKeys()
  }

  public async setProfileOfDemoUser(): Promise<void> {
    if (__IS_PATIENT_APP__)
      return await this._LocalDBAccessor.setProfileOfDemoUser()
    else return await this._LocalDBAccessor.setProfileOfDemoDoctor()
  }

  public async removeDemoAccount(): Promise<void> {
    return await this._LocalDBAccessor.removeDemoAccount()
  }

  public async fetchRecords(): Promise<any> {
    const raw = await this._APIAccessor.getPtLatestRecordsAsync(this._profile.ariaID, 0)
    devConsoleLog('****raw: ', raw)
    if (raw.records) {
      const rec = await this.parseNewRecords(raw.records)

      this._rawRecords = rec
      return CRO(CoreResult.OK)
    } else if (raw.message) {
      if (raw.message.toLocaleLowerCase().includes('authentication error')) {
        return CRO(CoreResult.AUTHENTICATION_ERROR)
      }
      return CRO(CoreResult.NOK, { message: raw.message })
    }
  }

  public async parseNewRecords(raw: any): Promise<any> {
    const parsedRecords = []
    for (let i = 0; i < raw.length; ++i) {
      const rawItem = raw[i]
      const item = {
        txid: '',
        data: null,
        date: '',
        licenseNumber: '',
        name: '',
        hospitalID: '',
        randomKey: '',
        sharedTo: '',
        expiration: '',
        keys: null
      }

      item.txid = rawItem.txid
      item.keys = rawItem.keys

      if (rawItem.blocktime)
        item.date = toDateString(new Date(rawItem.blocktime * 1000))

      const hospitalID = findSubstringInArray('hospitalId', rawItem.keys)
      if (hospitalID) {
        item.hospitalID = hospitalID
        const info = await this._APIAccessor.getProviderInfo(hospitalID)

        if (info !== null) {
          await this._LocalDBAccessor.storeProviderInfo(
            hospitalID,
            info.licenseNumber,
            info.name,
            info.address,
            info.phone1,
            info.phone2,
            info.email.value
          )
          item.licenseNumber = info.licenseNumber
          item.name = info.name
        }
      }

      if (item != null)
        parsedRecords.unshift(item)
    }
    return parsedRecords
  }

  public async decryptSelectedRecord(txid: string): Promise<any> {
    let decluttered = null

    devConsoleLog('this._profile.ariaID: ', this._profile.ariaID)

    if (this._profile.ariaID) {
      const item = await this._APIAccessor.getRecord(this._profile.ariaID, txid)

      if (item && item.record) {
        const { accesskey, recordItemData } = item.record
        if (this._profile.cryptoKeys.privateKey) {
          const rKey = eciesDecrypt(this._profile.cryptoKeys.privateKey, accesskey)

          if (recordItemData.invalid !== undefined && recordItemData.invalid !== null && recordItemData.invalid === true)
            return null

          const bytes = CryptoJS.AES.decrypt(recordItemData.emr, rKey)
          const data = bytes.toString(CryptoJS.enc.Utf8)
          decluttered = new CleanHl7(JSON.parse(data))

          devConsoleLog('decluttered: ', decluttered)

          this._rawRecords.forEach((rec: RecordDetails): void => {
            if (rec.txid === txid) {
              const index = this._rawRecords.indexOf(rec)
              rec.data = decluttered.data
              rec.randomKey = rKey
              this._rawRecords[index] = rec
            }
          })

        }
      }
    }

    return decluttered.data
  }

  public getUserProfile(): UserProfile {
    return this._profile
  }

  public getUserRecords(): any {
    return this._rawRecords
  }
}