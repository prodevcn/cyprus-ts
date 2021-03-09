import { __DEV_SKIP__ } from '../../env'

import CoreResultObject, { AriaCore, CoreResult, CRO } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { PtRegistrationData } from '../accessors/AriaAPIAccessor'
import { ONBOARDING, ONBOARDING_PT } from '../routes'
import { ObjectOfPrimitives, AnyPrimitiveType, UserProfile, CryptoKeys } from '../types'
import { AriaKeyStringStorage } from '../ur3/localdb'
import { devConsoleLog } from '../ur3/utilities'
import { signRawTransaction } from '../ur3/signtxbundled'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
type AsyncCRO = Promise<CoreResultObject>
const AsyncCRO = Promise

export interface CoreForOnboarding extends AriaCore {
  isPhoneAlreadyUsed(phone: string);
  getCoreFieldValue(key: string): AnyPrimitiveType;
  canChangeOTPPhoneNumber(): boolean;
  setPersonalDataUseConsentAsync(): CoreResultObject;
  hasAlreadyConsentedAndCreatedPasscode(): boolean;
  resetPasscodeOnBackToPasscodeScreen(): void;
  getNextPageAfter(currentPage: string): string;
  createPasscodeAsync(regData: ObjectOfPrimitives): AsyncCRO;
  validateCreateAccountOTPAsync(regData: ObjectOfPrimitives): AsyncCRO;
  _returnInvalidOTPIfNoErrorMessage(accessorResult: CoreResultObject): CoreResultObject;
  sendRegistrationDataToAPIAsync(): AsyncCRO;
  getButtonTKeyForEmailVerification(): string;
  getButtonTKeyForSeedPhrasePage(): string;
  verifyEmailAsync(emailToken): AsyncCRO;
  requestVerifyEmailAsync(): AsyncCRO;
  setRegistrationData(regData: ObjectOfPrimitives): CoreResultObject;
  storeWalletKeysInDbASync(walletAndKeys: CryptoKeys): Promise<void>;
  /* eslint-disable-next-line @typescript-eslint/camelcase */
  __devTest_GetSMSOTP(): string;
  updatePhoneNumber(phone: string): AsyncCRO;
  resendSMSOTP(newPhone: string): Promise<CoreResultObject>;
}

export default class CreatePtAccountCore extends AriaCore implements CoreForOnboarding {
  private _registrationData: PtRegistrationData
  private _ariaID: string = null
  private _isOTPAlreadyVerified: boolean = false
  private _devSMSOTP: string = null
  public __devTest_GetSMSOTP = (): string => this._devSMSOTP

  public async getAriaID(): Promise<string> {
    let ariaID = this._ariaID
    if (!ariaID) {
      const profile = await this.getProfileOfLoggedInUser()
      ariaID = profile.ariaID
      this._ariaID = profile.ariaID
    }

    return ariaID
  }


  public getUserProfile(): UserProfile {
    const {
      fullName,
      gender,
      dateOfBirth,
      phone,
      email,
      shareContactDetails,
      isEmailVerified
    } = this._registrationData
    return {
      ariaID: this._ariaID,
      fullName,
      gender,
      dateOfBirth,
      phone,
      email,
      shareContactDetails,
      isEmailVerified,
      cryptoKeys: null
    }
  }

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this._registrationData = {
      fullName: null,
      gender: null,
      dateOfBirth: null,
      phone: null,
      email: null,
      shareContactDetails: false,
      isEmailVerified: false,
      personalDataUseConsentDateTime: null,
      exponentPushToken: null,
      passcode: null,
      otp: null
    }
  }

  /* NOTE Start of implementations for CoreForOnboarding */
  public getCoreFieldValue(key: string): AnyPrimitiveType {
    return this._registrationData[key]
  }

  public canChangeOTPPhoneNumber = (): boolean => true;

  public setPersonalDataUseConsentAsync(): CoreResultObject {
    this._registrationData.personalDataUseConsentDateTime = new Date().toISOString().substr(0, 10)
    return CRO()
  }

  public hasAlreadyConsentedAndCreatedPasscode(): boolean {
    const regData = this._registrationData
    return regData.passcode != null && regData.personalDataUseConsentDateTime != null
  }

  public resetPasscodeOnBackToPasscodeScreen(): void {
    this._registrationData.passcode = null
  }

  public canVerifyEmail(): boolean {
    return this._registrationData.email != null
  }

  public isChangingEmailOnly(): boolean {
    return (this._ariaID != null && this._isOTPAlreadyVerified)
  }

  public hasAriaID(): boolean {
    return (this._ariaID != null)
  }

  public async updatePhoneNumber(phone: string): AsyncCRO {
    const accessorResult = await this._APIAccessor
      .changePtPhone(this._ariaID, phone)

    if (!accessorResult.isOK())
      return this._returnAlreadyInUseIfNoErrorMessage(accessorResult)

    this._registrationData['phone'] = phone
    return CRO()

  }

  public _returnAlreadyInUseIfNoErrorMessage(accessorResult: CoreResultObject): CoreResultObject {
    const { message } = accessorResult
    if (message && !message.startsWith('E11000 duplicate'))
      return CRO(CoreResult.NOK, { message })
    return CRO(CoreResult.PHONE_ALREADY_IN_USE)
  }

  public getNextPageAfter(currentPage: string): string {
    switch (currentPage) {
      case ONBOARDING_PT.EnterPtContactDetails:
        if (this._registrationData.passcode != null)
          return ONBOARDING.EnterOTP
        else return ONBOARDING.ConsentToPersonalDataUse

      case ONBOARDING.CreatePasscode:
        return ONBOARDING.EnterOTP

      case ONBOARDING.EnterOTP:
        return ONBOARDING.PhoneNumberIsVerified

      case ONBOARDING.ChangeContactDetails:
        return ONBOARDING_PT.EnterPtContactDetails

      case ONBOARDING.EnterEmailToken:
        return ONBOARDING.ChangeEmail

      case ONBOARDING.ChangeEmail:
        return ONBOARDING.EnterEmailToken

      case ONBOARDING.EmailIsVerified:
        return ONBOARDING_PT.YourPtAriaID

      case ONBOARDING.WalletGenerator:
        return ONBOARDING_PT.StorageOptions
    }

    return ''
  }

  public async createPasscodeAsync(regData?: ObjectOfPrimitives): AsyncCRO {
    if (regData == null) {
      // go straight to _APIAccessor.createPatientAccount
    } else if (this._registrationData.passcode == null) {
      if (typeof regData.passcode === 'string') {
        if (!(/^[0-9]+$/).test(regData.passcode))
          return CRO(CoreResult.INVALID_PASSCODE)
        this._registrationData.passcode = regData.passcode
      }
      return CRO(CoreResult.CONFIRM_PASSCODE)
    } else if (this._registrationData.passcode !== regData.passcode) {
      this._registrationData.passcode = null
      return CRO(CoreResult.PASSCODE_MISMATCH)
    }

    this.setRegistrationData(regData)

    return this.sendRegistrationDataToAPIAsync()
  }

  public async validateCreateAccountOTPAsync(regData: ObjectOfPrimitives): AsyncCRO {
    this.setRegistrationData(regData)

    const accessorResult = await this._APIAccessor
      .validateOTPForCreatePtAccountASync(this._registrationData, this._ariaID)

    if (!accessorResult.isOK())
      return this._returnInvalidOTPIfNoErrorMessage(accessorResult)

    this._isOTPAlreadyVerified = true
    await AriaKeyStringStorage.setItem('userPasscodeAccCreation', this._registrationData.passcode)
    return this._storeUserToLocalDBAndSetAsLoggedInAsync()
  }

  public async verifyEmailAsync(emailToken: string): AsyncCRO {
    const accessorResult = await this._APIAccessor
      .verifyPtEmail(this._ariaID, this._registrationData.email, emailToken)

    if (!accessorResult.isOK())
      this._returnInvalidOTPIfNoErrorMessage(accessorResult)

    this._registrationData.isEmailVerified = true
    this._LocalDBAccessor.updatePatientInfoAsync(this._ariaID, this._registrationData)
    return accessorResult
  }

  public requestVerifyEmailAsync(): AsyncCRO {
    return this._APIAccessor
      .requestVerifyPtEmail(this._ariaID)
  }

  public _returnInvalidOTPIfNoErrorMessage(accessorResult: CoreResultObject): CoreResultObject {
    const { message } = accessorResult
    if (message)
      return CRO(CoreResult.NOK, { message })
    return CRO(CoreResult.INVALID_OTP)
  }

  public setRegistrationData(regData: ObjectOfPrimitives): CoreResultObject {
    for (const key in regData)
      this._registrationData[key] = regData[key]

    return CRO()
  }

  public async storeWalletKeysInDbASync(walletAndKeys: CryptoKeys): Promise<void> {
    const ariaID = await this.getAriaID()
    return this._LocalDBAccessor.storeWalletAndKeys(ariaID, walletAndKeys)
  }

  /* NOTE End of implementations for CoreForOnboarding */

  public async setContactDetailsAsync(regData: { phone: string; email: string; shareContactDetails: boolean }): AsyncCRO {
    const newPhone = regData.phone.replace(/^0+/, '63')
    const accessorResult = await this._APIAccessor
      .isPhoneNumberAlreadyInUseByAnotherPatientAsync(newPhone)

    if (accessorResult == null)
      return CRO(CoreResult.NETWORK_ERROR)

    const isPhoneAlreadyUsedByAnotherPatient = accessorResult
    if (isPhoneAlreadyUsedByAnotherPatient)
      return CRO(CoreResult.PHONE_ALREADY_IN_USE)

    const newRegData = {
      phone: newPhone,
      email: regData.email,
      shareContactDetails: regData.shareContactDetails
    }

    this.setRegistrationData(newRegData)

    if (this.hasAlreadyConsentedAndCreatedPasscode()) {
      const sendToApiResult = await this.sendRegistrationDataToAPIAsync()
      if (!sendToApiResult.isOK())
        return sendToApiResult

      return CRO(CoreResult.ENTER_OTP_AFTER_CHANGE_CONTACT)
    }

    return CRO()
  }

  public async sendRegistrationDataToAPIAsync(): AsyncCRO {
    const ariaIDWithTemporaryDevSMSOTP = await this._APIAccessor
      .createPatientAccountAsync(this._registrationData)

    if (ariaIDWithTemporaryDevSMSOTP._devSMSOTP)
      this._devSMSOTP = ariaIDWithTemporaryDevSMSOTP._devSMSOTP
    if (ariaIDWithTemporaryDevSMSOTP.ariaID)
      this._ariaID = ariaIDWithTemporaryDevSMSOTP.ariaID

    return ariaIDWithTemporaryDevSMSOTP
  }

  public async resendSMSOTP(newPhone: string): Promise<CoreResultObject> {
    const resendSMSOTPresult = await this._APIAccessor
      .resendSMSOTPforCreatePtAccountAsync(this._ariaID, newPhone)

    if (resendSMSOTPresult._devSMSOTP)
      this._devSMSOTP = resendSMSOTPresult._devSMSOTP
    else if (this._devSMSOTP) // and no updated OTP received
      this._devSMSOTP = 'SMS OTP resend requested'

    return resendSMSOTPresult
  }

  private async _storeUserToLocalDBAndSetAsLoggedInAsync(): AsyncCRO {
    if (!__DEV_SKIP__) {
      const result = await this._APIAccessor.validatePasscode(
        this._ariaID, this._registrationData.passcode)

      if (result.isOK() && result.token) {
        await AriaKeyStringStorage.setItem('loggedInUserToken', result.token)
        await this._LocalDBAccessor.addPatientAndSetAsLoggedInAsync(this._ariaID,
          this._registrationData)
      } else return CRO(CoreResult.NOK)
    }

    return CRO()
  }

  public getButtonTKeyForEmailVerification = (): string => 'onboarding:Changeyouremailaddress'
  public getButtonTKeyForSeedPhrasePage = (): string => 'onboardingDr:SeeStorageOptions'

  public async changePtEmailAsync(newEmail: string): AsyncCRO {
    if (newEmail === this._registrationData.email) return CRO(CoreResult.SAME_EMAIL_INPUT)

    const sendNewEmailToAPI = await this._APIAccessor
      .changePtEmail(this._ariaID, newEmail)

    if (!sendNewEmailToAPI.isOK())
      return sendNewEmailToAPI
    this.setRegistrationData({ email: newEmail })

    // const sendOTPToNewEmail = await this.requestVerifyEmailAsync()
    // if (!sendOTPToNewEmail.isOK())
    //   return sendOTPToNewEmail

    return CRO(CoreResult.ENTER_OTP_AFTER_CHANGE_CONTACT)
  }

  public async acceptHospitalConnectionAsync(hospitalId: string): AsyncCRO {
    let ariaID = this._ariaID
    if (ariaID === null) {
      const profile = await this.getProfileOfLoggedInUser()
      ariaID = profile.ariaID
    }

    const accessorResult = await this._APIAccessor
      .acceptHospitalConnection(ariaID, hospitalId)

    if (!accessorResult.isOK()) {
      if (accessorResult.message) return CRO(CoreResult.NOK, { message: accessorResult.message })
      return CRO(CoreResult.INVALID_QR)
    }

    return accessorResult
  }

  public async checkWalletKeys(): Promise<boolean> {
    return await this._LocalDBAccessor.checkWalletKeys()
  }

  public async sendHospitalConsent(hospitalId: string): Promise<{ txid?: string; message?: string }> {
    devConsoleLog('sendHospitalConsent create pt account')
    const profile = await this.getProfileOfLoggedInUser()
    //connect to provider consent signing
    const toSign = await this._APIAccessor.sendHospitalConsent(hospitalId)
    devConsoleLog('toSign: ', toSign)
    if (toSign && toSign.decoded) {
      const consent = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )

      devConsoleLog('consent: ', consent)
      return consent
    } else CRO(CoreResult.NOK, { message: 'Error occured' })
  }



  public async getProfileOfLoggedInUser(): Promise<UserProfile> {
    const userProfile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    return userProfile
  }

  public async updateUserProfile(data: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
  }): AsyncCRO {

    this.setRegistrationData(data)

    const sendToApiResult = await this._APIAccessor.sendupdatedDataToAPIAsync(data)
    if (!sendToApiResult.isOK())
      return sendToApiResult

    await this.updateInfoInDB(data)
    return CRO()
  }

  public async updateInfoInDB(updatedData): Promise<void> {
    const profile = await this.getProfileOfLoggedInUser()
    for (const key in updatedData) {
      if (profile[key] !== updatedData[key])
        profile[key] = updatedData[key]
    }
    this._LocalDBAccessor.updatePatientInfoAsync(profile.ariaID, profile)
  }
  public async isPhoneAlreadyUsed(phone: string): Promise<any> {
    return this._APIAccessor.isPhoneNumberAlreadyInUseByAnotherPatientAsync(phone)
  }

}