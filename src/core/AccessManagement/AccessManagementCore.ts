// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
import CoreResultObject, { AriaCore, CRO, CoreResult } from '../AriaCore'
import { APIFetcher } from '../../accessors/BaseAccessor'
import { AccessManagementDrDetails } from '../../accessors/AriaAPIAccessor'
import { RecordDetails, UserProfile } from '../../types'
import { signRawTransaction, eciesEncrypt } from '../../ur3/signtxbundled'
import { devConsoleLog } from '../../ur3/utilities'

interface KeyInfo {
  blocktime: string;
  data: {
    accesskey: string;
    recordTxid: string;
  };
  txid: string;
}

export default class AccessManagementCore extends AriaCore {

  private _doctors: AccessManagementDrDetails[] = []
  private _itemsProcessedCount: number = 0
  private _totalFetchedDoctors: number = 0
  private _profile
  private _numberOfRecords = 0
  private _allRecords
  private _accessKeys = {}

  public isStillProcessing(): boolean {
    return this._itemsProcessedCount < this._totalFetchedDoctors
  }

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)
  }

  public getDoctorsList(): AccessManagementDrDetails[] {
    return this._doctors
  }

  public async checkFutureAccess(doctor: AccessManagementDrDetails): Promise<boolean> {
    return await this._APIAccessor.hasfutureaccess(doctor.ariaID)
  }

  public async _getDoctorProfile(doctors: string[]): Promise<void> {
    const sharedToDoctor = []

    for (let j = 0; j < doctors.length; j++) {
      sharedToDoctor.push(this._APIAccessor.fetchDoctorProfile(doctors[j]))
      this._itemsProcessedCount++
    }
    let result = await Promise.all(sharedToDoctor)

    for (let i = 0; i < result.length; i++) { //TODO remove if not needed
      const doctor = result[i]
      const cache = await this._APIAccessor.fetchMyDoctorProfile(doctor.ariaID)
      if (cache && cache.shareContactDetails) doctor.shareContactDetails = cache.shareContactDetails

      const access = await this.checkFutureAccess(doctor)
      doctor.hasFutureAccess = access
    }

    this._doctors = result
    await this._getAccessKeys()
  }

  public async _getAccessKeys(): Promise<void> {
    const accessKeys = {}
    const array = []
    const doctor = this._doctors
    for (let i = 0; i < doctor.length; i++) {
      const keys = await this.listAccesskeys(doctor[i].ariaID)
      array.push(keys)
    }

    for (let j = 0; j < array.length; j++)
      accessKeys[doctor[j].ariaID] = array[j]


    this._accessKeys = accessKeys
  }

  public getAccessKeys(ariaID: string): string[] {
    return this._accessKeys[ariaID]
  }

  public async _refreshProfile(ariaID: string): Promise<any> {
    const cache = await this._APIAccessor.fetchDoctorProfile(ariaID)
    const shareContact = await this._APIAccessor.getDoctorsListAsync(0, 10000) //TODO to remove when share contact details can be passed thru fetchDoctorProfile

    let fetchedDoctor = null
    if (shareContact.list) {
      const d = shareContact.list
      for (let i = 0; i < d.length; i++) {
        const doctor = d[i]
        if (ariaID === doctor.ariaID) {
          fetchedDoctor = doctor
          break
        }
      }
    }

    if (fetchedDoctor)
      cache['shareContactDetails'] = fetchedDoctor.shareContactDetails
    return cache
  }

  public async listRecordAccesskeys(txid: string): Promise<any> {
    const accessKeys = await this._APIAccessor.listrecordaccesskeys(txid)

    let arrayOfAriaIDSharedTo = []
    if (accessKeys && accessKeys.accesskeys) {
      const array = accessKeys.accesskeys
      for (let i = 0; i < array.length; ++i) {
        const ariaID = array[i].ariaID

        if (array && array[i].data && array[i].data.expiration === 0) continue
        else arrayOfAriaIDSharedTo.push(ariaID)
      }
    }

    return arrayOfAriaIDSharedTo

  }

  public async _loadDoctorsListAsync(): Promise<CoreResultObject> {
    const apiResponse = await this._APIAccessor.fetchDoctorsSharedTo()

    if (apiResponse.doctors) {
      this._totalFetchedDoctors = apiResponse.doctors.length
      await this._getDoctorProfile(apiResponse.doctors)
      return CRO(CoreResult.OK)
    } else if (apiResponse.message) {
      if (apiResponse.message.toLocaleLowerCase().includes('authentication error')) {
        return CRO(CoreResult.AUTHENTICATION_ERROR)
      }
      return CRO(CoreResult.NOK, { message: apiResponse.message })
    }
  }

  public async revokeDoctorAccess(ariaID: string, recordTxid: string): Promise<CoreResultObject> {
    const profile = await this.getUserProfile()

    const shareItem = { recordTxid }
    const toSign = await this._APIAccessor.revokeDoctorAccess(ariaID, shareItem)

    let revokedRecord = null
    if (toSign && toSign.decoded) {
      revokedRecord = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )
    }

    return revokedRecord
  }

  public async _listRecordAccesskeys(txid: string): Promise<string[]> {
    const accessKeys = await this._APIAccessor.listrecordaccesskeys(txid)

    let arrayOfAriaIDSharedTo = []
    let values = {}
    if (accessKeys && accessKeys.accesskeys) {
      const array = accessKeys.accesskeys
      for (let i = 0; i < array.length; ++i) {
        const ariaID = array[i].ariaID

        if (array[i].data.expiration !== undefined) values[ariaID] = array[i].data.expiration
        if (array[i].data.expiration === 0) continue

        arrayOfAriaIDSharedTo.push(ariaID)
      }
    }

    return arrayOfAriaIDSharedTo
  }

  //Records shared to a doctor
  public async listAccesskeys(ariaID: string): Promise<string[]> {
    const keys = await this._APIAccessor.listAccesskeys(ariaID)
    const array = []
    if (keys) {
      const accessKeys = keys

      accessKeys.forEach((element: KeyInfo): any => {
        array.push(element.data.recordTxid)
      })
    }
    return array
  }

  public async getUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }

  public getUserRecords(): RecordDetails[] {
    return this._allRecords
  }

  public async getAllRecords(): Promise<number> {
    const profile = await this.getUserProfile()
    if (profile && profile.ariaID) {
      const records = await this._APIAccessor.getPtLatestRecordsAsync(profile.ariaID, 0)

      if (records && records.records) {
        const allRecords = records.records
        let filteredRecords = []

        allRecords.forEach((item): void => {
          if (item.keys.includes('root'))
            filteredRecords.push(item)
        })

        this._allRecords = filteredRecords
        this._numberOfRecords = filteredRecords.length
      }
      return this._numberOfRecords
    }
  }

  //Set Expiration
  public async revokeFutureAccess(ariaID: string): Promise<{ txid?: string; error?: string }> {
    const profile = await this.getUserProfile()
    const toSign = await this._APIAccessor.revokeFutureAccess(ariaID)

    let revoked = null
    if (toSign && toSign.decoded) {
      revoked = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )
    } else return { error: JSON.parse(toSign).error }
    return revoked
  }

  public async grantFutureAccess(ariaID: string): Promise<{ txid?: string; error?: string }> {
    const profile = await this.getUserProfile()
    const toSign = await this._APIAccessor.grantFutureAccess(ariaID)

    let granted = null
    if (toSign && toSign.decoded) {
      granted = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )
    } else return { error: JSON.parse(toSign).error }
    return granted
  }

  public async shareRecord(shareTo: string, recordTxid: string, expiration?: string, withNotif?: boolean):
    Promise<{ txid?: string; message?: string }> {

    const profile = await this.getUserProfile()
    const isDoctorPubKeyAlreadyInCache = await this._LocalDBAccessor.getDoctorInfoInCache(shareTo)
    const record = await this._LocalDBAccessor.getRecordInCache(recordTxid)

    let info
    if (isDoctorPubKeyAlreadyInCache === null) {
      info = await this._APIAccessor.getDoctorPublicKey(shareTo)
      if (info && info.publicKey)
        await this._LocalDBAccessor.storeDoctorInfo(shareTo, info.publicKey)
      else return JSON.parse(info)
    }
    else info = isDoctorPubKeyAlreadyInCache

    const accesskey = eciesEncrypt(info.publicKey, record.randomKey)
    const sendPushNotif = withNotif !== undefined && withNotif !== null ? withNotif : true

    const params = {
      recordTxid,
      accesskey
    }

    if (expiration !== undefined)
      params['expiration'] = expiration

    const toSign = await this._APIAccessor.shareRecord(
      shareTo,
      params,
      sendPushNotif
    )

    let sharedRecord = null
    if (toSign && toSign.decoded !== undefined && toSign.decoded !== null) {
      sharedRecord = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )
    }

    return sharedRecord
  }

  public async getAllFavoriteDoctors(): Promise<any> {
    const resp = await this._APIAccessor.fetchFavDoctors()
    if (resp.favoriteDoctors) return resp.favoriteDoctors
    else return []
  }

  public async addFavorite(ariaID: string): Promise<void> {
    const resp = await this._APIAccessor.fetchFavDoctors()
    const favoriteDoctors = resp.favoriteDoctors
    favoriteDoctors.push(ariaID)
    const info = { favoriteDoctors }
    await this._APIAccessor.sendupdatedDataToAPIAsync(info)
  }

  public async removeFavorite(ariaID: string): Promise<void> {
    const resp = await this._APIAccessor.fetchFavDoctors()
    const favoriteDoctors = resp.favoriteDoctors
    const index = favoriteDoctors.indexOf(ariaID)

    if (index !== -1) favoriteDoctors.splice(index, 1)
    const info = { favoriteDoctors }
    await this._APIAccessor.sendupdatedDataToAPIAsync(info)
  }

}