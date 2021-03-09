import CoreResultObject, { AriaCore, CRO, CoreResult } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { UserProfile } from '../types'
import { eciesDecrypt } from '../ur3/signtxbundled'
import CryptoJS from 'crypto-js'
import CleanHl7 from '../ur3/declutter'
import { devConsoleLog } from '../ur3/utilities'


declare const Promise: any
type AsyncCRO = Promise<CoreResultObject>
const AsyncCRO = Promise


export default class DrDashboardCore extends AriaCore {

  private _profile = { ariaID: '' }

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)
    this.getUserProfile()
  }

  public async getUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }

  public async fetchUserProfile(): Promise<void> {
    const existingInfo = await this.getUserProfile()
    const profile = await this._APIAccessor.fetchMyDoctorProfile(existingInfo.ariaID)

    if (profile.error || profile.message) return profile.message || profile.error

    devConsoleLog('fetchUserProfile: ', profile)
    if (profile) await this._LocalDBAccessor.updateDoctorProfile(profile)
  }

  public async getPatientList(): Promise<any> {
    let resp = await this._APIAccessor.getPatientList()

    if (typeof resp === 'string') resp = JSON.parse(resp)
    if (resp.message && resp.message.toLowerCase().includes('authentication error'))
      return CRO(CoreResult.AUTHENTICATION_ERROR, { message: resp.message })
    else return CRO(CoreResult.OK, { list: resp })
  }

  public async getDemoPatientList(): Promise<any> {
    const patientList = []
    const patient1 =
    {
      blocktime: '1579744642',
      info: {
        _id: '5e28fcf9482de206404demo1',
        dateOfBirth: '2001-01-22T16:00:00.000Z',
        fullName: 'Initial Patient',
        gender: 'female',
        ariaID: 'a12bc34'
      }
    }
    const patient2 = {
      blocktime: '1579744642',
      info: {
        _id: '5e28fcf9482de206404demo2',
        dateOfBirth: '2001-01-22T16:00:00.000Z',
        fullName: 'Patient',
        gender: 'male',
        ariaID: 'a12bc56'
      }
    }

    patientList.push(patient1)
    patientList.push(patient2)

    return patientList
  }

  public async getPatientRecord(profile: UserProfile, txid: string): Promise<any> {
    if (txid) {
      let item = await this._APIAccessor.getPatientRecord(txid)

      const { accesskey, recordItemData } = item.record

      if (recordItemData.invalid === true) return ''

      const rKey = eciesDecrypt(profile.cryptoKeys.privateKey, accesskey)
      const bytes = CryptoJS.AES.decrypt(recordItemData.emr, rKey)
      const data = bytes.toString(CryptoJS.enc.Utf8)
      const decluttered = new CleanHl7(JSON.parse(data))
      return JSON.stringify(decluttered.data, null, ' ')

    }
    return ''
  }

  public async getPatientInfo(ariaID: string): AsyncCRO {
    return await this._APIAccessor.getPatientInfo(ariaID)
  }
}