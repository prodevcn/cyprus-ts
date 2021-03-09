import { __DEV_SKIP__ } from '../../../env'
import CoreResultObject, { AriaCore, CoreResult, CRO } from '../AriaCore'
import { APIFetcher } from '../../accessors/BaseAccessor'
import { DrAccountDetails } from '../../accessors/AriaAPIAccessor'
import { ONBOARDING, ONBOARDING_DR } from '../../routes'
import { ObjectOfPrimitives, AnyPrimitiveType, CryptoKeys } from '../../types'
import { AriaKeyStringStorage } from '../../ur3/localdb'
import { devConsoleLog, formatDate } from '../../ur3/utilities'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
type AsyncCRO = Promise<CoreResultObject>
const AsyncCRO = Promise


export interface CoreForOnboarding extends AriaCore {
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
  resendSMSOTP(): AsyncCRO;
}

export default class CreateDrAccountCore extends AriaCore implements CoreForOnboarding {
  private _doctorAcctDetails: DrAccountDetails
  public getAriaID = (): string => this._doctorAcctDetails.ariaID
  public hasAriaID = (): boolean => this._doctorAcctDetails.ariaID !== null

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this._doctorAcctDetails = {
      accessCode: null,
      ariaID: null,
      phone: null, // retrieved from server
      maskedDrPhone: null,
      otp: null,

      // from server
      title: null,
      firstName: null,
      surname: null,
      fullName: null,
      gender: null,
      dateOfBirth: null,
      email: null,
      specialization: null,
      institution: null,
      licenseNumber: null,

      // user input
      shareContactDetails: false,
      personalDataUseConsentDateTime: null,
      exponentPushToken: null,
      passcode: null
    }
  }

  public getCoreFieldValueForDisplay(key: string): string {
    if (key === 'dateOfBirth') {
      const { dateOfBirth } = this._doctorAcctDetails
      if (dateOfBirth)
        return formatDate(new Date(dateOfBirth).toLocaleDateString())
    }

    return ''
  }

  public async submitDrAccessCodeAsync(accessCode: string): AsyncCRO {
    const phoneWithTemporaryDevSMSOTP = await this._APIAccessor.submitDrAccessCodeAsync(accessCode)
    if (!phoneWithTemporaryDevSMSOTP.isOK())
      return phoneWithTemporaryDevSMSOTP

    const { retrievedData } = phoneWithTemporaryDevSMSOTP

    if (retrievedData) {
      this._doctorAcctDetails.accessCode = accessCode

      if (retrievedData.ariaID)
        this._doctorAcctDetails.ariaID = retrievedData.ariaID
      if (retrievedData.drPhone) {
        this._doctorAcctDetails.maskedDrPhone =
          this._maskPhoneNumber(phoneWithTemporaryDevSMSOTP.retrievedData.drPhone)
      }
      if (retrievedData._devSMSOTP)
        this._devSMSOTP = retrievedData._devSMSOTP
    }

    return phoneWithTemporaryDevSMSOTP
  }

  private _maskPhoneNumber(phone: string): string {
    let masked = ''
    const numOfCharsToSlice = phone.length - 3
    let numOfCharsToMask = numOfCharsToSlice
    if (numOfCharsToMask < 4)
      numOfCharsToMask = 7
    for (let i = 0; i < numOfCharsToMask; ++i)
      masked += '*'
    masked += phone.slice(numOfCharsToSlice)
    return masked
  }

  public async updateEmailAsync(updatedEmail): AsyncCRO {
    if (updatedEmail != this._doctorAcctDetails.email) {
      const changeDrEmail = await this._APIAccessor.changeDrEmail(
        this._doctorAcctDetails.ariaID,
        updatedEmail
      )

      if (!changeDrEmail.isOK())
        return changeDrEmail

      this._doctorAcctDetails.email = updatedEmail
    }

    return CRO()
  }

  public async storeDrSeedPhrase(phrase: string): Promise<CoreResultObject> {
    let response = await this._APIAccessor.storeDrSeedPhrase(this.getAriaID(), phrase)
    return response
  }

  public async validatePasscode(passcode): Promise<any> {
    const response = this._APIAccessor.validatePasscode(this._doctorAcctDetails.ariaID, passcode)
    if (response.token) {
      await AriaKeyStringStorage.setItem('loggedInUserToken', response.token)
    }
    return
  }

  public async resendSMSOTP(): AsyncCRO {
    let ariaID = this._doctorAcctDetails.ariaID
    const resendSMSOTPresult = await this._APIAccessor
      .resendSMSOTPforCreatePtAccountAsync(ariaID)

    if (resendSMSOTPresult._devSMSOTP)
      this._devSMSOTP = resendSMSOTPresult._devSMSOTP
    else if (this._devSMSOTP) // and no updated OTP received
      this._devSMSOTP = 'SMS OTP resend requested'

    return resendSMSOTPresult
  }


  public async registerDrToHealthNetwork(walletAndKeys: CryptoKeys): Promise<CoreResultObject> {
    let response = await this._APIAccessor.registerDrToHealthNetwork(this.getAriaID(), walletAndKeys)
    if (!response.isOK()) {
      await this.validatePasscode(this._doctorAcctDetails.passcode)
      response = await this._APIAccessor.registerDrToHealthNetwork(this.getAriaID(), walletAndKeys)
    }

    return response

  }

  /* NOTE Start of implementations for CoreForOnboarding */
  public getCoreFieldValue(key: string): AnyPrimitiveType {
    if (key === 'phone' && this._doctorAcctDetails.maskedDrPhone)
      return this._doctorAcctDetails.maskedDrPhone

    return this._doctorAcctDetails[key]
  }
  public canChangeOTPPhoneNumber = (): boolean => false;

  public setPersonalDataUseConsentAsync(): CoreResultObject {
    this._doctorAcctDetails.personalDataUseConsentDateTime = new Date().toISOString().substr(0, 10)
    return CRO()
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  public hasAlreadyConsentedAndCreatedPasscode(): boolean {
    const regData = this._doctorAcctDetails
    return regData.passcode != null && regData.personalDataUseConsentDateTime != null
  }
  public resetPasscodeOnBackToPasscodeScreen(): void {
    this._doctorAcctDetails.passcode = null
  }
  public getNextPageAfter(currentPage: string): string {
    switch (currentPage) {
      case ONBOARDING.EnterOTP:
        return ONBOARDING_DR.ConfirmDrPersonalDetails

      case ONBOARDING.CreatePasscode:
        return ONBOARDING.EnterEmailToken

      case ONBOARDING.EnterEmailToken:
        return ONBOARDING_DR.IntroductionDr

      case ONBOARDING.EmailIsVerified:
        return ONBOARDING_DR.IntroductionDr

      case ONBOARDING.WalletGenerator:
        return ONBOARDING_DR.StorageOptionsDr

      default:
        return ''
    }
  }
  public async createPasscodeAsync(regData: ObjectOfPrimitives): AsyncCRO {
    if (regData == null) {
      // go straight to _APIAccessor.sendDoctorAccountDetailsAsync
    } else if (this._doctorAcctDetails.passcode == null) {
      if (typeof regData.passcode === 'string') {
        if (!(/^[0-9]+$/).test(regData.passcode))
          return CRO(CoreResult.INVALID_PASSCODE)
        this._doctorAcctDetails.passcode = regData.passcode
      }

      return CRO(CoreResult.CONFIRM_PASSCODE)
    } else if (this._doctorAcctDetails.passcode !== regData.passcode) {
      this._doctorAcctDetails.passcode = null
      return CRO(CoreResult.PASSCODE_MISMATCH)
    }

    this.setRegistrationData(regData)

    return this.sendRegistrationDataToAPIAsync()
  }

  public async validateCreateAccountOTPAsync(regData: { otp: string }): AsyncCRO {
    this._doctorAcctDetails.otp = regData.otp
    const accessorResult = await this._APIAccessor
      .validateOTPForRetrieveDrAccountAsync(this._doctorAcctDetails)

    if (!accessorResult.isOK())
      return this._returnInvalidOTPIfNoErrorMessage(accessorResult)

    const noDrDetailsReceived = !accessorResult.retrievedData || !accessorResult.retrievedData.doctorDetails
    if (noDrDetailsReceived)
      return CRO(CoreResult.INVALID_OTP, { message: 'Incomplete data received' })

    const initialDrDetails = accessorResult.retrievedData.doctorDetails

    const {
      title, firstName, surname, fullName, gender, dateOfBirth, phone, email, specialization, institution, licenseNumber,
      ariaID
    } = initialDrDetails

    const a = this._doctorAcctDetails
    a.fullName = fullName
    a.title = title
    a.surname = surname
    a.firstName = firstName
    a.gender = gender
    a.dateOfBirth = dateOfBirth
    if (phone) {
      a.phone = phone
      a.maskedDrPhone = null
    }
    a.email = email
    a.specialization = specialization
    a.institution = institution
    a.licenseNumber = licenseNumber

    const receivedDifferentAriaID = ariaID !== a.ariaID
    if (receivedDifferentAriaID)
      return CRO(CoreResult.INVALID_OTP, { message: 'Invalid data received' })
    a.ariaID = ariaID

    return CRO()
  }

  public _returnInvalidOTPIfNoErrorMessage(accessorResult: CoreResultObject): CoreResultObject {
    const { message } = accessorResult
    if (message)
      return CRO(CoreResult.NOK, { message })
    return CRO(CoreResult.INVALID_OTP)
  }

  public async sendRegistrationDataToAPIAsync(): AsyncCRO {
    const updatedAcctDetailsAccepted = await this._APIAccessor
      .sendDoctorAccountDetailsAsync(this._doctorAcctDetails)

    devConsoleLog('updatedAcctDetailsAccepted: ', updatedAcctDetailsAccepted)

    if (updatedAcctDetailsAccepted.token) {
      await AriaKeyStringStorage.setItem('loggedInUserToken', updatedAcctDetailsAccepted.token)
      await this._APIAccessor.requestVerifyDrEmail(this._doctorAcctDetails.ariaID)
    }

    return updatedAcctDetailsAccepted
  }

  public getButtonTKeyForEmailVerification = (): string => 'onboardingDr:Illverifylater'
  public getButtonTKeyForSeedPhrasePage = (): string => 'onboardingDr:SeeStorageOptions'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async verifyEmailAsync(emailToken: any): AsyncCRO {
    const accessorResult = await this._APIAccessor
      .verifyDrEmail(this._doctorAcctDetails.ariaID, this._doctorAcctDetails.email, emailToken)

    if (!accessorResult.isOK())
      this._returnInvalidOTPIfNoErrorMessage(accessorResult)

    return accessorResult
  }

  public requestVerifyEmailAsync(): AsyncCRO {
    return this._APIAccessor
      .requestVerifyDrEmail(this._doctorAcctDetails.ariaID)
  }

  public setRegistrationData(regData: ObjectOfPrimitives): CoreResultObject {
    for (const key in regData)
      this._doctorAcctDetails[key] = regData[key]

    return CRO()
  }

  public async storeUserToLocalDBAndSetAsLoggedInAsync(): AsyncCRO {
    if (!__DEV_SKIP__)
      await this._LocalDBAccessor.addDoctorAndSetAsLoggedInAsync(this._doctorAcctDetails)

    return CRO()
  }

  public storeWalletKeysInDbASync(walletAndKeys: CryptoKeys): Promise<void> {
    return this._LocalDBAccessor.storeWalletAndKeys(this._doctorAcctDetails.ariaID, walletAndKeys)
  }

  private _devSMSOTP: string = null
  public __devTest_GetSMSOTP = (): string => this._devSMSOTP

  public areFieldsEdited(values): boolean {
    for (const key in values) {
      if (values[key] !== this._doctorAcctDetails[key])
        return true
    }
    return false
  }

  public removeUneditedValues(values: DrAccountDetails): any {
    const editedValues = {}
    for (const key in values) {
      if (values[key] !== this._doctorAcctDetails[key])
        editedValues[key] = values[key]
    }

    return editedValues
  }

  public async updateDoctorDetails(values: DrAccountDetails): AsyncCRO {
    const edited = this.removeUneditedValues(values)
    const createdIssue = await this._APIAccessor.updateDoctorDetails(edited, values.ariaID)

    if (createdIssue.issueID && createdIssue.isOK())
      await this._LocalDBAccessor.addDoctorUpdateIssue(this._doctorAcctDetails.ariaID, createdIssue.issueID, edited)

    return createdIssue
  }

  /* NOTE End of implementations for CoreForOnboarding */
}