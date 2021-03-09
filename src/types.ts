import i18next from 'i18next'
export type TFunction = i18next.TFunction

import { NavigationScreenProp, NavigationState } from 'react-navigation'
interface NavigationParams {
  text: string;
}
export type Navigation = NavigationScreenProp<NavigationState, NavigationParams>;

export interface TranslatorAndNavigation {
  t: TFunction;
  navigation: Navigation;
}

export interface NavigationOnly {
  navigation: Navigation;
}

import CreatePtAccountCore, { CoreForOnboarding } from './core/CreatePtAccountCore'
import CreateDrAccountCore from './core/OnboardingDr/CreateDrAccountCore'
import ConnectToHospitalCore from './core/ConnectToHospitalCore'
import PtRecordsCore from './core/PtRecordsCore'
import PtDashboardCore from './core/PtDashboardCore'
import PtProfileCore from './core/PtProfileCore'
import DrProfileCore from './core/DrProfileCore'
import RecoverAccountCore from './core/RecoverAccountCore'
import AccessManagementCore from './core/AccessManagement/AccessManagementCore'
import SecurityCore from './core/Security/SecurityCore'
import DataCore from './core/Security/DataCore'
import LoginCore from './core/LoginCore'
import RequestAccessCore from './core/OnboardingDr/RequestAccessCore';

export interface TranslatorNavigationAriaCore extends TranslatorAndNavigation {
  ariaCore: CoreForOnboarding; // TODO change to AriaCore
}

export interface TranslatorNavigationCreatePtAccountCore extends TranslatorAndNavigation {
  ariaCore: CreatePtAccountCore;
}
export interface TNavCreateDrAccountCore extends TranslatorAndNavigation {
  ariaCore: CreateDrAccountCore;
}
export interface TNavPtRecordsCore extends TranslatorAndNavigation {
  ariaCore: PtRecordsCore;
}
export interface TNavCoreForOnboarding extends TranslatorAndNavigation {
  ariaCore: CoreForOnboarding;
}

export interface TranslatorNavigationConnectToHospitalCore extends TranslatorAndNavigation {
  ariaCore: ConnectToHospitalCore;
}

export interface TNavPtDashboardCore extends TranslatorAndNavigation {
  ariaCore: PtDashboardCore;
}

export interface TNavPtProfileCore extends TranslatorAndNavigation {
  ariaCore: PtProfileCore;
}

export interface TNavDrProfileCore extends TranslatorAndNavigation {
  ariaCore: DrProfileCore;
}

export interface TNavPtRecoverCore extends TranslatorAndNavigation {
  ariaCore: RecoverAccountCore;
}

export interface TNavPtLoginCore extends TranslatorAndNavigation {
  ariaCore: LoginCore;
}

export interface TNavAccessManagementCore extends TranslatorAndNavigation {
  ariaCore: AccessManagementCore;
}

export interface TNavSecurityCore extends TranslatorAndNavigation {
  ariaCore: SecurityCore;
}

export interface TNavDataCore extends TranslatorAndNavigation {
  ariaCore: DataCore;
}

export interface TNavRequestAccessCore extends TranslatorAndNavigation {
  ariaCore: RequestAccessCore;
}

// used as React Component state type
export interface UIStateForIFABP {
  isButtonEnabled: boolean;
  statusText: string;
  isDoingActivity?: boolean;
}
export interface UIStateForIFA2BP {
  isButtonEnabled: boolean;
  isSecondButtonEnabled: boolean;
  statusText: string;
  isDoingActivity?: boolean;
}

export enum UserAction {
  PressButton = 'PB',
  PressPrimaryButton = 'PPB',
  TapItem = 'TI',
  UpdateInputField = 'UIF',
  ResetValues = 'RV'
}
export enum UIAction {
  UIStateUpdatedByUI
}

export type AnyPrimitiveType = string | number | boolean

export interface ObjectOfPrimitives {
  [key: string]: AnyPrimitiveType | string[];
}

export interface UserProfile {
  ariaID: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  shareContactDetails: boolean;
  isEmailVerified: boolean;
  cryptoKeys: CryptoKeys;
  specialization?: string;
  institution?: string;
  licenseNumber?: string;
  firstName?: string;
  surname?: string;
}

export interface CryptoKeys {
  walletAddress: string;
  privateKey: string;
  publicKey: string;
}

export interface RecordDetails {
  keys: any;
  date: string;
  data: string;
  txid: string;
  name: string;
  providerAddress: string;
  providerPhone1: string;
  providerPhone2: string;
  providerEmail: string;
  hospitalID: string;
  licenseNumber: string;
  randomKey: string;
  sharedTo?: string;
  expiration?: string;
}

export interface PatientInfo {
  dateOfBirth: string;
  gender: string;
  fullName: string;
}

// NOTE We use tuples so that proper type checking in the call site can be done,
// with minimal additional characters (array brackets)
//   handleEvent([UserAction.UpdateInputField, { newData }])
// instead of
//   handleEvent({ action: UserAction.UpdateInputField, data: { newData } })
export type UserOrUIActionAndData =
  [UserAction.UpdateInputField, ObjectOfPrimitives]
  | [UserAction.PressPrimaryButton]
  | [UserAction.PressButton]
  | [UIAction.UIStateUpdatedByUI, ObjectOfPrimitives]
  | [UserAction.ResetValues]


export enum UIReaction {
  SetUIState = 'SUS',
  SwitchToConfirmPasscodeState = 'SwitchToConfirmPasscodeState',
  ResetToCreatePasscodeStateDueToMismatch = 'ResetToCreatePasscodeStateDueToMismatch',
  Navigate = 'NAV',
  NavigateToNextPageAfter = 'NAVtoNextPageAfter',
  NavigateAfterSuccess = 'NAVAfterSuccess',
  NavToEnterOtpAndVerifyEmail = 'NavToEnterOtpAndVerifyEmail',
  ShowAlertMessage = 'ShowAlertMessage',
  NavToVerifyEmail = 'NavToVerifyEmail',
  NavToLogout = 'NavToLogout'
}

export type UIReactionCommand =
  [UIReaction]
  | [
    UIReaction.SetUIState,
    UIStateForIFABP
  ]
  | [
    UIReaction.Navigate,
    string
  ]
  | [
    UIReaction.NavigateAfterSuccess,
    string?
  ]
  | [UIReaction.NavigateToNextPageAfter]
  | [UIReaction.SwitchToConfirmPasscodeState]
  | [UIReaction.ResetToCreatePasscodeStateDueToMismatch]
  | [UIReaction.NavToEnterOtpAndVerifyEmail]
  | [UIReaction.ShowAlertMessage, string]

export type UIDoReactionFunction = (uirc: UIReactionCommand) => void
