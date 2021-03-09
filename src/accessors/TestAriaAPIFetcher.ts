import { __DEV_SKIP__, __OTP_EMAIL__ } from '../../env'
import { APIFetcher } from './BaseAccessor'
import { API_PATHS } from './AriaAPIAccessor'
import { devConsoleLog } from '../ur3/utilities'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export default class TestAriaAPIFetcher implements APIFetcher {
  private _createPtAccountOTP
  private _retrieveDrDetailsOTP

  public async post(apiPath: string, params: any): Promise<any> {
    // await sleep(500)
    devConsoleLog('[POST]', apiPath, params)

    switch (apiPath) {
      case API_PATHS.checkIfPhoneInUseByPatient:
        if (params.phone === '500')
          return null
        return { phone: params.phone, exists: params.phone === '123' }

      case API_PATHS.createPatientAccount:
        this._createPtAccountOTP = __DEV_SKIP__ ?
          '123456' : Math.round(Math.random() * 999999).toString().padStart(6, '2')
        return {
          status: 'success',
          otp: this._createPtAccountOTP
        }
      case API_PATHS.requestToVerifyPtEmail:
      case API_PATHS.requestToVerifyDrEmail:
      case API_PATHS.registerPtEmail:
      case API_PATHS.registerDrEmail:
        return { status: 'success' }

      case API_PATHS.verifyPtEmail:
      case API_PATHS.verifyDrEmail:
      case API_PATHS.validateOTPForCreatePtAccount:
        if (params.otp === '123456' || params.otp === this._createPtAccountOTP) {
          if (params.info)
            return { patient: { ariaID: `ABC-${params.info.phone}-XYZ` } }
          else return { status: 'success' }
        }
        this._createPtAccountOTP = null
        return { status: 'error' }
      case API_PATHS.doctors.list:
        return { status: 'success!' }

      /* Create Dr Account */
      case API_PATHS.submitDrAccessCode:
        if (params.accessCode === 'ababab') {
          return {
            status: 'error',
            message: 'Invalid access code.'
          }
        }

        this._retrieveDrDetailsOTP = __DEV_SKIP__ ?
          '123456' : Math.round(Math.random() * 999999).toString().padStart(6, '2')
          
        return {
          status: true,
          ariaID: 'DR-DEV-XYZ',
          phone: '*******7777',
          otp: this._retrieveDrDetailsOTP
        }

      case API_PATHS.validateOTPForRetrieveDrAccount:
        if (params.otp === '123456' || params.otp === this._retrieveDrDetailsOTP) {
          const doctorDetails = {
            fullName: 'Dr Test',
            gender: 'male',
            dateOfBirth: new Date().toISOString(),
            phone: '09998887777',
            email: __OTP_EMAIL__,
            specialization: 'Cardiologist',
            institution: 'American Medical Center',
            licenseNumber: 'CY123456',
            ariaID: params.ariaID
          }
          return { doctorDetails }
        }

        this._createPtAccountOTP = null
        return { status: 'error' }

      case API_PATHS.sendAdditionalDrAccountDetails:
        if (params.ariaID === 'DR-DEV-XYZ')
          return { status: 'success' }
        else
          return  { status: 'error' }

      case API_PATHS.storeDrSeedPhrase:
        devConsoleLog('storeDrSeedPhrase', params.seedPhrase)
        return { status: 'success' }
      case API_PATHS.registerDrToHealthNetwork:
        devConsoleLog('registerDrToHealthNetwork params', params)
        return { status: 'success' }
    }
  }
  public postFormData(apiPath: string, formData: FormData): any {

  }
  public get(apiPath: string, params: any, options?: any): any {

  }
}