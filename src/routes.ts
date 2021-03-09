export const SWITCH_PAGES = {
  OpeningPage: 'OpeningPage'
}

export const ONBOARDING = {
  OpeningPage: 'OpeningPage',
  ConsentToPersonalDataUse: 'ConsentToPersonalDataUse',
  CreatePasscode: 'CreatePasscode',
  LoginPasscode: 'LoginPasscode',
  ForgotPassword: 'ForgotPassword',
  EnterOTPForgotPassword: 'EnterOTPForgotPassword',
  CreatePassAfterForgot: 'CreatePassAfterForgot',
  EnterOTP: 'EnterOTP',
  ChangeContactDetails: 'ChangeContactDetails',
  EnterEmailToken: 'EnterEmailToken',
  ChangeEmail: 'ChangeEmail',
  PhoneNumberIsVerified: 'PhoneNumberIsVerified',
  EmailIsVerified: 'EmailIsVerified',
  WalletGenerator: 'WalletGenerator',
  EditNumber: 'EditNumber'
}

export const RECOVER = {
  EnterContactRecoverAccount: 'EnterContactRecoverAccount',
  EnterOTPRecoverAccount: 'EnterOTPRecoverAccount',
  EnterSeedToRecoverAccount: 'EnterSeedToRecoverAccount',
  FindYourRecoveryPhrase: 'FindYourRecoveryPhrase',
  WhatIsRecoveryPhrase: 'WhatIsRecoveryPhrase',
  CreatePasscodeForRecover: 'CreatePasscodeForRecover',
  MissingInformation: 'MissingInformation',
  SuccessRecover: 'SuccessRecover',
  NoSeedPhrase: 'NoSeedPhrase',
  SuccessPhoneVerifyEmail: 'SuccessPhoneVerifyEmail',
  EnterEmailTokenRecover: 'EnterEmailTokenRecover'
}

export const ONBOARDING_PT = {
  CreatePtAccount: 'CreatePtAccount',
  EnterPtContactDetails: 'EnterPtContactDetails',
  YourPtAriaID: 'YourPtAriaID',
  PrivateAndSecure: 'PrivateAndSecure',
  MoreThanAPassword: 'MoreThanAPassword',
  HospitalRequest: 'HospitalRequest',
  SuccessPage: 'SuccessPage',
  StorageOptions: 'StorageOptions',
  EnsurePersonalDetails: 'EnsurePersonalDetails',
  ReviewSeedPhrase: 'ReviewSeedPhrase',
  ReEnterRecoveryPhrase: 'ReEnterRecoveryPhrase',
  EditProfile: 'EditProfile',
  ItsAllYours: 'ItsAllYours',
  Introduction: 'Introduction',
}

export const ONBOARDING_DR = {
  EnterAccessCode: 'EnterAccessCode',
  RequestAccess: 'RequestAccess',
  ThankYouForRequesting: 'ThankYouForRequesting',
  EnterAccessOTP: 'EnterAccessOTP',
  ConfirmDrPersonalDetails: 'ConfirmDrPersonalDetails',
  ConfirmDrContactsOrUpdateEmail: 'ConfirmDrContactsOrUpdateEmail',
  ItsAllYours: 'ItsAllYours',
  PrivateAndSecure: 'PrivateAndSecure',
  MoreThanAPassword: 'MoreThanAPassword',
  StorageOptionsDr: 'StorageOptionsDr',
  ReEnterDrRecoveryPhrase: 'ReEnterDrRecoveryPhrase',
  YouDidIt: 'YouDidIt',
  UpdateDoctorDetails: 'UpdateDoctorDetails',
  UpdateSent: 'UpdateSent',
  ReviewSeedPhrase: 'ReviewSeedPhrase',
  IntroductionDr: 'IntroductionDr'
}

export const MAIN_PT = {
  PtDashboard: 'PtDashboard',
  DoctorsList: 'DoctorsList',
  PtRecords: 'PtRecords',
  PtRecordDetails: 'PtRecordDetails',
  PtProfile: 'PtProfile',
  EnterPinCode: 'EnterPinCode',
  EnterOtpAfterUpdate: 'EnterOtpAfterUpdate',
  VerifyEmail: 'VerifyEmail',
  PTDrProfile: 'PTDrProfile',
  ConfirmSharing: 'ConfirmSharing',
  ConfirmShareAllRecords: 'ConfirmShareAllRecords',
  AllRecordsAreShared: 'AllRecordsAreShared',
  EmailVerifiedInProfile: 'EmailVerifiedInProfile'
}

export const DOCTOR_LIST = {
  ShareToADoctor: 'ShareToADoctor',
  SearchADoctor: 'SearchADoctor',
}

export const ACCESS_MANAGEMENT = {
  List: 'AMList',
  Profile: 'AMDoctorProfile',
  Records: 'AMRecordsList',
  ConfirmRevoke: 'ConfirmRevoke',
  SetTimeLimit: 'SetTimeLimit',
  ConfirmChangeAccess: 'ConfirmChangeAccess',
  ConfirmChangeFutureAccess: 'ConfirmChangeFutureAccess',
}

export const SECURITY = {
  List: 'SecurityList',
  RevokeAllAccess: 'RevokeAllAccess',
  SecurityEnterPinCode: 'SecurityEnterPinCode',
  ActivityLogs: 'ActivityLogs',
  ViewRecoverySeed: 'ViewRecoverySeed',
  LearnMoreRecoveryPhrase: 'LearnMoreRecoveryPhrase',
  ConfirmChangePasscode: 'ConfirmChangePasscode',
  ConfirmDeleteAccount: 'ConfirmDeleteAccount',
  ConfirmLogoutAccount: 'ConfirmLogoutAccount',
  ValidatePasscodeLogout: 'ValidatePasscodeLogout',
  EnterOtpForDeleteAccount: 'EnterOtpForDeleteAccount',
  ExportDataList: 'ExportDataList',
  DataDetails: 'DataDetails'
}

export const MODALS_WITHOUT_BACK_BUTTON_TRANSPARENTBG = [
  MAIN_PT.PtRecordDetails
]

export const MODALS_THAT_NAV_BACK_TO_DASHBOARD = [
  DOCTOR_LIST.ShareToADoctor,
  MAIN_PT.PtProfile
]

export const MAIN_DR = {
  HomeProfile: 'DrawerProfile',
  HomeDashboard: 'DrawerDashboard',
  HomeSecurity: 'DrawerSecurity',

  DrDashboard: 'Dashboard',
  DrProfile: 'Profile',
  DrSecurity: 'Security',
  ViewPatientRecord: 'ViewPatientRecord',
  DrDrawerHome: 'DrDrawerHome',

  DrVerifyOTP: 'DrVerifyOTP',
  DrVerifyEmail: 'DrVerifyEmail',
  DrVerifyOTPSuccess: 'DrVerifyOTPSuccess',
  DrVerifyEmailSuccess: 'DrVerifyEmailSuccess',
  InformUserBeforeUpdate: 'InformUserBeforeUpdate',
  AllPatientResults: 'AllPatientResults',
  ValidateCode: 'ValidateCode',
}

export const COMPONENTS = {
  QRScanner: 'QRScanner',
  DashboardQRScanner: 'DashboardQRScanner',
  Notifications: 'Notifications',
  ConsentLogs: 'ConsentLogs'
}
