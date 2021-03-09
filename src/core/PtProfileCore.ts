import { APIFetcher } from '../accessors/BaseAccessor'
import CoreResultObject, { AriaCore, CoreResult, CRO } from './AriaCore'
import { ObjectOfPrimitives, UserProfile } from '../types'
import { devConsoleLog } from '../ur3/utilities'
import { AriaKeyStringStorage } from '../ur3/localdb'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
type AsyncCRO = Promise<CoreResultObject>
const AsyncCRO = Promise

export default class PtProfileCore extends AriaCore {
  private _userProfile: UserProfile
  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this._getUserProfile()

  }

  public async validatePasscode(passcode): Promise<CoreResultObject> {
    return this._APIAccessor.validatePasscode(this._userProfile.ariaID, passcode)
  }

  public async _getUserProfile(): Promise<CoreResultObject> {
    this._userProfile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    const { ariaID } = this._userProfile

    const demo = await AriaKeyStringStorage.getItem('BrowseDemoProfile')
    if (demo === 'true') return CRO()

    const fetchedProfile = await this._APIAccessor.fetchPtProfile(ariaID)

    if (fetchedProfile.info) {
      const { fullName, gender, dateOfBirth, email, phone, shareContactDetails } = fetchedProfile.info

      const personalData = { fullName, gender, dateOfBirth, email: email.value, phone: phone.value }
      const isEmailVerified = email.verified
      const personalSettings = { shareContactDetails, isEmailVerified }

      await this._LocalDBAccessor._updateUserInfoAsync(
        ariaID,
        JSON.stringify(personalData),
        JSON.stringify(personalSettings)
      )

      this._userProfile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
      return CRO(CoreResult.OK)
    } else if (fetchedProfile.message) {
      if (fetchedProfile.message.toLocaleLowerCase().includes('authentication error')) {
        return CRO(CoreResult.AUTHENTICATION_ERROR)
      }
      return CRO(CoreResult.NOK, { message: fetchedProfile.message })
    }
  }

  public getUserProfile(): UserProfile {
    return this._userProfile
  }

  public async updateUserProfile(regData: {
    fullName?: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    shareContactDetails?: boolean;
  }): AsyncCRO {


    regData.phone = regData.phone.replace('+', '')
    if (regData.phone && this._userProfile.phone !== regData.phone) {
      regData.phone = regData.phone.replace(/^0+/, '63')//TODO check if needed

      const accessorResult = await this._APIAccessor
        .isPhoneNumberAlreadyInUseByAnotherPatientAsync(regData.phone)

      if (accessorResult == null)
        return CRO(CoreResult.NETWORK_ERROR)

      const isPhoneAlreadyUsedByAnotherPatient = accessorResult
      if (isPhoneAlreadyUsedByAnotherPatient)
        return CRO(CoreResult.PHONE_ALREADY_IN_USE)
    }

    let prevEmail = this._userProfile.email
    if (regData.email && prevEmail !== regData.email)
      this._userProfile.isEmailVerified = false

    const newRegData = this.setRegistrationData(regData)
    devConsoleLog('newRegData: ', newRegData)

    if (newRegData !== {}) {
      const sendToApiResult = await this._APIAccessor.sendupdatedDataToAPIAsync(newRegData)
      devConsoleLog('sendToApiResult: ', sendToApiResult)
      if (!sendToApiResult.isOK())
        return sendToApiResult
      else if (newRegData.phone) {
        if (newRegData.email && prevEmail !== newRegData.email)
          return CRO(CoreResult.ENTER_OTP_AND_VERIFY_EMAIL)

        return CRO(CoreResult.ENTER_OTP_AFTER_CHANGE_CONTACT)
      } else if (newRegData.email) {
        return CRO(CoreResult.VERIFY_EMAIL)
      }
    }

    return CRO()
  }

  public setRegistrationData(regData: ObjectOfPrimitives): ObjectOfPrimitives {
    devConsoleLog('this._userProfile: ', this._userProfile)

    let newRegData = {}

    for (const key in regData) {
      if (this._userProfile[key] !== regData[key]) {
        newRegData['fullName'] = regData['fullName']
        newRegData[key] = regData[key]
        this._userProfile[key] = regData[key]
      }
    }
    return newRegData
  }

  public async verifyEmailAsync(emailToken: string): AsyncCRO {
    const { ariaID, email } = this._userProfile
    const accessorResult = await this._APIAccessor
      .verifyPtEmail(ariaID, email, emailToken)

    if (!accessorResult.isOK())
      return this._returnInvalidOTPIfNoErrorMessage(accessorResult)

    this._userProfile.isEmailVerified = true
    this._LocalDBAccessor.updatePatientInfoAsync(
      ariaID,
      this._userProfile
    )
    return accessorResult
  }

  public async validateOTP(otp: string, newPhone: string): AsyncCRO {
    const { ariaID, phone } = this._userProfile

    const accessorResult = await this._APIAccessor
      .validateOTPForUpdateAccountASync(phone, otp, ariaID, newPhone)

    devConsoleLog('accessorResult: ', accessorResult)

    if (!accessorResult.isOK()) {
      devConsoleLog(accessorResult.message)
      return this._returnInvalidOTPIfNoErrorMessage(accessorResult)
    }
    

    return CRO()
  }

  public _returnInvalidOTPIfNoErrorMessage(accessorResult: CoreResultObject): CoreResultObject {
    const { message } = accessorResult
    if (message)
      return CRO(CoreResult.NOK, { message })
    return CRO(CoreResult.INVALID_OTP)
  }

  public updateInfoInDB(): void {
    const { ariaID } = this._userProfile
    this._LocalDBAccessor.updatePatientInfoAsync(ariaID, this._userProfile)
  }

  public async requestVerifyPtEmail(): Promise<CoreResultObject> {
    return this._APIAccessor.requestVerifyPtEmail(this._userProfile.ariaID)
  }

  public async requestVerifyPtPhone(phone: string): Promise<CoreResultObject> {
    return this._APIAccessor.resendSMSOTP(this._userProfile.ariaID, phone)
  }

  public areFieldsEdited(values): boolean {
    for (const key in values) {
      if (values[key] !== this._userProfile[key])
        return true
    }
    return false
  }
}