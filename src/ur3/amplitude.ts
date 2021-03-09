import * as Amplitude from 'expo-analytics-amplitude'
import { __AMPLITUDE_ID__ } from '../../env'

import { devConsoleLog } from './utilities'
let isInitialized = false

export enum ADescription {
  ONBOARD_1 = 'Setup Name and Birthday',
  ONBOARD_2 = 'Setup Phone and Email address',
  ONBOARD_3 = 'Agree to Terms and Conditions',
  ONBOARD_4 = 'Setup Passcode for Aria Account',
  ONBOARD_5a = 'Phone Verification',
  ONBOARD_5b = 'Phone Verified',
  ONBOARD_6a = 'Email Verification',
  ONBOARD_6b = 'Email Verified',
  ONBOARD_7 = 'Connection to Hospital Created',
  ONBOARD_8 = 'Enter Recovery Phrase',
  ONBOARD_9 = 'Setting Up Storage Options',
  CONFIG_HOSPITAL = 'Connecting to Hospitals',
  CONFIG_MGNT = 'Access Management',
  CONFIG_EXPORT = 'Export Personal Data',
  RECORD_TRENDS = 'Trend Analysis',
  RECORD_LOGS = 'View Activity Logs',
  RECORD_GET = 'Receiving New Record/s',
  RECORD_VIEW = 'Viewing Existing Record/s',
  RECORD_VIEW_DR = 'Viewing Accessible Record/s',
  DOCTOR_LIST = 'View Doctor List',
  PROFILE_LOGIN = 'User Login',
  PROFILE_LOGOUT = 'User Logout',
  PROFILE_DASHBOARD = 'Opened Dashboard',
  MY_PROFILE = 'View My Profile',
  //onboarding
  OPEN_APP = 'Opened the app',
  BROWSE_DEMO = 'Browse the demo',
  ISSUED_ARIAID = 'Issued with ARIA ID',
  COMPLETED_ONBOARDING = 'Completed full on-boarding process',
  STORAGE_EMAIL = 'Email phrase to friends or family',
  STORAGE_ARIA = 'Allow aria team to store it',
  STORAGE_SELF = 'I’ll store it myself',
  JOIN_ARIA = 'Request to join Aria',
  //records
  SHARE_RECORD = 'Share Individual Record',
  SHARE_MULTIPLE = 'Share Selected Record',
  SHARE_PREV = 'Share All Historical Records',
  GRANT_FUTURE_ACCESS = 'Provision of "Future Access" to doctors',
  GRANT_FUTURE_ACCESS_PROFILE = 'Provision of "Future Access" to doctors (via doctor’s profile)',
  RECORDS_TOTAL = 'Records received by patients',
  ACCESS_MANAGEMENT = 'View access management page',
  REVOKE_ALL = 'Revoke all access to a doctor',
  SET_TIME_LIMIT = 'Setting time-limited access to a doctor',
  ACTIVITY_LOG = 'View of a record activity log',

  //profile
  VIEW_SEED = 'View recovery phrase',
  FIND_A_DOCTOR = 'View find a doctor',
  RESTORE_PROFILE = 'Restore profile',
  ATTEMPT_RECOVER = 'Attempt to recover profile',
  FORGOT_SEED = 'Forgot recovery phrase',
  MISSING_INFO = 'Send ID',
  //new onboarding - patient
  NEW_PATIENT = 'New Patient',
  VERIFIED_PATIENT = 'Verified Patient',
  SECURED_PATIENT = 'Secured Patient',
  NEW_DOCTOR = 'New Doctor',
  VERIFIED_DOCTOR = 'Verified Doctor',
  SECURED_DOCTOR = 'Secured Doctor',
  
  
  
  //NEW 
  VIEW_RESULT = 'View Results',
  VIEW_TREND_ANALYSIS = 'View Trend Analysis',
  REVOKE_RECORDS = 'Revoke access to all records',
  PATIENT_WITH_RECORD = 'Patient with record',
  DOCTOR_WITH_RECORD = 'Doctor with record',
  CHANGE_RECORD_VIEW_1 = 'Change record view Basic',
  CHANGE_RECORD_VIEW_2 = 'Change record view Enhanced',
  VIEW_RECORD_1 = 'View record via Find a patient',
  VIEW_RECORD_2 = 'View record via View latest record',
  VIEW_CONSENT_LOG = 'View consent log',
  FIND_A_PATIENT = 'Find a Patient',
  USE_ACCESS_UPDATE_PAGE = 'Use of Access Update page',

  Helper = 'sbn',

  // Recover

  RESTORE_1 = 'Restore profile with complete details',
  RESTORE_2 = 'Restore profile with verified contact details and old passcode',
  RESTORE_3 = 'Restore profile with recovery phrase and old passcode',
  RESTORE_4 = 'Restore profile with no valid information',
  RESTORE_5 = 'Restore profile with contact details and provide ID Picture',

  DELETE_PROFILE = 'Delete Profile',
  EXPORT_DATA = 'Export Data',
  
  
}


export enum AmplitudeEventType {
  OB = 'Onboarding',
  PR = 'Profile',
  RC = 'Records',
  CF = 'Configure',
  RS = 'Sharing'
}

export enum UserType {
  PT = 'Patient',
  DR = 'Doctor',
  DEFAULT = 'Default'
}

export function initialize(): void {
  if (isInitialized || !__AMPLITUDE_ID__)
    return

  Amplitude.initialize(__AMPLITUDE_ID__)
  isInitialized = true
}


export function LogEvents(eventDescription: string, ariaID: string | null,
  properties?: object): void {
  initialize()

  devConsoleLog(ariaID, eventDescription, properties)
  // if (ariaID == null)
  //   ariaID = makeid(9)

  // if (ariaID !== '1')
  //   Amplitude.setUserId(ariaID)

  devConsoleLog(ariaID, eventDescription, properties)

  if (properties)
    Amplitude.logEventWithProperties(eventDescription, properties)
  else
    Amplitude.logEvent(eventDescription)
}

export function AmplitudeSetUserID(id: string | null, options?: object): any {
  initialize()


  if (id) {
    Amplitude.setUserId(id)
    if (options)
      Amplitude.setUserProperties(options)
  } else
    Amplitude.clearUserProperties()
}


function makeid(length): any {
  var result = ''
  var characters = '!@#$%^&*()123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  return result
}
