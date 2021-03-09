import CoreResultObject, { AriaCore, CoreResult, CRO } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { AriaKeyStringStorage } from '../ur3/localdb'
import { UserProfile, ObjectOfPrimitives, AnyPrimitiveType } from '../types'

interface ForgotPaswordData {
  phone: string;
  email: string;
  dateOfBirth: string;
  otp: string;
  passcode: string;
}

export default class LoginCore extends AriaCore {
  private _loggedInUserID: number
  private _profileToForgotPass = null
  private _forgotPassData: ForgotPaswordData

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this._loadInitialDataAsync()
    this._forgotPassData = {
      phone: null,
      email: null,
      dateOfBirth: null,
      otp: null,
      passcode: null,
    }
  }

  private async _loadInitialDataAsync(): Promise<void> {
    this._loggedInUserID = parseInt(await AriaKeyStringStorage.getItem('loggedInUserID'))
  }

  public async removeDemoAccount(): Promise<void> {
    return await this._LocalDBAccessor.removeDemoAccount()
  }

  public async loginUserWithPasscode(passcode: string): Promise<CoreResultObject> {
    const profile = await this.getProfileOfLoggedInUser()
    let result = CRO(CoreResult.NOK)

    if (profile && profile.ariaID)
      result = await this._APIAccessor.validatePasscode(profile.ariaID, passcode)

    if (result.token)
      await AriaKeyStringStorage.setItem('loggedInUserToken', result.token)

    if (result.isOK())
      return CRO()

    if (result.message)
      return CRO(CoreResult.NOK, { message: result.message })
    else return CRO(CoreResult.NOK, { message: 'inputerrors:InvalidPasscode' })
  }

  public async getProfileOfLoggedInUser(): Promise<UserProfile> {
    return this._LocalDBAccessor.getProfileOfLoggedInUser()
  }

  public async requestForgotPassOTP(): Promise<any> {
    const { phone, email, dateOfBirth } = this._forgotPassData
    return this._APIAccessor.requestForgotPassOTP(phone, email, dateOfBirth)
  }

  public setRegistrationData = (regData: ObjectOfPrimitives): CoreResultObject => {
    for (const key in regData)
      this._forgotPassData[key] = regData[key]
    return CRO()
  }

  public getCoreFieldValue(key: string): AnyPrimitiveType {
    return this._forgotPassData[key]
  }

  public async checkIfAccountIsRegisteredToThisDevice(values: string): Promise<boolean> {
    const users = await this._LocalDBAccessor.getAllUsers()

    let regiteredInTheDevice = false
    for (let i = 0; i < users.length; i++) {
      const profile = users[i]
      const { phone } = JSON.parse(profile.personaldatajson)
      if (phone === values['phone']) {
        regiteredInTheDevice = true
        this._profileToForgotPass = profile
        this._loggedInUserID = profile.userid
        break
      }
    }
    return regiteredInTheDevice
  }

  public async getAriaIDOfPhoneNumber(phone: string): Promise<string> {
    return this._LocalDBAccessor.getProfileOfPhoneNumber(phone)
  }

  public async createNewPasscode(): Promise<any> {
    const { passcode, otp, phone } = this._forgotPassData
    const response = await this._APIAccessor.changePassword(passcode, otp, phone)

    if (response.isOK()) {
      await AriaKeyStringStorage.setItem('loggedInUserID', JSON.stringify(this._loggedInUserID))
      let ariaID = await this.getAriaIDOfPhoneNumber(phone)
      if (ariaID === null) {
        const profile = await this.getProfileOfLoggedInUser()
        ariaID = profile.ariaID
      }
      let result = CRO(CoreResult.NOK)

      if (ariaID)
        result = await this._APIAccessor.validatePasscode(ariaID, passcode)

      if (result.token)
        await AriaKeyStringStorage.setItem('loggedInUserToken', result.token)

      return result
    } else return response
  }
}