// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
import CoreResultObject, { AriaCore, CRO, CoreResult } from '../AriaCore'
import { APIFetcher } from '../../accessors/BaseAccessor'
import { UserProfile, ObjectOfPrimitives, RecordDetails } from '../../types'
import { splitStringToArray, devConsoleLog, findSubstringInArray } from '../../ur3/utilities'
import { AriaKeyStringStorage } from '../../ur3/localdb'

interface DeleteParams {
  passcode: string;
  otp: string;
}

export default class SecurityCore extends AriaCore {

  private _logs = []
  private _seedArray = []
  private _profile: UserProfile
  private _deleteAccountData: DeleteParams
  private _deleteOTP = null
  private _userProfile: UserProfile
  private _ptRecords: RecordDetails[] = []
  private _itemsProcessedCount
  private _fetched
  private items = []

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this._deleteAccountData = {
      passcode: null,
      otp: null
    }

    this._getUserProfile()
  }


  public async validatePasscode(passcode): Promise<CoreResultObject> {
    devConsoleLog('this._userProfile.ariaID: ', this._userProfile.ariaID)
    return this._APIAccessor.validatePasscode(this._userProfile.ariaID, passcode)
  }

  public async _getUserProfile(): Promise<void> {
    this._userProfile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
  }

  public async getLoggedInUserNotifications(): Promise<any> {
    return this._LocalDBAccessor.getLoggedInUserNotifications()
  }

  public async loadActivityLogs(): Promise<void> {
    const recordLogs = await this._APIAccessor.fetchMyActivities()

    if (recordLogs && recordLogs.activites) this._logs = recordLogs.activites
  }

  public async getConsentLogs(): Promise<any> {
    const consentLogs = await this._APIAccessor.getConsentLogs()
    devConsoleLog('consentLogs: ', consentLogs)

    return consentLogs
  }

  public async getUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }

  public async requestChangePinToken(passcode: string): Promise<any> {
    return await this._APIAccessor.requestChangePinToken(passcode)
  }

  public async changePasscode(newPass: string, otp: string): Promise<any> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    return await this._APIAccessor.changePassword(newPass, otp, profile.phone)
  }

  public async fetchSeedPhrase(passcode: string): Promise<void> {
    await this.getUserProfile()
    const seed = await this._APIAccessor.getSeedPhrase(this._profile.phone, passcode)

    if (seed && seed.seedPhrase !== undefined)
      this._seedArray = splitStringToArray(seed.seedPhrase, ' ')
  }

  public getActivityLogs(): any {
    return this._logs
  }

  public getSeedPhrase(): string[] {
    return this._seedArray
  }

  public async removeUserAccount(): Promise<any> {
    devConsoleLog('removeUserAccount')
    return this._LocalDBAccessor.removeUserAccount()
  }

  public async requestDelete(): any {
    if (this._deleteAccountData.passcode)
      return await this._APIAccessor.requestDelete(this._deleteAccountData.passcode)
    return CRO(CoreResult.NOK)
  }

  public async deleteAccount(): any {
    if (this._deleteAccountData.otp) {
      const response = await this._APIAccessor.deleteAccount(this._deleteAccountData.otp)

      if (response.isOK()) {
        await this._LocalDBAccessor.removeUserAccount()
        await this._LocalDBAccessor.removeFavoriteDoctors()
        await AriaKeyStringStorage.removeItem('loggedInUserID')
        await AriaKeyStringStorage.removeItem('loggedInUserToken')
        return CRO()
      } else return response
    }
    return CRO(CoreResult.NOK)
  }

  public setDeleteAccountData = (regData: ObjectOfPrimitives): CoreResultObject => {
    for (const key in regData)
      this._deleteAccountData[key] = regData[key]

    return CRO()
  }

  public getUserPhone = async (): Promise<string> => {
    let phone = ''
    if (this._profile && this._profile.phone) phone = this._profile.phone
    if (!phone) {
      const profile = await this.getUserProfile()
      phone = profile.phone
    }
    return phone
  }

  public async getProviderInfoInCache(hospitalID: string): Promise<any> {
    const providerInfo = await this._LocalDBAccessor.getProviderInfoInCache(hospitalID)

    if (providerInfo !== null && providerInfo !== undefined)
      return providerInfo.name
    else {
      const info = await this._APIAccessor.getProviderInfo(hospitalID)

      if (info !== undefined && info !== null) {
        await this._LocalDBAccessor.storeProviderInfo(
          hospitalID,
          info.licenseNumber,
          info.name,
          info.address,
          info.phone1,
          info.phone2,
          info.email.value
        )
        return info.name
      } else return ''
    }

  }

  public async fetchDoctorProfile(ariaID: string): Promise<any> {
    const doctorInfo = await this._APIAccessor.fetchDoctorProfile(ariaID)

    if (doctorInfo !== null && doctorInfo !== undefined) {
      const name = doctorInfo.surname ?
        ((doctorInfo.title ? doctorInfo.title + ' ' : '') + (doctorInfo.firstName ? doctorInfo.firstName + ' ' : '') + doctorInfo.surname)
        : doctorInfo.ariaID
      return name
    }
    else return ''
  }



  public async fetchRecord(): Promise<any> {
    const profile = await this.getUserProfile()
    let raw = await this._APIAccessor.getPtLatestRecordsAsync(profile.ariaID, 0)

    if (typeof raw === 'string') raw = JSON.parse(raw)
    if (raw.message && raw.message.toLowerCase().includes('authentication error')) {
      devConsoleLog('here')
      return CRO(CoreResult.AUTHENTICATION_ERROR, { message: raw.message })
    }
    else {
      this._fetched = raw
      return CRO(CoreResult.OK)
    }
  }

  public async _loadPtLatestRecords(): Promise<boolean> {
    await this.parseNewRecords(this._fetched)
    return true
  }

  public async parseNewRecords(records: any): Promise<any> {
    this._itemsProcessedCount = 0
    const parsedRecords = []

    if (records.records) {
      this.items = records.records

      devConsoleLog('this.items: ', this.items)

      this.items.forEach((item): void => {
        if (!item.keys.includes('root')) {
          var index = this.items.indexOf(item)
          if (index !== -1) this.items.splice(index, 1)
        }
      })

      for (let i = 0; i < this.items.length; ++i) {
        const rawItem = this.items[i]
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
          providerAddress: '',
          providerPhone1: '',
          providerPhone2: '',
          providerEmail: '',
          keys: null
        }
        item.txid = rawItem.txid
        item.keys = rawItem.keys

        if (!rawItem.keys.includes('root')) { this._itemsProcessedCount++; continue }

        const newDate = new Date(rawItem.blocktime * 1000)
        if (rawItem.blocktime && newDate)
          item.date = newDate.toDateString().split(' ').slice(1).join(' ')

        const hospitalID = findSubstringInArray('hospitalId', rawItem.keys)

        if (hospitalID) {
          item.hospitalID = hospitalID
          const info = await this._APIAccessor.getProviderInfo(hospitalID)

          if (info !== null) {
            item.licenseNumber = info.licenseNumber
            item.name = info.name
            item.providerAddress = info.address
            item.providerPhone1 = info.phone1
            item.providerPhone2 = info.phone2
            item.providerEmail = info.email.value
          }
        }

        if (item != null) {
          parsedRecords.unshift(item)
          this._ptRecords = parsedRecords
          this._itemsProcessedCount++
        }
      }
    }
    return parsedRecords
  }

  public getPtLatestRecords(): RecordDetails[] {
    return this._ptRecords
  }

}