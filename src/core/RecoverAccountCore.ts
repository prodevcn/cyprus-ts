import { __IS_PATIENT_APP__ } from '../../env'
import CoreResultObject, { AriaCore, CRO, CoreResult } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { RecoverAccountData } from '../accessors/AriaAPIAccessor'
import { AnyPrimitiveType, ObjectOfPrimitives, UserProfile } from '../types'
import { devConsoleLog, splitStringToArray } from '../ur3/utilities'
import { AriaKeyStringStorage } from '../ur3/localdb'
import { generateWalletAndPrivateKeyFromPhrase } from '../ur3/walletgenerator'
import { retrievePushTokenAsync } from '../PushNotifications'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
type AsyncCRO = Promise<CoreResultObject>
const AsyncCRO = Promise

export interface CoreForRecover extends AriaCore {
  getCoreFieldValue(key: string): AnyPrimitiveType;
}

interface ContactDetails {
  phone: string;
  email: string;
  oldEmail: string;
  oldPhone: string;
}

export default class RecoverAccountCore extends AriaCore implements CoreForRecover {
  private _recoverAccountData: RecoverAccountData
  private _ariaID: string = null
  private _devSMSOTP: string = null
  public __devTest_GetSMSOTP = (): string => this._devSMSOTP
  private _profile: UserProfile
  private _isEmailAlreadyVerified: boolean = true

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this._recoverAccountData = {
      oldPhone: null,
      oldEmail: null,
      phone: null,
      email: null,
      otp: null,
      seedPhrase: [],
      passcode: null,
      newContact: false,
      missingInfo: false,
      issueID: null,
      accountRecovered: false
    }
  }

  public resetAllEnteredValues = (): void => {
    const reset = {
      oldPhone: null,
      oldEmail: null,
      phone: null,
      email: null,
      otp: null,
      seedPhrase: [],
      passcode: null,
      newContact: false,
      missingInfo: false,
      issueID: null,
      accountRecovered: false
    }

    this._recoverAccountData = reset
    devConsoleLog('this._recoverAccountData: ', this._recoverAccountData)
  }

  public removeEnteredNewContact = (): void => {
    this._recoverAccountData['phone'] = null
    this._recoverAccountData['email'] = null
    devConsoleLog('this._recoverAccountData: ', this._recoverAccountData)
  }

  public async fetchUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }

  public getUserContact = (): ContactDetails => {
    const { phone, email, oldEmail, oldPhone } = this._recoverAccountData
    return { phone, email, oldEmail, oldPhone }
  }

  public getUserEmail = (): string => {
    const { email } = this._recoverAccountData
    return email
  }

  public haveAccessToContacts = (): any => {
    const { otp } = this._recoverAccountData
    if (otp) return true
    else false
  }

  public async changePtEmail(sentToEmail: string): AsyncCRO {
    await this.fetchUserProfile()
    devConsoleLog('this._profile: ', this._profile)
    const { ariaID, email } = this._profile

    let newMailAdd = sentToEmail ? sentToEmail : email
    return this._APIAccessor
      .changePtEmail(ariaID, newMailAdd)
  }

  public async verifyEmailAsync(values: any): AsyncCRO {
    const { ariaID, email } = this._profile
    let newMail = values.email ? values.email : email
    const accessorResult = await this._APIAccessor
      .verifyPtEmail(ariaID, newMail, values.emailToken)

    if (!accessorResult.isOK())
      return this._returnInvalidOTPIfNoErrorMessage(accessorResult)

    this._profile.isEmailVerified = true
    this._LocalDBAccessor.updatePatientInfoAsync(
      ariaID,
      this._profile
    )
    return accessorResult
  }

  public _returnInvalidOTPIfNoErrorMessage(accessorResult: CoreResultObject): CoreResultObject {
    const { message } = accessorResult
    if (message)
      return CRO(CoreResult.NOK, { message })
    return CRO(CoreResult.INVALID_OTP)
  }

  public async removeDoctorUpdateIssue(issueID: string, approvedInfo: any): Promise<any> {
    return this._LocalDBAccessor.removeDoctorUpdateIssue(issueID, approvedInfo)
  }

  public setMissingInfo = (): void => {
    const { phone, email, oldPhone, oldEmail } = this._recoverAccountData
    this._recoverAccountData['missingInfo'] = true

    if (oldEmail === null && oldPhone === null) {
      this._recoverAccountData['oldPhone'] = phone
      this._recoverAccountData['oldEmail'] = email
    }

    return
  }

  public resetMissingInfo = (): void => { this._recoverAccountData['missingInfo'] = false }

  public checkIfWithContactDetailsAndSeed = (): boolean => {
    const { phone, seedPhrase, otp, issueID, oldPhone } = this._recoverAccountData

    let seed = seedPhrase
    if (typeof seedPhrase === 'string') if (seedPhrase !== '') seed = splitStringToArray(seedPhrase, ' ')

    if (issueID && !phone) return (oldPhone !== null && seed.length !== 0)
    return (phone !== null && otp !== null && seed.length !== 0)
  }

  public checkIfWithSeedAndPasscode = (): boolean => {
    const { passcode, seedPhrase } = this._recoverAccountData

    let seed = seedPhrase
    if (typeof seedPhrase === 'string') if (seedPhrase !== '') seed = splitStringToArray(seedPhrase, ' ')

    return (passcode !== null && seed.length !== 0)
  }

  public checkIfWithSeed = (): boolean => {
    const { seedPhrase } = this._recoverAccountData

    let seed = seedPhrase
    if (typeof seedPhrase === 'string') {
      if (seedPhrase !== '') {
        seed = splitStringToArray(seedPhrase, ' ')
      }
    }
    return seed.length !== 0
  }


  public checkIfContactDetailsAreProvided = (): boolean => {
    const { phone, otp } = this._recoverAccountData
    return (phone !== null && otp !== null)
  }

  public checkIfWithIssueIdAndNewContact = (): boolean => {
    const { issueID, newContact } = this._recoverAccountData
    return (issueID !== null && newContact)
  }

  public getCurrentDetails = (): Object => { return this._recoverAccountData }
  public checkIfWithIssueID = (): boolean => this._recoverAccountData.issueID !== null
  public checkIfPasscodeIsProvided = (): boolean => this._recoverAccountData.passcode !== null
  public checkIfPhoneIsVerirfied = (): boolean => this._recoverAccountData.newContact && this._recoverAccountData.otp !== null
  public checkIfFromIssuesTab = (): boolean => {
    const { oldPhone, phone } = this._recoverAccountData
    return (oldPhone !== null && phone === null)
  }

  public checkIfSeedIsProvided = (): boolean => {
    const { seedPhrase } = this._recoverAccountData
    return seedPhrase.length !== 0
  }

  public getCoreFieldValue(key: string): AnyPrimitiveType {
    return this._recoverAccountData[key]
  }

  public setRegistrationData = (regData: ObjectOfPrimitives): CoreResultObject => {
    for (const key in regData)
      this._recoverAccountData[key] = regData[key]
    devConsoleLog('_recoverAccountData: ', this._recoverAccountData)
    return CRO()
  }

  public setRegistrationDataBackToNull(keys: string[]): CoreResultObject {
    keys.forEach((key: string): void => this._recoverAccountData[key] = null)
    devConsoleLog('this._recoverAccountData: ', this._recoverAccountData)
    return
  }

  public setRegistrationDataBackToOldValues(): any {
    const { oldEmail, oldPhone } = this._recoverAccountData

    this._recoverAccountData['phone'] = oldPhone
    this._recoverAccountData['email'] = oldEmail

    return
  }

  public async resendSMSOTP(): AsyncCRO {
    const { phone, email, issueID, newContact, oldPhone } = this._recoverAccountData

    if (issueID !== null) return this.resendRequestNewContactOTP()
    else if (newContact) return this.resendSMSNewContactOTP()
    else {
      let result
      phone ?
        result = await this._APIAccessor.requestOTP(phone, email) :
        result = await this._APIAccessor.requestOTP(oldPhone, email)

      if (result._devSMSOTP)
        this._devSMSOTP = result._devSMSOTP
      else if (this._devSMSOTP)
        this._devSMSOTP = 'SMS OTP resend requested'

      return result
    }
  }

  public async resendSMSNewContactOTP(): AsyncCRO {
    const { phone, seedPhrase, passcode } = this._recoverAccountData
    const result = await this._APIAccessor.requestRestoreNewContact(seedPhrase.join(' '), passcode, phone)

    if (result._devSMSOTP)
      this._devSMSOTP = result._devSMSOTP
    else if (this._devSMSOTP)
      this._devSMSOTP = 'SMS OTP resend requested'

    return result
  }


  public async resendRequestNewContactOTP(): Promise<any> {
    const { phone, issueID, seedPhrase } = this._recoverAccountData

    if (issueID !== null) {
      this._devSMSOTP = null
      const newOTP = await this._APIAccessor.requestNewContactWithIssue(seedPhrase.join(' '), issueID, phone)
      if (newOTP._devSMSOTP)
        this._devSMSOTP = newOTP._devSMSOTP
      return newOTP
    }
  }


  public async requestOTP(phone: string, email: string): AsyncCRO {
    const result = await this._APIAccessor.requestOTP(phone, email)

    if (result._devSMSOTP)
      this._devSMSOTP = result._devSMSOTP
    return result
  }

  public async fetchSeedPhrase(): AsyncCRO {
    const { phone, passcode, oldPhone } = this._recoverAccountData
    let num = phone
    if (!num) num = oldPhone
    return await this._APIAccessor.getSeedPhrase(num, passcode)
  }

  public async hasSeedPhrase(): Promise<boolean> {
    if (this._recoverAccountData.phone !== null)
      return await this._APIAccessor.hasSeedPhrase(this._recoverAccountData.phone)

    return true
  }

  public async addRestorationIssue(issueID: string): Promise<any> {
    const { phone, email, seedPhrase, otp, passcode } = this._recoverAccountData
    const values = {
      seedPhrase: seedPhrase.join(' '),
      email,
      phone,
      otp,
      passcode
    }

    return await this._LocalDBAccessor._addRestorationIssue(issueID, values)
  }

  public async _generateWalletKeys(ariaID: string, twelveWords: string[]): Promise<void> {
    const twelveSeed = twelveWords.join(' ')
    const keys = generateWalletAndPrivateKeyFromPhrase(twelveSeed, 'en')
    return this._LocalDBAccessor.storeWalletAndKeys(ariaID, keys)
  }

  public async createIssueRequest(): Promise<void> {
    const { phone, email, seedPhrase } = this._recoverAccountData

    if (seedPhrase.length === 0) await this.issueRequestSeed()
    else if (phone !== null && email !== null) await this.issueRequestNewContact()
  }

  public async issueRequestSeed(): Promise<void> {
    const { oldPhone, phone, email } = this._recoverAccountData
    const token = await AriaKeyStringStorage.getItem('userExponentPushToken')
    let pushToken = token
    if (token === null) pushToken = await retrievePushTokenAsync()

    let value = oldPhone
    const details = {
      phone,
      email,
      pushToken
    }
    const issueDetails = await this._APIAccessor.issueRequestSeed(value, details)

    if (issueDetails.issueID !== undefined) {
      return this.addRestorationIssue(issueDetails.issueID)
    } else return issueDetails
  }

  public async getRestoreDetailsInDB(issueID: string): Promise<any> {
    return this._LocalDBAccessor.getRestoreDetailsInDB(issueID)
  }
  public async isPhoneAlreadyUsed(phone: string): Promise<any> {
    return this._APIAccessor.isPhoneNumberAlreadyInUseByAnotherPatientAsync(phone)
  }

  public async addPushNotification(txid: string, header: string, message: string): Promise<any> {
    const profile = await this.fetchUserProfile()
    if (profile.ariaID)
      return this._LocalDBAccessor.addPushNotification(txid, profile.ariaID, header, message)

    return
  }

  public async issueRequestNewContact(): Promise<void> {
    const { oldPhone, phone, email } = this._recoverAccountData

    let number = oldPhone
    if (number === null) number = phone

    const seedPhrase = this._recoverAccountData.seedPhrase.join(' ')
    const token = await AriaKeyStringStorage.getItem('userExponentPushToken')
    let pushToken = token
    if (token === null) pushToken = await retrievePushTokenAsync()

    const issueDetails = await this._APIAccessor.issueAccRestorationNewDetails(number, { phone, email, pushToken }, seedPhrase)
    if (issueDetails.issueID !== undefined) {
      this._recoverAccountData.newContact = true
      this.addRestorationIssue(issueDetails.issueID)
    }

  }

  public removeInputSeedPhrase(): void { this._recoverAccountData.seedPhrase = [] }
  public removePasscode(): void {
    this._recoverAccountData.passcode = null
    // this._recoverAccountData.phone = null
    // this._recoverAccountData.email = null
  }
  public isEmailAlreadyVerified = (): boolean => this._isEmailAlreadyVerified

  public _storeuserInDBAndSetAsLoggedIn = async (result: any, token: string): AsyncCRO => {
    if (result !== null && result !== undefined) {
      const user = result

      const { ariaID, fullName, gender, dateOfBirth, phone, email, shareContactDetails,
        recovery } = user

      const sameEmail = this._recoverAccountData.email === email.value

      this._isEmailAlreadyVerified = email.verified && sameEmail
      if (__IS_PATIENT_APP__) {
        const data = {
          fullName,
          gender,
          dateOfBirth,
          phone: phone.value,
          email: email.value,
          shareContactDetails,
          isEmailVerified: email.verified,
          personalDataUseConsentDateTime: new Date().toISOString().substr(0, 10),
          exponentPushToken: token,
          passcode: this._recoverAccountData.passcode,
          otp: recovery ? recovery.otp : '',
        }
        devConsoleLog('\n\n\ndata: ', data)
        await this._LocalDBAccessor.addPatientAndSetAsLoggedInAsync(ariaID, data)
      }
      else {
        const { title, firstName, surname, specialization, institution, licenseNumber } = user
        const data = {
          accessCode: '',
          maskedDrPhone: '',
          otp: '',
          ariaID,
          phone: phone.value,
          fullName: (title ? title : '') + ' ' + firstName + ' ' + surname,
          firstName,
          surname,
          title,
          gender,
          dateOfBirth,
          email: email.value,
          shareContactDetails,
          personalDataUseConsentDateTime: new Date().toISOString().substr(0, 10),
          exponentPushToken: token,
          passcode: this._recoverAccountData.passcode,
          specialization,
          institution,
          licenseNumber
        }
        devConsoleLog('\n\n\ndata: ', data)
        await this._LocalDBAccessor.addDoctorAndSetAsLoggedInAsync(data)
      }
      await this._generateWalletKeys(ariaID, this._recoverAccountData.seedPhrase)

      const login = await this._APIAccessor.validatePasscode(ariaID, this._recoverAccountData.passcode)

      devConsoleLog('login: ', login)
      if (login.token)
        await AriaKeyStringStorage.setItem('loggedInUserToken', login.token)

      return CRO(CoreResult.OK)
    } else if (result && result.message)
      return CRO(CoreResult.NOK, { message: result.message })
    else if (result && result.error)
      return CRO(CoreResult.NOK, { message: result.error })

  }

  public async newContact(): AsyncCRO {
    const { phone, otp, passcode } = this._recoverAccountData
    const pushToken = await AriaKeyStringStorage.getItem('userExponentPushToken')

    const response = await this._APIAccessor.newContact(otp, pushToken, phone, passcode)

    if (response.ariaID) {
      this._recoverAccountData.accountRecovered = true//TODO CHECK
      return await this._storeuserInDBAndSetAsLoggedIn(response, pushToken)
    }
    else {
      // this._recoverAccountData.otp = null
      return CRO(CoreResult.NOK, { message: JSON.parse(response).error })
    }
  }

  public async _recoverAccount(result: any): AsyncCRO {
    const pushToken = await AriaKeyStringStorage.getItem('userExponentPushToken')

    devConsoleLog('pushToken: ', pushToken)

    let token = pushToken
    if (pushToken === null) token = await retrievePushTokenAsync()

    if (this._recoverAccountData.seedPhrase.length === 0) {
      const seed = await this.fetchSeedPhrase()
      if (seed.isOK() && seed.seedPhrase !== undefined) {
        this._recoverAccountData.seedPhrase = splitStringToArray(seed.seedPhrase, ' ')
      } else return seed
    }

    result = await this._APIAccessor.recoverAccount(token, this._recoverAccountData)
    if (result.isOK()) {
      this._recoverAccountData.accountRecovered = true
      return await this._storeuserInDBAndSetAsLoggedIn(result.user, token)
    }
    else {
      this._recoverAccountData.seedPhrase = []
      return result
    }
  }

  public getSeedPhrase = (): string[] => this._recoverAccountData.seedPhrase
  public isMissingInfo = (): boolean => this._recoverAccountData.missingInfo

  public async recoverAccount(): AsyncCRO {
    const { otp, seedPhrase, passcode, phone, email, newContact, missingInfo, issueID, accountRecovered } = this._recoverAccountData

    let result = CRO(CoreResult.OK)
    console.log("Recover account core")
    if (accountRecovered === true) return result

    if (otp && newContact && passcode) {
      return this.newContact()
    }
    else if (otp !== null && passcode !== null) {
      return this._recoverAccount(result)
    }
    else if (seedPhrase.length === 0 && otp !== null && passcode !== null) {
      result = await this.fetchSeedPhrase()
      if (result && result.seedPhrase !== undefined)
        this._recoverAccountData.seedPhrase = splitStringToArray(result.seedPhrase, ' ')
      return result
    } else if (otp === null && phone !== null && !newContact) {
      if (seedPhrase.length !== 0 && passcode !== null) {
        this._devSMSOTP = null
        const newOTP = await this._APIAccessor.requestRestoreNewContact(seedPhrase.join(' '), passcode, phone)
        if (newOTP.isOK()) this._recoverAccountData.newContact = true

        return newOTP
      }
      if (!missingInfo) {
        if (issueID !== null) {

          this._devSMSOTP = null
          const newOTP = await this._APIAccessor.requestNewContactWithIssue(seedPhrase.join(' '), issueID, phone)
          if (newOTP._devSMSOTP)
            this._devSMSOTP = newOTP._devSMSOTP

          if (newOTP.isOK()) this._recoverAccountData.newContact = true
          return newOTP
        }
        else return this.requestOTP(phone, email)
      }
    }

    return result
  }

  public async getDoctorPatientList(): Promise<any> {
    let resp = await this._APIAccessor.getPatientList()

    if (typeof resp === 'string') resp = JSON.parse(resp)
    if (resp.message && resp.message.toLowerCase().includes('authentication error'))
      return CRO(CoreResult.AUTHENTICATION_ERROR, { message: resp.message })
    else return CRO(CoreResult.OK, { list: resp })
  }

  public async getPatientInfo(ariaID: string): AsyncCRO {
    return await this._APIAccessor.getPatientInfo(ariaID)
  }

  public async validateOTPRestore(values: any): AsyncCRO {
    const { phone, email, otp } = values
    if (this._recoverAccountData.seedPhrase.length === 0) { //not new contact otp
      const resp = await this._APIAccessor.validateOTPRestore(otp, email, phone)
      return resp
    } else return CRO()
  }

  public async validateSeedRestore(values: any): AsyncCRO {
    const { seedPhrase } = values
    const { phone, oldPhone } = this._recoverAccountData

    if (!this._recoverAccountData.accountRecovered) {
      let phoneNumber = phone
      if (!phoneNumber) phoneNumber = oldPhone
      const seed = seedPhrase.join(' ')

      const resp = await this._APIAccessor.validateSeedRestore(seed, phoneNumber)
      return resp
    } else return CRO()
  }

}