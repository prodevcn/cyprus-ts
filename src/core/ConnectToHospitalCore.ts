import CoreResultObject, { AriaCore, CoreResult, CRO } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { CryptoKeys, UserProfile } from '../types'
import { ONBOARDING, ONBOARDING_PT } from '../routes'
import { devConsoleLog } from '../ur3/utilities'
import { signRawTransaction } from '../ur3/signtxbundled'
import { AriaKeyStringStorage } from '../ur3/localdb'

export default class ConnectToHospitalCore extends AriaCore {
  private _profile: UserProfile = {
    ariaID: '',
    fullName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    shareContactDetails: false,
    isEmailVerified: false,
    cryptoKeys: null
  }
  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)
    this.getUserProfile()
  }

  public getNextPageAfter(currentPage: string): string {
    switch (currentPage) {
      case ONBOARDING_PT.ReviewSeedPhrase:
        return ONBOARDING_PT.ReEnterRecoveryPhrase
      case ONBOARDING.WalletGenerator:
        return ONBOARDING_PT.StorageOptions
    }

    return ''
  }

  public getButtonTKeyForSeedPhrasePage = (): string => 'connectToHospital:Gotit'

  public async acceptHospitalConnectionAsync(hospitalId: string): Promise<CoreResultObject> {
    const userProfile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    let accessorResult = CRO(CoreResult.NOK)

    if (userProfile && userProfile.ariaID) {
      accessorResult = await this._APIAccessor
        .acceptHospitalConnection(userProfile.ariaID, hospitalId)
    }

    if (!accessorResult.isOK())
      return CRO(CoreResult.INVALID_QR, { message: accessorResult.message })

    return accessorResult
  }

  public getAriaID(): string {
    return this._profile.ariaID
  }

  public async getUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }

  public async storeSeedPhrase(phrase: string): Promise<CoreResultObject> {
    const profile = await this.getUserProfile()
    const ariaID = profile.ariaID

    let accessorResult = CRO(CoreResult.NOK)

    if (ariaID)
      accessorResult = await this._APIAccessor.storeSeedPhrase(ariaID, phrase)
    return accessorResult
  }

  public async validatePasscode(ariaID: string, passcode: string): Promise<any> {
    const response = this._APIAccessor.validatePasscode(ariaID, passcode)
    if (response.token) {
      await AriaKeyStringStorage.setItem('loggedInUserToken', response.token)
    }
    return
  }

  public async sendHospitalConsentAndTerms(hospitalId: string): Promise<{ txid?: string; message?: string }> {
    devConsoleLog('sendHospitalConsent connect to hospital')
    const profile = await this.getUserProfile()

    const toSignConsent = await this._APIAccessor.sendTermsNConditionConsent()
    devConsoleLog('toSignConsent.decoded: ', toSignConsent.decoded)
    //terms and condition consent signing
    if (toSignConsent && toSignConsent.decoded) {
      const termsConsent = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSignConsent.decoded, profile.cryptoKeys.privateKey)
      )

      devConsoleLog('termsConsent: ', termsConsent)
    }

    //connect to provider consent signing
    const toSign = await this._APIAccessor.sendHospitalConsent(hospitalId)
    devConsoleLog('toSign.decoded: ', toSign.decoded)
    if (toSign && toSign.decoded) {
      const consent = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )

      devConsoleLog('consent: ', consent)
      return consent
    } else CRO(CoreResult.NOK, { message: 'Error occured' })
  }

  public async sendHospitalConsent(hospitalId: string): Promise<{ txid?: string; message?: string }> {
    devConsoleLog('sendHospitalConsent connect to hospital')
    const profile = await this.getUserProfile()
    //connect to provider consent signing
    const toSign = await this._APIAccessor.sendHospitalConsent(hospitalId)
    devConsoleLog('toSign.decoded: ', toSign.decoded)
    if (toSign && toSign.decoded) {
      const consent = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )

      devConsoleLog('consent: ', consent)
      return consent
    } else CRO(CoreResult.NOK, { message: 'Error occured' })
  }

  public async registerPtToHealthNetwork(walletAndKeys: CryptoKeys): Promise<CoreResultObject> {
    const ariaID = this.getAriaID()
    let accessorResult = CRO(CoreResult.NOK, { message: 'Error: Can\'t register to health network' })
    let userAriaID = ariaID

    if (ariaID === null) {
      const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
      userAriaID = profile.ariaID
    }

    accessorResult = await this._APIAccessor.registerPtToHealthNetwork(userAriaID, walletAndKeys)
    if (!accessorResult.isOK()) {
      const userPasscodeAccCreation = await AriaKeyStringStorage.getItem('userPasscodeAccCreation')
      if (userPasscodeAccCreation) await this.validatePasscode(ariaID, userPasscodeAccCreation)
      accessorResult = await this._APIAccessor.registerPtToHealthNetwork(userAriaID, walletAndKeys)
    }
    return accessorResult
  }

  public storeWalletKeysInDbASync(walletAndKeys: CryptoKeys): Promise<void> {
    const ariaID = this.getAriaID()
    return this._LocalDBAccessor.storeWalletAndKeys(ariaID, walletAndKeys)
  }

  public async checkWalletKeys(): Promise<boolean> {
    return await this._LocalDBAccessor.checkWalletKeys()
  }

}