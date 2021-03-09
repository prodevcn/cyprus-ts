import { APIFetcher } from '../accessors/BaseAccessor'
import AriaLocalDBAccessor from '../accessors/LocalDBAccessor'
import { DBTransactor } from '../ur3/localdb'
import { AriaAPIAccessor, PossibleDataFromAPI, UserActivities } from '../accessors/AriaAPIAccessor'

export enum CoreResult {
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  OK = 'OK',
  NOK = 'NOK',
  EXCEPTION = 'EXCEPTION',
  PHONE_ALREADY_IN_USE = 'PHONE_ALREADY_IN_USE',
  CONFIRM_PASSCODE = 'CONFIRM_PASSCODE',
  PASSCODE_MISMATCH = 'PASSCODE_MISMATCH',
  ENTER_OTP_AFTER_CHANGE_CONTACT = 'ENTER_OTP_AFTER_CHANGE_CONTACT',
  ENTER_OTP_AND_VERIFY_EMAIL = 'ENTER_OTP_AND_VERIFY_EMAIL',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  INVALID_OTP = 'INVALID_OTP',
  INVALID_QR = 'INVALID_QR',
  INVALID_PASSCODE = 'INVALID_PASSCODE',
  SAME_EMAIL_INPUT = 'SAME_EMAIL_INPUT',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR'
}
// NOTE keys should be exactly as value in CoreResult
export const CoreResultToErrorTKey = {
  SERVER_ERROR: 'errors:server',
  NETWORK_ERROR: 'errors:network',
  PHONE_ALREADY_IN_USE: 'inputerrors:phonenumberalreadyinuse',
  INVALID_OTP: 'inputerrors:InvalidOTP',
  INVALID_QR: 'inputerrors:InvalidQR',
  INVALID_PASSCODE: 'inputerrors:InvalidPasscode',
  SAME_EMAIL_INPUT: 'inputerrors:DuplicateEmail',
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function CRO(coreResult: CoreResult = CoreResult.OK, params?: any): CoreResultObject {
  // NOTE CreateResultObject
  const cro: any = {
    /* eslint-enable */
    coreResult,
    isOK: (): boolean => coreResult === CoreResult.OK
  }

  if (params) {
    for (const key in params)
      cro[key] = params[key]
  }

  return cro
}

export default interface CoreResultObject {
  coreResult: CoreResult;
  isOK: () => boolean;
  message?: string;
  ariaID?: string;
  retrievedData?: PossibleDataFromAPI;
  _devSMSOTP?: string;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  updateHistory?: any[];
  decoded?: any;
  rawItems?: any;
  otp?: string;
  token?: string;
  publicKey?: string;
  accesskeys?: string;
  seedPhrase?: string;
  error?: string;
  doctors?: string[];
  activites?: UserActivities[];
  /* eslint-enable */
}

export class AriaCore {
  protected _APIAccessor: AriaAPIAccessor
  protected _LocalDBAccessor: AriaLocalDBAccessor

  public constructor(apiFetcher: APIFetcher, localDBTransactor: DBTransactor) {
    this._APIAccessor = new AriaAPIAccessor(apiFetcher)
    this._LocalDBAccessor = new AriaLocalDBAccessor(localDBTransactor)
  }
}