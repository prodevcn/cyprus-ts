import { APIFetcher } from '../accessors/BaseAccessor'
import CoreResultObject, { AriaCore, CRO, CoreResult } from './AriaCore'
import { RecordDetails, UserProfile } from '../types'
import { DoctorDetails } from '../accessors/AriaAPIAccessor'
import { devConsoleLog } from '../ur3/utilities'

interface KeyInfo {
  blocktime: string;
  data: {
    accesskey: string;
    recordTxid: string;
  };
  txid: string;
}

export default class DrProfileCore extends AriaCore {

  private _numberOfRecords = 0
  private _allRecords
  private _userProfile: UserProfile
  private _devSMSOTP: string = null
  public __devTest_GetSMSOTP = (): string => this._devSMSOTP

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)
    this.getUserProfile()
  }

  public async validatePasscode(passcode): Promise<CoreResultObject> {
    return this._APIAccessor.validatePasscode(this._userProfile.ariaID, passcode)
  }

  public async listAccesskeys(ariaID: string): Promise<KeyInfo[]> {
    const keys = await this._APIAccessor.listAccesskeys(ariaID)
    const array = []
    if (keys) {
      const accessKeys = keys

      accessKeys.forEach((element: KeyInfo): void => {
        array.push(element.data.recordTxid)
      })
    }
    return array
  }

  public async getUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._userProfile = profile
    return this._userProfile
  }

  public async getDoctorProfile(): Promise<any> {
    const user = await this.getUserProfile()
    const profile = await this._APIAccessor.fetchMyDoctorProfile(user.ariaID)

    const { ariaID, title, firstName, surname, gender, specialization, institution,
      licenseNumber, dateOfBirth, phone, email, shareContactDetails } = profile

    const doctor = {
      ariaID,
      title,
      firstName,
      surname,
      gender,
      institution,
      specialization,
      dateOfBirth,
      licenseNumber,
      phone: phone.value,
      email: email.value,
      isEmailVerified: email.verified,
      shareContactDetails
    }

    await this._LocalDBAccessor.updateDoctorProfile(profile)
    return doctor
  }

  public getUserRecords(): RecordDetails[] {
    return this._allRecords
  }

  public async getAllRecords(): Promise<number> {

    if (this._userProfile && this._userProfile.ariaID) {
      const records = await this._APIAccessor.getPtLatestRecordsAsync(this._userProfile.ariaID, 0)

      if (records && records.records) {
        this._allRecords = records.records
        this._numberOfRecords = records.records.length
      }
      return this._numberOfRecords
    }
  }

  public async checkFutureAccess(doctor: DoctorDetails): Promise<boolean> {
    return await this._APIAccessor.hasfutureaccess(doctor.ariaID)
  }

  public async getAllFavoriteDoctors(): Promise<any> {
    const resp = await this._APIAccessor.fetchFavDoctors()
    if (resp.favoriteDoctors) return resp.favoriteDoctors
    else return []
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

  public async validateUpdateOTPAsync(values: any): Promise<CoreResultObject> {
    const profile = await this.getUserProfile()
    return await this._APIAccessor.verifyDrOTP(profile.ariaID, values.phone, values.otp)
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

  public async updateDoctorDetails(values: any): Promise<CoreResultObject> {
    devConsoleLog('updateDoctorDetails values: ', values)
    const profile = await this.getUserProfile()
    const createdIssue = await this._APIAccessor.updateDoctorDetails(values, profile.ariaID)

    if (createdIssue.issueID && createdIssue.isOK())
      await this._LocalDBAccessor.addDoctorUpdateIssue(profile.ariaID, createdIssue.issueID, values)

    return createdIssue
  }

  public async sendupdatedDoctorToAPIAsync(values: any): Promise<CoreResultObject> {
    return this._APIAccessor.sendupdatedDoctorToAPIAsync(values)
  }

  public async getDoctorIssueInfo(ariaID: string): Promise<any> {
    return this._LocalDBAccessor.getDoctorIssueInfo(ariaID)
  }

  public async removeDoctorUpdateIssue(issueID: string, approvedInfo: any): Promise<any> {
    devConsoleLog('removeDoctorUpdateIssue: ', issueID)
    return this._LocalDBAccessor.removeDoctorUpdateIssue(issueID, approvedInfo)
  }

  public async resendSMSOTP(): Promise<CoreResultObject> {
    const resendSMSOTPresult = await this._APIAccessor
      .resendSMSOTP(this._userProfile.ariaID)

    if (resendSMSOTPresult._devSMSOTP)
      this._devSMSOTP = resendSMSOTPresult._devSMSOTP
    else if (this._devSMSOTP) // and no updated OTP received
      this._devSMSOTP = 'SMS OTP resend requested'

    return resendSMSOTPresult
  }

  public async verifyEmailAsync(values: any): Promise<CoreResultObject> {
    const accessorResult = await this._APIAccessor
      .verifyDrEmail(this._userProfile.ariaID, values.email, values.emailToken)

    if (!accessorResult.isOK())
      this._returnInvalidOTPIfNoErrorMessage(accessorResult)

    return accessorResult
  }

  public requestVerifyEmailAsync(): Promise<CoreResultObject> {
    return this._APIAccessor
      .requestVerifyDrEmail(this._userProfile.ariaID)
  }

  public _returnInvalidOTPIfNoErrorMessage(accessorResult: CoreResultObject): CoreResultObject {
    const { message } = accessorResult
    if (message)
      return CRO(CoreResult.NOK, { message })
    return CRO(CoreResult.INVALID_OTP)
  }

}