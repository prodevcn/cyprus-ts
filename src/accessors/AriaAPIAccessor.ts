/* eslint-disable @typescript-eslint/no-explicit-any */
import CoreResultObject, { CRO, CoreResult } from '../core/AriaCore'
import { APIAccessor, APIFetcher } from './BaseAccessor'
import { devConsoleLog } from '../ur3/utilities'
import { CryptoKeys } from '../types'
import { __IS_PATIENT_APP__ } from '../../env.js'
import { AriaKeyStringStorage } from '../ur3/localdb'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
type AsyncCRO = Promise<CoreResultObject>
const AsyncCRO = Promise

const userType = __IS_PATIENT_APP__ ? 'patient' : 'doctor'

export const API_PATHS = {
  checkIfPhoneInUseByPatient: 'mobileuser/phoneinuse?userType=' + userType,
  createPatientAccount: 'patient/create',
  validateOTPForCreatePtAccount: 'mobileuser/verifycreation?userType=' + userType,
  resendSMSOTPforCreateAccount: 'mobileuser/requestsmsotp?userType=' + userType,

  registerPtEmail: 'mobileuser/registeremail?userType=' + userType,
  registerPtphone: 'mobileuser/registerphone?userType=' + userType,
  requestToVerifyPtEmail: 'mobileuser/requestemailotp?userType=' + userType,
  verifyPtEmail: 'mobileuser/verifyemail?userType=' + userType,

  acceptHospitalConnection: 'patient/acceptconnection',
  storePtSeedPhrase: 'mobileuser/storeseedphrase?userType=' + userType,
  registerPtToHealthNetwork: 'mobileuser/registertohealthnetwork?userType=' + userType,
  validatePasscode: 'login?collection=' + userType,


  submitDrAccessCode: 'doctor/submitaccesscode',
  validateOTPForRetrieveDrAccount: 'mobileuser/verifycreation?userType=' + userType,
  sendAdditionalDrAccountDetails: 'doctor/completeregistration',

  registerDrEmail: 'mobileuser/registeremail?userType=' + userType,
  requestToVerifyDrEmail: 'mobileuser/requestemailotp?userType=' + userType,
  verifyDrEmail: 'mobileuser/verifyemail?userType=' + userType,
  verifyDrOTP: 'mobileuser/verifyphone?userType=' + userType,
  resendSMSOTP: 'mobileuser/requestsmsotp?userType=' + userType,

  registerDrToHealthNetwork: 'mobileuser/registertohealthnetwork?userType=' + userType,
  storeDrSeedPhrase: 'mobileuser/storeseedphrase?userType=' + userType,

  doctors: {
    list: 'mobileuser/listdoctors',
  },
  getDrProfile: 'mobileuser/myprofile?userType=doctor',
  getRecord: 'mobileuser/getRecord',
  getPtRecords: 'patient/listrecords',
  getProviderInfo: 'patient/getproviderinfo',

  updateDoctorProfile: 'doctor/update',
  updateUserProfile: 'patient/update',
  getPtProfile: 'mobileuser/myprofile?userType=patient',
  shareRecord: 'patient/sharerecord',
  sendSignedTransaction: 'mobileuser/sendsignedtx',
  getDoctorPublicKey: 'mobileuser/getpublickey?userType=doctor',
  listrecordaccesskeys: 'patient/listrecordaccesskeys',
  getPatientList: 'doctor/listaccesskeys',
  getPatientInfo: 'doctor/getpatientprofile',
  listaccesskeys: 'patient/listaccesskeys',

  restore: {
    recover: 'restore?userType=' + userType,
    getSeedPhrase: 'restore/getseedphrase?userType=' + userType,
    hasSeedPhrase: 'restore/hasseedphrase?userType=' + userType,
    requestOtp: 'restore/requestotp?userType=' + userType,
    requestNewContact: 'restore/requestrestorenewcontact?userType=' + userType,
    requestNewContactWithIssue: 'restore/requestrestorenewcontactwithissueid?userType=' + userType,
    newContact: 'restore/newcontact?userType=' + userType,
    validateOTP: 'restore/validateotp?userType=' + userType,
    validateSeed: 'restore/validateseedphrase?userType=' + userType,
  },

  createissue: 'mobileuser/createissue?userType=' + userType,
  requestJoinAria: 'mobileuser/requestjoinaria',
  accessManagement: {
    listDoctors: 'patient/mydoctors',
    doctorProfile: 'patient/getdoctorprofile',
    revokeAccess: 'patient/revokerecord'
  },
  grantfutureaccess: 'patient/grantfutureaccess',
  revokefutureaccess: 'patient/revokefutureaccess',
  hasfutureaccess: 'patient/hasfutureaccess',

  myactivities: 'patient/myactivities',
  loadARecord: 'mobileuser/viewrecord',

  changePinToken: 'authentication/generatechangepintoken',
  requestForgotPassOTP: 'authentication/requestforgotpassotp?collection=' + userType,
  changePassword: 'authentication/changepassword?collection=' + userType,

  requestDelete: 'mobileuser/requestdelete',
  deleteAccount: 'mobileuser/delete',
  listProviders: 'mobileuser/listproviders',
  hospitalConsent: 'mobileuser/consent?userType=' + userType,
  termsConsent: 'mobileuser/consent?userType=' + userType,
  getConsentLogs: 'mobileuser/consent?userType=' + userType,

  fetchFavDoctors: 'patient/favoritedoctors',
  createIssueUpdateDoctor: 'mobileuser/createissueupdateprofile',
}

export interface PtRegistrationData {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  shareContactDetails: boolean;
  isEmailVerified: boolean;
  personalDataUseConsentDateTime: string;
  exponentPushToken: string;
  passcode: string;
  otp: string;
}

export interface BasicDoctorInfo {
  title: string;
  firstName: string;
  surname: string;
  specialization: string;
  institution: string;
  licenseNumber: string;
  dateOfBirth: string;
  phone: string;
  email: string;
}

export interface RecoverAccountData {
  phone: string;
  email: string;
  oldPhone: string;
  oldEmail: string;
  otp: string;
  seedPhrase: string[];
  passcode: string;
  newContact: boolean;
  missingInfo: boolean;
  issueID: string;
  accountRecovered: boolean
}

export interface DoctorDetails { //TODO check similarity with DrAccountDetails
  ariaID: string;
  dateOfBirth: string;
  email: {
    value: string;
    verified: string;
  };
  firstName: string; //TODO first and surname are not separated
  fullName: string;
  gender: string;
  institution: string;
  licenseNumber: string;
  phone: {
    value: string;
    verified: string;
  };
  specialisation: string;
  specialization: string;
  shareContactDetails: string;
  statusAccount: string;
  statusRole: string;
  surname: string;
  title: string;
  photo: string;
}

export interface DrAccountDetails {
  accessCode: string;
  ariaID: string;
  phone: string;
  maskedDrPhone: string;
  otp: string;
  firstName: string;
  surname: string;
  title: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  shareContactDetails: boolean;
  personalDataUseConsentDateTime: string;
  exponentPushToken: string;
  passcode: string;
  specialization: string;
  institution: string;
  licenseNumber: string;
}

export interface AccessManagementDrDetails {
  _id: string;
  ariaID: string;
  dateOfBirth: string;
  firstName: string;
  gender: string;
  institution: string;
  specialization: string;
  surname: string;
  title: string;
  licenseNumber: string;
  fullName?: string;
  shareContactDetails: boolean;
  hasFutureAccess: boolean;
  email: {
    value: string;
  };
  phone: {
    value: string;
  };
}

export interface ActivityDetails {
  doctor?: string;
  hospital?: string;
  label?: string;
  patient?: string;
  extra?: {
    recordTxid: string;
  };
}

export interface UserActivities {
  _id: string;
  data: {
    token: {
      collection: string;
      userID: {
        key: string;
        value: string;
      };
    };
    url: string;
  };
  date: string;
  details: string | ActivityDetails;
}

export interface EmrDetails {
  observation: {
    endDate: any;
    obx: {
      abnormalFlags: string;
      observResultStatus: string;
      observationIdentifier: string;
      range: string;
      type: string;
      units: string;
      value: string;
    };
  };
  patient: {
    family_name: {
      st: string;
    };
    given_name: {
      st: string;
    };
  };
}

export class AriaAPIAccessor extends APIAccessor {
  public constructor(apiFetcher: APIFetcher) {
    super(apiFetcher)
  }

  public async validatePasscode(username: string, password: string): Promise<any> {
    let apiResponse = await this._ApiFetcher.post(
      API_PATHS.validatePasscode, { username, password })

    devConsoleLog('apiResponse: ', apiResponse)

    if (typeof apiResponse === 'string') apiResponse = JSON.parse(apiResponse)

    if (apiResponse.status) return CRO(CoreResult.OK, { token: apiResponse.token })
    else if (apiResponse.err) return CRO(CoreResult.NOK, { message: apiResponse.err })
    else return CRO(CoreResult.NOK, { message: apiResponse.message })
  }

  public async changePassword(newPass: string, otp: string, phone: string): AsyncCRO {
    return this._post(API_PATHS.changePassword, { newPass, otp, phone })
  }

  public async requestForgotPassOTP(phone: string, email: string, dateOfBirth: string): AsyncCRO {
    return this._post(API_PATHS.requestForgotPassOTP, { phone, email, dateOfBirth })
  }

  public async requestDelete(pin: string): AsyncCRO {
    return this._post(API_PATHS.requestDelete, { pin })
  }

  public async deleteAccount(otp: string): AsyncCRO {
    return this._post(API_PATHS.deleteAccount, { otp })
  }

  public async listProviders(): Promise<any> {
    return this._ApiFetcher.post(API_PATHS.listProviders, {})
  }

  public async validateOTPRestore(otp: string, email: string, phone: string): AsyncCRO {
    return this._post(API_PATHS.restore.validateOTP, { otp, email, phone })
  }

  public async validateSeedRestore(seedPhrase: string, phone: string): Promise<any> {
    return this._post(API_PATHS.restore.validateSeed, { seedPhrase, phone })
  }

  public async requestChangePinToken(password: string): AsyncCRO {
    const apiResponse = await this._ApiFetcher.post(
      API_PATHS.changePinToken, { password })

    if (apiResponse.otp !== null && apiResponse.otp !== undefined)
      return CRO(CoreResult.OK, { otp: apiResponse.otp })
    else if (apiResponse.error !== null && apiResponse.error !== undefined)
      return CRO(CoreResult.NOK, { message: apiResponse.error })
    else return CRO(CoreResult.NOK, { message: apiResponse.message })
  }

  public async isPhoneNumberAlreadyInUseByAnotherPatientAsync(phone: string): Promise<boolean | null> {
    const apiResponse = await this._ApiFetcher.post(
      API_PATHS.checkIfPhoneInUseByPatient, { phone })

    if (apiResponse.phone === phone && apiResponse.exists != null)
      return apiResponse.exists

    return true
  }

  public createPatientAccountAsync(registrationData: PtRegistrationData): AsyncCRO {
    const {
      fullName,
      gender,
      dateOfBirth,
      phone,
      email,
      shareContactDetails,
      exponentPushToken,
      passcode,
      personalDataUseConsentDateTime
    } = registrationData

    const postParams = {
      fullName,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      phone,
      email,
      shareContactDetails,
      pushToken: exponentPushToken,
      authentication: { password: passcode },
      registration: {
        consentHash: 'TODO',
        date: personalDataUseConsentDateTime
      }
    }

    return this._post(API_PATHS.createPatientAccount, postParams)
  }

  public fetchPtProfile(ariaID: string): Promise<any> {
    return this._post(API_PATHS.getPtProfile, { ariaID })
  }

  public sendupdatedDataToAPIAsync(info: any): AsyncCRO {
    return this._post(API_PATHS.updateUserProfile, info)
  }

  public fetchFavDoctors(): Promise<any> {
    return this._get(API_PATHS.fetchFavDoctors, {})
  }

  public sendupdatedDoctorToAPIAsync(info: any): AsyncCRO {
    return this._post(API_PATHS.updateDoctorProfile, info)
  }

  public validateOTPForCreatePtAccountASync(registrationData: PtRegistrationData,
    ariaID: string): AsyncCRO {

    const postParams = {
      otp: registrationData.otp,
      phone: registrationData.phone,
      ariaID
    }

    return this._post(API_PATHS.validateOTPForCreatePtAccount, postParams)
  }

  public validateOTPForUpdateAccountASync(phone: string,
    otp: string,
    ariaID: string,
    newPhone: string): AsyncCRO {

    const postParams = {
      otp,
      phone,
      ariaID,
      newPhone,
    }

    return this._post(API_PATHS.validateOTPForCreatePtAccount, postParams)
  }

  public async resendSMSOTPforCreatePtAccountAsync(ariaID: string, newPhone: string): AsyncCRO {
    const mayHaveLatestOTP = await this._post(API_PATHS.resendSMSOTPforCreateAccount, { ariaID, newPhone })
    if (mayHaveLatestOTP.otp)
      return CRO(CoreResult.OK, { _devSMSOTP: mayHaveLatestOTP.otp })

    return mayHaveLatestOTP
  }

  public async resendSMSOTP(ariaID: string, newPhone: string): AsyncCRO {
    const mayHaveLatestOTP = await this._post(API_PATHS.resendSMSOTP, { ariaID, newPhone })
    if (mayHaveLatestOTP.otp)
      return CRO(CoreResult.OK, { _devSMSOTP: mayHaveLatestOTP.otp })

    return mayHaveLatestOTP
  }

  public requestVerifyPtEmail(ariaID: string): AsyncCRO {
    return this._post(API_PATHS.requestToVerifyPtEmail, { ariaID })
  }

  public changePtEmail(ariaID: string, email: string): AsyncCRO {
    return this._post(API_PATHS.registerPtEmail, { ariaID, email })
  }

  public changePtPhone(ariaID: string, phone: string): AsyncCRO {
    return this._post(API_PATHS.registerPtphone, { ariaID, phone })
  }

  public verifyPtEmail(ariaID: string, email: string, otp: string): AsyncCRO {
    return this._post(API_PATHS.verifyPtEmail, { ariaID, email, otp })
  }

  public sendHospitalConsent(hospitalId: string): Promise<any> {
    return this._ApiFetcher.post(API_PATHS.hospitalConsent, { date: Date.now(), type: 2, hospitalId })
  }

  public sendTermsNConditionConsent(): AsyncCRO {
    return this._ApiFetcher.post(API_PATHS.termsConsent, { date: Date.now(), type: 1 })
  }

  public acceptHospitalConnection(ariaID: string, hospitalId: string): AsyncCRO {
    return this._post(API_PATHS.acceptHospitalConnection, { ariaID, hospitalId })
  }

  public async storeSeedPhrase(ariaID: string, seedPhrase: string): AsyncCRO {
    return this._post(API_PATHS.storePtSeedPhrase, { ariaID, seedPhrase })
  }

  public async storeDrSeedPhrase(ariaID: string, seedPhrase: string): AsyncCRO {
    return this._post(API_PATHS.storeDrSeedPhrase, { ariaID, seedPhrase })
  }

  public async registerPtToHealthNetwork(ariaID: string,
    walletAndKeys: CryptoKeys): AsyncCRO {
    const walletaddress = walletAndKeys.walletAddress
    const pKey = walletAndKeys.publicKey

    return this._post(API_PATHS.registerPtToHealthNetwork, { ariaID, walletaddress, pKey })
  }

  public async registerDrToHealthNetwork(ariaID: string,
    walletAndKeys: CryptoKeys): AsyncCRO {
    const walletaddress = walletAndKeys.walletAddress
    const pKey = walletAndKeys.publicKey

    return this._post(API_PATHS.registerDrToHealthNetwork, { ariaID, walletaddress, pKey })
  }

  /* NOTE Start of Create Dr Account */
  public submitDrAccessCodeAsync(accessCode: string): AsyncCRO {
    return this._post(API_PATHS.submitDrAccessCode, { accessCode })
  }

  public async validateOTPForRetrieveDrAccountAsync(acctData: DrAccountDetails): AsyncCRO {
    const { ariaID, otp } = acctData
    return this._post(API_PATHS.validateOTPForRetrieveDrAccount, { otp, ariaID })
  }

  public async sendDoctorAccountDetailsAsync(registrationData: DrAccountDetails): AsyncCRO {
    const {
      accessCode,
      ariaID,
      fullName,
      gender,
      dateOfBirth,
      phone,
      email,
      shareContactDetails,
      exponentPushToken,
      passcode,
      personalDataUseConsentDateTime
    } = registrationData

    const postParams = {
      ariaID,
      accessCode,
      fullName,
      gender,
      dateOfBirth,
      phone,
      email,
      shareContactDetails,
      pushToken: exponentPushToken,
      authentication: { password: passcode },
      registration: {
        consentHash: 'TODO',
        date: personalDataUseConsentDateTime
      }
    }

    return this._post(API_PATHS.sendAdditionalDrAccountDetails, postParams)
  }

  public requestVerifyDrEmail(ariaID: string): AsyncCRO {
    return this._post(API_PATHS.requestToVerifyDrEmail, { ariaID })
  }

  public changeDrEmail(ariaID: string, email: string): AsyncCRO {
    return this._post(API_PATHS.registerDrEmail, { ariaID, email })
  }

  public verifyDrEmail(ariaID: string, email: string, otp: string): AsyncCRO {
    return this._post(API_PATHS.verifyDrEmail, { ariaID, email, otp })
  }

  public verifyDrOTP(ariaID: string, phone: string, otp: string): AsyncCRO {
    return this._post(API_PATHS.verifyDrOTP, { ariaID, phone, otp })
  }

  public async getPatientList(): Promise<any> {
    return await this._ApiFetcher.post(API_PATHS.getPatientList, { start: 0, count: 10000 })
  }

  public async getPatientRecord(recordTxid: string): Promise<any> {
    return await this._ApiFetcher.post(API_PATHS.getRecord, { recordTxid })
  }

  public async loadARecord(recordTxid: string): Promise<any> {
    return this._post(API_PATHS.loadARecord, { recordTxid })
  }

  public async getPatientInfo(ariaID: string): Promise<any> {
    return await this._ApiFetcher.post(API_PATHS.getPatientInfo, { ariaID })
  }
  /* NOTE End of Create Dr Account */


  // Recover Account
  public async requestOTP(phone: string, email: string): AsyncCRO {
    let params = {
      phone,
      email
    }

    if (email === null) params = { phone, email: '' }

    return this._post(API_PATHS.restore.requestOtp, params)
  }

  public async requestRestoreNewContact(seedPhrase: string, password: string, phone: string): AsyncCRO {
    return this._post(API_PATHS.restore.requestNewContact, { seedPhrase, password, phone })
  }

  public async requestNewContactWithIssue(seedPhrase: string, issueID: string, phone: string): AsyncCRO {
    return this._post(API_PATHS.restore.requestNewContactWithIssue, { seedPhrase, issueID, phone })
  }

  public async newContact(otp: string, pushToken: string, phone: string, password: string): Promise<any> {
    return await this._ApiFetcher.post(API_PATHS.restore.newContact, { otp, pushToken, phone, password })
  }

  public async recoverAccount(pushToken: string, data: any): Promise<any> {
    const postParams = {
      otp: data.otp,
      seedPhrase: data.seedPhrase ? data.seedPhrase.join(' ') : null,
      authentication: { password: data.passcode },
      pushToken,
      phone: data.phone ? data.phone : data.oldPhone ? data.oldPhone : ''
    }

    return this._post(API_PATHS.restore.recover, postParams)
  }

  public async getSeedPhrase(value: string, password: string): AsyncCRO {
    return this._post(API_PATHS.restore.getSeedPhrase, { value, password })
  }

  public async hasSeedPhrase(value: string): Promise<boolean> {
    const response = await this._ApiFetcher.post(API_PATHS.restore.hasSeedPhrase, { value })
    if (response.hasSeedPhrase !== undefined) return response.hasSeedPhrase
    else if (JSON.parse(response).error) return false
    else return true
  }

  // Access Management
  public async hasfutureaccess(docAriaID: string): Promise<boolean> {
    const response = await this._ApiFetcher.post(API_PATHS.hasfutureaccess, { docAriaID })

    if (response.hasAccess !== undefined || response.hasAccess !== null) return response.hasAccess
    return false
  }

  public async grantFutureAccess(docAriaID: string): Promise<any> {
    return await this._ApiFetcher.post(API_PATHS.grantfutureaccess, { docAriaID })
  }

  public async revokeFutureAccess(docAriaID: string): Promise<any> {
    return await this._ApiFetcher.post(API_PATHS.revokefutureaccess, { docAriaID })
  }

  public async fetchDoctorsSharedTo(): AsyncCRO {
    return this._get(API_PATHS.accessManagement.listDoctors, {})
  }

  public async getConsentLogs(): Promise<any> {
    const logs = await this._ApiFetcher.get(API_PATHS.getConsentLogs, {})
    devConsoleLog('logs: ', logs)
    return logs
  }

  public async revokeDoctorAccess(toAriaID: string, shareItem: { recordTxid: string }): AsyncCRO {
    return await this._ApiFetcher.post(API_PATHS.accessManagement.revokeAccess, { toAriaID, shareItem })
  }

  public async fetchDoctorProfile(ariaID: string): Promise<AccessManagementDrDetails> {
    const response = await this._ApiFetcher.post(API_PATHS.accessManagement.doctorProfile, { ariaID })
    if (response) {
      const data = response
      data['ariaID'] = ariaID
      return data
    }

    return null
  }

  public async fetchMyDoctorProfile(ariaID: string): Promise<any> {
    let response = await this._ApiFetcher.post(API_PATHS.getDrProfile, { ariaID })
    if (typeof response === 'string') response = JSON.parse(response)
    if (response.info) return response.info
    else if (response.message) {
      if (response.message.toLowerCase().includes('authentication')) return null
      else return response.message
    }

    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _post(apiPath: string, params: any): AsyncCRO {
    const demo = await AriaKeyStringStorage.getItem('BrowseDemoProfile')
    if (demo === 'true') return CRO(CoreResult.OK)

    const response = await this._ApiFetcher.post(apiPath, params)
    devConsoleLog('response: ', response)
    return AriaAPIAccessor._ApiResponseToCoreResultObject(
      response
    )
  }

  private async _get(apiPath: string, params: any): AsyncCRO {
    const demo = await AriaKeyStringStorage.getItem('BrowseDemoProfile')
    if (demo === 'true') return CRO(CoreResult.OK)

    const response = await this._ApiFetcher.get(apiPath, params)
    devConsoleLog('GET response: ', response)
    return AriaAPIAccessor._ApiResponseToCoreResultObject(
      response
    )
  }

  public async getPtLatestRecordsAsync(ariaID: string, start: number): Promise<any> {
    const apiResponse = await this._ApiFetcher.post(
      API_PATHS.getPtRecords,
      { ariaID, start, count: 10 }
    )

    return apiResponse
  }

  public async shareRecord(toAriaID: string, shareItem: { recordTxid: string; accesskey: string; expiration?: string; }, sendPushNotif: boolean): AsyncCRO {
    devConsoleLog('sendPushNotif: ', sendPushNotif)
    return await this._ApiFetcher.post(API_PATHS.shareRecord, { toAriaID, shareItem, sendPushNotif })
  }

  public async listrecordaccesskeys(recordTxid: string): Promise<any> {
    return await this._ApiFetcher.post(API_PATHS.listrecordaccesskeys, { recordTxid })
  }

  public async listAccesskeys(docAriaID: string): Promise<any> {
    const apiRsponse = await this._ApiFetcher.post(API_PATHS.listaccesskeys, { docAriaID, count: 10000, includeRevoked: false, start: 0, additionalKeys: [] })

    const keys = apiRsponse.accessArr
    if (apiRsponse && apiRsponse.accessArr) {
      if (apiRsponse.futureArr)
        return keys.concat(apiRsponse.futureArr)
      return keys
    }

    return null
  }

  public async getDoctorPublicKey(ariaID: string): AsyncCRO {
    return await this._ApiFetcher.post(API_PATHS.getDoctorPublicKey, { ariaID })
  }

  public async sendSignedTxAsync(
    signedTx: string,
    otherParams?: {}
  ): Promise<{ txid?: string }> {

    const signingResponse = await this._ApiFetcher.post(
      API_PATHS.sendSignedTransaction,
      {
        signedTx,
        ...otherParams
      }
    )
    devConsoleLog('signingResponse: ', signingResponse)

    return signingResponse
  }

  public async getRecord(ariaID: string, recordTxid: string): Promise<any> {
    const apiResponse = await this._ApiFetcher.post(
      API_PATHS.getRecord, { ariaID, recordTxid })

    return apiResponse
  }

  public async getDoctorsListAsync(skip: number, count: number): Promise<{ list: []; tab: string; total: number; message?: string; error?: string }> {
    const apiResponse = await this._ApiFetcher.post(
      API_PATHS.doctors.list, { skip, count })

    devConsoleLog('apiResponse: ', apiResponse)
    return apiResponse
  }

  public async getProviderInfo(hospitalId: string): Promise<any> { //TODO provider info type
    const apiResponse = await this._ApiFetcher.post(
      API_PATHS.getProviderInfo, { hospitalId })

    return apiResponse.info
  }

  public async updateDoctorDetails(values: any, ariaID: string): Promise<any> {
    const info = {
      subject: 'Information Change',
      details: 'Changes in various fields',
      newInfo: values,
      status: 'For Confirmation',
      type: 'update',
      userType: 'doctor',
      ariaID
    }

    devConsoleLog('info: ', info)
    return this._post(API_PATHS.createIssueUpdateDoctor, info)
  }

  public async requestAriaToJoin(newInfo: BasicDoctorInfo): Promise<any> {
    const info = {
      newInfo
    }

    devConsoleLog('info: ', info)
    return this._post(API_PATHS.requestJoinAria, info)
  }

  public async issueAccRestorationNewDetails(phone: string, values: any, seedPhrase: string): Promise<any> {
    const info = {
      subject: 'Account Restoration to New Contact Details',
      details: 'New account contact details',
      newInfo: values,
      status: 'For Confirmation',
      type: 'restore',
      userType: __IS_PATIENT_APP__ ? 'patient' : 'doctor',
      phone,
      seedPhrase
    }

    devConsoleLog('info: ', info)
    return await this._ApiFetcher.post(API_PATHS.createissue, info)
  }

  public async issueRequestSeed(key: string, newInfo: { phone: string; email: string; pushToken: string }): Promise<any> {
    const info = {
      subject: 'Send Recovery Phrase',
      details: 'Give recovery phrase',
      status: 'For Confirmation',
      type: 'recovery',
      userType: __IS_PATIENT_APP__ ? 'patient' : 'doctor',
      phone: key,
      newInfo
    }

    devConsoleLog('info: ', info)
    return this._post(API_PATHS.createissue, info)
  }

  // security

  public async fetchMyActivities(): AsyncCRO {
    return this._get(API_PATHS.myactivities, {})
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected static async _ApiResponseToCoreResultObject(apiResponse: Promise<any>): AsyncCRO {
    let apiResponseObject = await apiResponse
    devConsoleLog('[RESP]', apiResponseObject, typeof apiResponseObject)

    if (apiResponseObject == null)
      return CRO(CoreResult.NETWORK_ERROR)

    if (typeof apiResponseObject === 'string') {
      try {
        apiResponseObject = JSON.parse(apiResponseObject)
      } catch (error) {
        devConsoleLog('parse apiResponse', error)
        // NOTE non JSON string response is likely unexpected
        return CRO(CoreResult.SERVER_ERROR)
      }
    }

    // TODO handle status = raw and error and typeof apiResponse = string
    const { activites, ariaID, status, error, errors, patient, doctorDetails, updateHistory, token, user, doctors, err, ret, issueID, info, favoriteDoctors } = apiResponseObject

    if (doctorDetails && typeof doctorDetails === 'object')
      return CRO(CoreResult.OK, { retrievedData: { doctorDetails } })
    if (doctors)
      return CRO(CoreResult.OK, { doctors })
    if (user)
      return CRO(CoreResult.OK, { user })
    if (activites)
      return CRO(CoreResult.OK, { activites })
    if (issueID)
      return CRO(CoreResult.OK, { issueID })
    if (info)
      return CRO(CoreResult.OK, { info })
    if (favoriteDoctors)
      return CRO(CoreResult.OK, { favoriteDoctors })
    if (token)
      return CRO(CoreResult.OK, { token })
    if (updateHistory && ariaID)
      return CRO(CoreResult.OK, { updateHistory, ariaID })
    if (patient && typeof patient === 'object')
      return CRO(CoreResult.OK, { ariaID: patient.ariaID })
    if (updateHistory)
      return CRO(CoreResult.OK, { updateHistory })
    if (ret && ret.ok == 1)
      return CRO(CoreResult.OK)

    let { message } = apiResponseObject

    if (status === 'error' || error || errors || (status == null && message) || err) {
      message = message || error || errors || err // TODO or default error message key

      if (message[0].msg) {
        let errorMsgs = ''
        message.filter((message): void => {
          if (errorMsgs.indexOf(message.msg) === -1) errorMsgs += message.msg
        })
        message = errorMsgs
      }

      if (typeof message !== 'string')
        message = JSON.stringify(message)
      if (message)
        return CRO(CoreResult.NOK, { message })
      return CRO(CoreResult.SERVER_ERROR)
    }

    if (apiResponseObject.seedPhrase) {
      return CRO(CoreResult.OK, {
        seedPhrase: apiResponseObject.seedPhrase
      })
    }
    if (apiResponseObject.otp) { // TEMP during DEV
      if (apiResponseObject.entry != null) {
        if (apiResponseObject.entry.ariaID) {
          return CRO(CoreResult.OK, {
            _devSMSOTP: apiResponseObject.otp,
            ariaID: apiResponseObject.entry.ariaID
          })
        }
        else if (apiResponseObject.entry.drPhone) {
          return CRO(CoreResult.OK, {
            _devSMSOTP: apiResponseObject.otp,
            retrievedData: { drPhone: apiResponseObject.entry.drPhone }
          })
        }
      }

      else if (apiResponseObject.phone && apiResponseObject.ariaID) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retrievedData: any = {
          _devSMSOTP: apiResponseObject.otp,
          drPhone: apiResponseObject.phone,
          ariaID: apiResponseObject.ariaID
        }

        return CRO(CoreResult.OK, { retrievedData })
      }

      else return CRO(CoreResult.OK, { _devSMSOTP: apiResponseObject.otp })

    }

    else if (apiResponseObject.phone && apiResponseObject.ariaID) {
      const isFromSubmitAccessCode = apiResponseObject.status === true
      if (isFromSubmitAccessCode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retrievedData: any = {
          drPhone: apiResponseObject.phone,
          ariaID: apiResponseObject.ariaID
        }
        return CRO(CoreResult.OK, { retrievedData })
      }
    }

    return CRO()
  }
}

export interface PossibleDataFromAPI {
  drPhone?: string;
  phone?: string;
  _devSMSOTP?: string;

  doctorDetails: DoctorDetails;

  ariaID?: string;
  seedPhrase?: string;
}