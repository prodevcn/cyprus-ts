import './shim'
import * as Font from 'expo-font'
import { __IS_DEV_MODE__, __IS_PATIENT_APP__, __IS_DOCTOR_APP__, __DEV_SKIP__ } from './env.js'
import React from 'react'
import { NetInfo, View, SafeAreaView, StyleSheet, StatusBar, Text, TouchableOpacity, Image, Platform } from 'react-native'
import NoInternetNotice from './src/ui/components/NoInternetNotice'
import { AriaKeyStringStorage, _LOCALPTDB, _LOCALDRDB } from './src/ur3/localdb'
import { iconColor, textColor, primaryColor } from './src/ui/styles'
import i18n from './src/i18n'
i18n // to really 'initialize' i18n
import { withTranslation } from 'react-i18next'

import {
  createAppContainer,
  createStackNavigator,
  createSwitchNavigator,
  createDrawerNavigator,
  NavigationDrawerScreenOptions,
  DrawerItems,
  NavigationEvents
} from 'react-navigation'
import CreateAccountNotice from './src/ui/components/CreateAccountNotice'
/*eslint-disable*/
const noHeader = () => ({ header: null })

const mapNavigationStateParamsToProps = (InnerComponent, header) => {
  return class extends React.Component<any, { isConnected: boolean; isToucheEnabled: boolean; isDemo: string }> {
    static navigationOptions = header
    private _notificationSubscription
    private _dropDownAlertRef
    private _core

    public constructor() {
      super({})

      this.state = {
        isToucheEnabled: false,
        isConnected: true,
        isDemo: null
      }
      const apiFetcher = new AriaWebAPIFetcher()
      const dbToUse = __IS_PATIENT_APP__ ? _LOCALPTDB : _LOCALDRDB
      this._core = new RecoverAccountCore(apiFetcher, dbToUse)

    }

    async componentDidMount() {
      console.disableYellowBox = true;
      NetInfo.isConnected.addEventListener(
        'connectionChange',
        this.handleConnectivityChange

      )
      NetInfo.isConnected.fetch().then(this.handleConnectivityChange)
      await Font.loadAsync({
        'raleway-regular': require('./assets/fonts/Raleway-Regular.ttf'),
        'raleway-bold': require('./assets/fonts/Raleway-Bold.ttf'),
        'raleway-italic': require('./assets/fonts/Raleway-Italic.ttf'),
        'raleway-semi-bold': require('./assets/fonts/Raleway-SemiBold.ttf'),
        'montserrat-regular': require('./assets/fonts/Montserrat-Regular.otf'),
        'montserrat-bold': require('./assets/fonts/Montserrat-Bold.otf'),
        'montserrat-italic': require('./assets/fonts/Montserrat-Italic.otf'),
        'montserrat-semi-bold': require('./assets/fonts/Montserrat-SemiBold.otf')
      })

      // Notifications.dismissAllNotificationsAsync()
      // Notifications.cancelAllScheduledNotificationsAsync()

      this._notificationSubscription = Notifications.addListener(
        async (notification): Promise<void> => {
          console.log('notification: ', notification)

          const { data, origin } = notification
          let paramsToPass = {}
          const loggedInUserToken = await AriaKeyStringStorage.getItem('loggedInUserToken')

          switch (data.type) {
            case ('request_connection'):
              const AccountCreated = await AriaKeyStringStorage.getItem('AccountCreated')

              if ((AccountCreated === 'true' || AccountCreated !== null) && loggedInUserToken === null)
                paramsToPass = { navTo: ONBOARDING.LoginPasscode, hospital: data.hospital, message: data.body }
              else paramsToPass = { navTo: ONBOARDING_PT.HospitalRequest, hospital: data.hospital, message: data.body }
              break;


            case ('new_record'):
              console.log('new_record')
              LogEvents(AmplitudeEventType.RC, '1', { userType: UserType.PT, event: ADescription.RECORDS_TOTAL })
              await this._core.addPushNotification(data.recordTxid, data.hospital, data.body)

              const navToNext = __IS_PATIENT_APP__ ? MAIN_PT.PtRecordDetails : MAIN_DR.ViewPatientRecord
              const recordDetails = { hospital: data.hospital, recordTxid: data.recordTxid }
              console.log('loggedInUserToken: ', loggedInUserToken)
              if (loggedInUserToken === null) paramsToPass = { navTo: ONBOARDING.LoginPasscode, navToNext, recordDetails }
              else {
                const navTo = navToNext
                paramsToPass = { navTo, ...recordDetails }
              }
              console.log('paramsToPass: ', paramsToPass)
              break;


            case ('send_phrase'):
              const contact = data.details
              const sendSeedDetails = await this._core.getRestoreDetailsInDB(data.details.issueID)

              const seed = data.seedPhrase !== undefined ? splitStringToArray(data.seedPhrase, ' ') : []
              if (data.seedPhrase !== null) {
                await this._core.setRegistrationData({
                  seedPhrase: seed,
                  oldEmail: contact.email,
                  oldPhone: contact.phone,
                  issueID: contact.issueID,
                  otp: sendSeedDetails.otp,
                  passcode: sendSeedDetails.passcode
                })

                console.log('loggedInUserToken: ', loggedInUserToken)
                const navTo = sendSeedDetails.otp ? RECOVER.EnterSeedToRecoverAccount : RECOVER.EnterContactRecoverAccount
                paramsToPass = { navTo: navTo, ariaCore: this._core, details: data.details, seedPhrase: seed }
              } else paramsToPass = { navTo: RECOVER.NoSeedPhrase, ariaCore: this._core, details: data.details }
              break;


            case ('restore_account_issues_approved'):
              const restoreDetails = await this._core.getRestoreDetailsInDB(data.details.issueID)
              if (restoreDetails !== null) {
                await this._core.setRegistrationData({
                  issueID: data.details.issueID,
                  seedPhrase: splitStringToArray(restoreDetails.seedPhrase, ' '),
                  phone: restoreDetails.phone,
                  email: restoreDetails.email,
                  newContact: true
                })
              }
              paramsToPass = { navTo: RECOVER.EnterOTPRecoverAccount, ariaCore: this._core, details: data.details }
              break;

            case ('shared_record'):
              devConsoleLog('shared_record: ', data.recordTxid)
              const doctor = await this._core.getDoctorPatientList()

              let patientInfo = null
              let params = {}
              if (doctor.isOK()) {
                let patientAriaID = null
                if (doctor && doctor.list && doctor.list.length > 0) {
                  for (let i = 0; i < doctor.list.length; i++) {
                    const info = doctor.list[i]

                    if (info && info.data && info.data.recordTxid) {
                      if (info.data.recordTxid === data.recordTxid) {
                        patientAriaID = info.patientAriaID
                        break
                      }
                    }
                  }

                  if (patientAriaID) {
                    patientInfo = await this._core.getPatientInfo(patientAriaID)
                    if (patientInfo && patientInfo.info) {
                      const patient = patientInfo.info
                      params = patient

                      if (patientInfo.info['dateOfBirth']) {
                        const age = getAge(patient.dateOfBirth)
                        params['age'] = age
                      }
                    }
                  }
                }
              }

              if (loggedInUserToken === null) paramsToPass = { navTo: '' }
              else {
                const navTo = MAIN_DR.ViewPatientRecord
                paramsToPass = { navTo, recordTxid: data.recordTxid, params }
              }
              break;

            case ('update_info'):
              devConsoleLog('data.status: ', data.info.status)
              await this._core.removeDoctorUpdateIssue(data.info.ariaID, data.info.newInfo)

              let navTo = MAIN_DR.HomeProfile
              if (data.info.newInfo.phone) navTo = ''
              paramsToPass = { navTo, issueID: data.info._id }
              break;

          }


          //Actions done to push notif
          console.log('origin: ', origin)
          if (origin === 'received') {
            const message = data.message ? data.message : data.body
            console.log('message: ', message)
            this._dropDownAlertRef.alertWithType('custom', data.title, message, paramsToPass)
          }
          else if (origin === 'selected') {
            const nav = __IS_PATIENT_APP__ ? MAIN_PT.PtRecordDetails : MAIN_DR.ViewPatientRecord
            console.log('nav: ', nav)
            if (paramsToPass['navTo'] === nav) this.props.navigation.popToTop()
            console.log('paramsToPass selected: ', paramsToPass)
            this.props.navigation.navigate(
              paramsToPass['navTo'],
              { ...paramsToPass, ...this.props })
          }

        }
      )

    }

    componentWillUnmount() {
      NetInfo.isConnected.removeEventListener(
        'connectionChange',
        this.handleConnectivityChange
      )
      this._notificationSubscription.remove()
    }

    handleConnectivityChange = async (isConnected: boolean) => {
      const loggedInUserToken = await AriaKeyStringStorage.getItem('loggedInUserToken')
      await AriaKeyStringStorage.setItem('isConnected', isConnected.toString())
      const isLoggedIn = loggedInUserToken !== null
      let isToucheEnabled = false

      if (isLoggedIn) isToucheEnabled = true
      else
        if (isConnected) isToucheEnabled = true

      this.setState({ isConnected, isToucheEnabled })

    }

    _handleLocalNotification(notification: LocalNotification, props: any): void {
      if (notification.action === 'tap') {
        const { payload } = notification
        devConsoleLog('payload: ', payload)
        if (notification.payload['navTo'] === MAIN_PT.PtRecords) props.navigation.replace('PtDashboard')
        // if (notification.payload['navTo'] === MAIN_DR.HomeProfile) props.navigation.replace(MAIN_DR.HomeProfile)

        props.navigation.push(
          payload['navTo'],
          { ...payload, ...props })
      }
    }

    render() {
      const {
        navigation: {
          state: { params }
        }
      } = this.props
      const { isConnected, isToucheEnabled, isDemo } = this.state

      let pointer: 'none' | 'auto' = isToucheEnabled ? 'auto' : 'none'

      return (
        <SafeAreaView style={{ flex: 1 }} pointerEvents={pointer}>
          {Platform.OS === 'ios' ? <StatusBar /> : null}
          <NavigationEvents onDidFocus={async (): Promise<void> => {
            const demo = await AriaKeyStringStorage.getItem('BrowseDemoProfile')
            if (demo === 'true') this.setState({ isDemo: demo })
          }} />
          {isConnected ? null : <NoInternetNotice />}
          <InnerComponent key={'innerComponent'} {...this.props} {...params} />
          {isDemo === 'true' ? <CreateAccountNotice navigation={this.props.navigation} /> : null}
          <DropdownAlert ref={(ref): void => {
            this._dropDownAlertRef = ref
          }}
            onClose={(notification): void => { this._handleLocalNotification(notification, this.props) }}
            closeInterval={3000} />
        </SafeAreaView>
      )

    }
  }
}

function addTab(routeConfig, Component, navTo, header): void {
  let InnerComponent = (withTranslation()(Component))
  routeConfig[navTo] = {
    screen: mapNavigationStateParamsToProps(InnerComponent, header)
  }
}
/*eslint-enable*/

import { COMPONENTS, DOCTOR_LIST, SWITCH_PAGES, ONBOARDING, ONBOARDING_PT, MAIN_PT, RECOVER, ACCESS_MANAGEMENT, SECURITY } from './src/routes'
import { MAIN_DR, ONBOARDING_DR } from './src/routes'

import WalletGenerator from './src/ui/WalletGenerator'
import ChangeLog from './src/ui/ChangeLog'
import OpeningPage from './src/ui/pages/OpeningPage'
import CreatePtAccount from './src/ui/pages/onboarding/CreatePtAccount'
import EnterPtContactDetails from './src/ui/pages/onboarding/EnterPtContactDetails'
import ConsentToPersonalDataUse from './src/ui/pages/onboarding/ConsentToPersonalDataUse'
import CreatePasscode from './src/ui/pages/onboarding/CreatePasscode'
import EnterOTP from './src/ui/pages/onboarding/EnterOTP'
import EditNumber from './src/ui/pages/onboarding/ChangeNumber'
import PhoneNumberIsVerified from './src/ui/pages/onboarding/PhoneNumberIsVerified'
import EnterEmailToken from './src/ui/pages/onboarding/EnterEmailToken'
import EmailIsVerified from './src/ui/pages/onboarding/EmailVerified'
import ChangeEmail from './src/ui/pages/onboarding/EnterPtContactDetails'
import YourPtAriaID from './src/ui/pages/onboarding/YourPtAriaID'
import LoginPasscode from './src/ui/pages/onboarding/LoginPasscode'
import ForgotPassword from './src/ui/pages/onboarding/ForgotPassword'
import EnterOTPForgotPassword from './src/ui/pages/onboarding/EnterOTPForgotPassword'
import CreatePassAfterForgot from './src/ui/pages/onboarding/CreatePasscodeAfterForgot'
import PtDashboard from './src/ui/pages/main/PtDashboard'
import DoctorsList from './src/ui/pages/main/DoctorsList'
import PtRecords from './src/ui/pages/main/PtRecords'
import QRScanner from './src/ui/components/QRScanner'
import HospitalRequest from './src/ui/pages/onboarding/HospitalRequest'
import SuccessPage from './src/ui/components/SuccessPage'
import StorageOptions from './src/ui/pages/onboarding/StorageOptions'
import EnsurePersonalDetails from './src/ui/pages/onboarding/EnsurePersonalDetails'
import ReEnterRecoveryPhrase from './src/ui/pages/onboarding/ReEnterRecoveryPhrase'
import ReviewSeedPhrase from './src/ui/pages/onboarding/ReviewSeedPhrase'
import ReviewDrSeedPhrase from './src/ui/pages/onboarding/ReviewDrSeedPhrase'
import PtRecordDetails from './src/ui/pages/main/RecordDetails'
import PTDrProfile from './src/ui/pages/main/DoctorProfile'
import PtProfile from './src/ui/pages/main/MyProfile'
import EmailVerifiedInProfile from './src/ui/pages/main/EmailVerifiedInProfile'
import EnterPinCode from './src/ui/pages/main/EnterPinCode'
import EnterOtpAfterUpdate from './src/ui/pages/main/EnterOtpAfterUpdate'
import VerifyEmail from './src/ui/pages/main/VerifyEmail'
import EditProfile from './src/ui/pages/onboarding/CreatePtAccount'
import PtItsAllYours from './src/ui/pages/onboarding/PtItsAllYours'
import Introduction from './src/ui/pages/onboarding/Introduction'

import OpeningPageDr from './src/ui/pages/OpeningPageDr'
import DrDashboard from './src/ui/pages/main/dashboarddr/DrDashboard'
import AllPatientResults from './src/ui/pages/main/dashboarddr/profile/AllPatientResults'
import DrRecord from './src/ui/pages/main/dashboarddr/DrRecord'
import EnterAccessCode from './src/ui/pages/onboardingdr/EnterAccessCode'
import ConfirmDrPersonalDetails from './src/ui/pages/onboardingdr/ConfirmDrPersonalDetails'
import ConfirmDrContactsOrUpdateEmail from './src/ui/pages/onboardingdr/ConfirmDrContacts'
import UpdateDoctorDetails from './src/ui/pages/onboardingdr/UpdateDoctorDetails'
import UpdateSent from './src/ui/pages/onboardingdr/UpdateSent'
import ItsAllYours from './src/ui/pages/onboardingdr/ItsAllYours'
import IntroductionDr from './src/ui/pages/onboardingdr/IntroductionDr'
import PrivateAndSecurePage from './src/ui/pages/onboardingdr/PrivateAndSecurePage'
import MoreThanAPassword from './src/ui/pages/onboardingdr/MoreThanAPassword'
import StorageOptionsDr from './src/ui/pages/onboardingdr/StorageOptionsDr'
import ReEnterDrRecoveryPhrase from './src/ui/pages/onboardingdr/ReEnterDrRecoveryPhrase'
import YouDidIt from './src/ui/pages/onboardingdr/YouDidIt'
import DrProfile from './src/ui/pages/main/dashboarddr/profile/DrProfile'
import ValidateCode from './src/ui/pages/main/dashboarddr/profile/ValidateCode'
import InformUserBeforeUpdate from './src/ui/pages/main/dashboarddr/profile/InformUserBeforeUpdate'
import DrVerifyOTP from './src/ui/pages/main/dashboarddr/profile/DrVerifyOTP'
import DrVerifyEmail from './src/ui/pages/main/dashboarddr/profile/DrVerifyEmail'
import DrVerifyOTPSuccess from './src/ui/pages/main/dashboarddr/profile/DrVerifyOTPSuccess'
import DrVerifyEmailSuccess from './src/ui/pages/main/dashboarddr/profile/DrVerifyEmailSuccess'
import RequestAccess from './src/ui/pages/onboardingdr/RequestAccess'
import ThankYouForRequesting from './src/ui/pages/onboardingdr/ThankYouForRequesting'

import EnterContactRecoverAccount from './src/ui/pages/onboarding/EnterContactRecoverAccount'
import EnterOTPRecoverAccount from './src/ui/pages/onboarding/EnterOTPRecoverAccount'
import EnterSeedToRecoverAccount from './src/ui/pages/onboarding/EnterSeedToRecoverAccount'
import FindYourRecoveryPhrase from './src/ui/pages/onboarding/FindYourRecoveryPhrase'
import WhatIsRecoveryPhrase from './src/ui/pages/onboarding/WhatIsRecoveryPhrase'
import CreatePasscodeForRecover from './src/ui/pages/onboarding/CreatePasscodeForRecover'
import MissingInformation from './src/ui/pages/onboarding/MissingInformation'
import SuccessRecover from './src/ui/pages/onboarding/SuccessRecover'
import SuccessPhoneVerifyEmail from './src/ui/pages/onboarding/SuccessPhoneVerifyEmail'
import EnterEmailTokenRecover from './src/ui/pages/onboarding/EnterEmailTokenRecover'
import NoSeedPhrase from './src/ui/pages/onboarding/NoSeedPhrase'


import AccessList from './src/ui/pages/accessManagement/AccessList'
import AccessProfile from './src/ui/pages/accessManagement/AccessProfile'
import AccessRecords from './src/ui/pages/accessManagement/AccessRecords'
import ConfirmRevoke from './src/ui/pages/accessManagement/ConfirmRevoke'
import SetTimeLimit from './src/ui/pages/accessManagement/SetTimeLimit'
import ConfirmChangeAccess from './src/ui/pages/accessManagement/ConfirmChangeAccess'
import ConfirmChangeFutureAccess from './src/ui/pages/accessManagement/ConfirmChangeFutureAccess'
import ConfirmSharing from './src/ui/pages/main/ConfirmSharing'
import AllRecordsAreShared from './src/ui/pages/main/AllRecordsAreShared'
import ConfirmShareAllRecords from './src/ui/pages/main/ConfirmShareAllRecords'

import SecurityList from './src/ui/pages/security/SecurityList'
import RevokeAllAccess from './src/ui/pages/security/RevokeAllAccess'
import SecurityEnterPinCode from './src/ui/pages/security/SecurityEnterPinCode'
import ValidatePasscodeLogout from './src/ui/pages/security/ValidatePasscodeLogout'
import ActivityLogs from './src/ui/pages/security/ActivityLogs'
import UserNotifications from './src/ui/pages/security/UserNotifications'
import ViewRecoverySeed from './src/ui/pages/security/RecoveryPhrase'
import LearnMoreRecoveryPhrase from './src/ui/pages/onboarding/WhatIsRecoveryPhrase'
import ConfirmChangePasscode from './src/ui/pages/security/ConfirmChangePasscode'
import ConfirmDeleteAccount from './src/ui/pages/security/ConfirmDeleteAccount'
import ConfirmLogoutAccount from './src/ui/pages/security/ConfirmLogoutAccount'
import EnterOtpForDeleteAccount from './src/ui/pages/security/EnterOtpForDeleteAccount'
import ExportDataList from './src/ui/pages/security/ExportDataList'
import DataDetails from './src/ui/pages/security/DataDetails'

import DashboardQRScanner from './src/ui/pages/main/DashboardQrScanner'

const authRouteConfig = {}
if (!__IS_DEV_MODE__ && __IS_PATIENT_APP__)
  addTab(authRouteConfig, OpeningPage, SWITCH_PAGES.OpeningPage, noHeader)
else if (__IS_DOCTOR_APP__) {
  // const drRouteConfig = {}
  if (!__DEV_SKIP__)
    addTab(authRouteConfig, OpeningPageDr, SWITCH_PAGES.OpeningPage, noHeader)
  addTab(authRouteConfig, EnterAccessCode, ONBOARDING_DR.EnterAccessCode, noHeader)
  addTab(authRouteConfig, EnterOTP, ONBOARDING_DR.EnterAccessOTP, noHeader)
  addTab(authRouteConfig, ConfirmDrPersonalDetails, ONBOARDING_DR.ConfirmDrPersonalDetails, noHeader)
  addTab(authRouteConfig, UpdateDoctorDetails, ONBOARDING_DR.UpdateDoctorDetails, noHeader)
  addTab(authRouteConfig, UpdateSent, ONBOARDING_DR.UpdateSent, noHeader)
  addTab(authRouteConfig, ConfirmDrContactsOrUpdateEmail, ONBOARDING_DR.ConfirmDrContactsOrUpdateEmail, noHeader)
  addTab(authRouteConfig, RequestAccess, ONBOARDING_DR.RequestAccess, noHeader)
  addTab(authRouteConfig, ThankYouForRequesting, ONBOARDING_DR.ThankYouForRequesting, noHeader)
}
if (__IS_PATIENT_APP__) {
  addTab(authRouteConfig, CreatePtAccount, ONBOARDING_PT.CreatePtAccount, noHeader)
  addTab(authRouteConfig, EnterPtContactDetails, ONBOARDING_PT.EnterPtContactDetails, noHeader)
  addTab(authRouteConfig, PhoneNumberIsVerified, ONBOARDING.PhoneNumberIsVerified, noHeader)
  addTab(authRouteConfig, ChangeEmail, ONBOARDING.ChangeEmail, noHeader)
  addTab(authRouteConfig, EnterEmailToken, ONBOARDING.EnterEmailToken, noHeader)
}
// Common to both Patient and Doctor
addTab(authRouteConfig, ConsentToPersonalDataUse, ONBOARDING.ConsentToPersonalDataUse, noHeader)
addTab(authRouteConfig, CreatePasscode, ONBOARDING.CreatePasscode, noHeader)
addTab(authRouteConfig, EnterOTP, ONBOARDING.EnterOTP, noHeader)
addTab(authRouteConfig, EmailIsVerified, ONBOARDING.EmailIsVerified, noHeader)
addTab(authRouteConfig, LoginPasscode, ONBOARDING.LoginPasscode, noHeader)
addTab(authRouteConfig, ForgotPassword, ONBOARDING.ForgotPassword, noHeader)
addTab(authRouteConfig, EnterOTPForgotPassword, ONBOARDING.EnterOTPForgotPassword, noHeader)
addTab(authRouteConfig, CreatePassAfterForgot, ONBOARDING.CreatePassAfterForgot, noHeader)
addTab(authRouteConfig, ChangeLog, 'ChangeLog', noHeader)
addTab(authRouteConfig, EditNumber, ONBOARDING.EditNumber, noHeader)

// Recover account pages
addTab(authRouteConfig, EnterContactRecoverAccount, RECOVER.EnterContactRecoverAccount, noHeader)
addTab(authRouteConfig, EnterOTPRecoverAccount, RECOVER.EnterOTPRecoverAccount, noHeader)
addTab(authRouteConfig, EnterSeedToRecoverAccount, RECOVER.EnterSeedToRecoverAccount, noHeader)
addTab(authRouteConfig, FindYourRecoveryPhrase, RECOVER.FindYourRecoveryPhrase, noHeader)
addTab(authRouteConfig, WhatIsRecoveryPhrase, RECOVER.WhatIsRecoveryPhrase, noHeader)
addTab(authRouteConfig, CreatePasscodeForRecover, RECOVER.CreatePasscodeForRecover, noHeader)
addTab(authRouteConfig, MissingInformation, RECOVER.MissingInformation, noHeader)
addTab(authRouteConfig, SuccessRecover, RECOVER.SuccessRecover, noHeader)
addTab(authRouteConfig, SuccessPhoneVerifyEmail, RECOVER.SuccessPhoneVerifyEmail, noHeader)
addTab(authRouteConfig, EnterEmailTokenRecover, RECOVER.EnterEmailTokenRecover, noHeader)
addTab(authRouteConfig, NoSeedPhrase, RECOVER.NoSeedPhrase, noHeader)

const postCreateAcctRouteConfig = {}
if (__IS_PATIENT_APP__) {
  addTab(postCreateAcctRouteConfig, QRScanner, COMPONENTS.QRScanner, noHeader)
  addTab(postCreateAcctRouteConfig, HospitalRequest, ONBOARDING_PT.HospitalRequest, noHeader)
  addTab(postCreateAcctRouteConfig, WalletGenerator, ONBOARDING.WalletGenerator, noHeader)
  addTab(postCreateAcctRouteConfig, PtItsAllYours, ONBOARDING_PT.ItsAllYours, noHeader)
  addTab(postCreateAcctRouteConfig, Introduction, ONBOARDING_PT.Introduction, noHeader)
  addTab(postCreateAcctRouteConfig, PrivateAndSecurePage, ONBOARDING_PT.PrivateAndSecure, noHeader)
  addTab(postCreateAcctRouteConfig, MoreThanAPassword, ONBOARDING_PT.MoreThanAPassword, noHeader)
  addTab(postCreateAcctRouteConfig, StorageOptions, ONBOARDING_PT.StorageOptions, noHeader)
  addTab(postCreateAcctRouteConfig, EnsurePersonalDetails, ONBOARDING_PT.EnsurePersonalDetails, noHeader)
  addTab(postCreateAcctRouteConfig, ReEnterRecoveryPhrase, ONBOARDING_PT.ReEnterRecoveryPhrase, noHeader)
  addTab(postCreateAcctRouteConfig, ReviewSeedPhrase, ONBOARDING_PT.ReviewSeedPhrase, noHeader)
  addTab(postCreateAcctRouteConfig, EditProfile, ONBOARDING_PT.EditProfile, noHeader)
} else if (__IS_DOCTOR_APP__) {
  addTab(postCreateAcctRouteConfig, EnterEmailToken, ONBOARDING.EnterEmailToken, noHeader)
  addTab(postCreateAcctRouteConfig, ItsAllYours, ONBOARDING_DR.ItsAllYours, noHeader)
  addTab(postCreateAcctRouteConfig, IntroductionDr, ONBOARDING_DR.IntroductionDr, noHeader)
  addTab(postCreateAcctRouteConfig, PrivateAndSecurePage, ONBOARDING_DR.PrivateAndSecure, noHeader)
  addTab(postCreateAcctRouteConfig, MoreThanAPassword, ONBOARDING_DR.MoreThanAPassword, noHeader)
  addTab(postCreateAcctRouteConfig, WalletGenerator, ONBOARDING.WalletGenerator, noHeader)
  addTab(postCreateAcctRouteConfig, StorageOptionsDr, ONBOARDING_DR.StorageOptionsDr, noHeader)
  addTab(postCreateAcctRouteConfig, ReEnterDrRecoveryPhrase, ONBOARDING_DR.ReEnterDrRecoveryPhrase, noHeader)
  addTab(postCreateAcctRouteConfig, ReviewDrSeedPhrase, ONBOARDING_DR.ReviewSeedPhrase, noHeader)
}
// Common to both Patient and Doctor
addTab(postCreateAcctRouteConfig, SuccessPage, ONBOARDING_PT.SuccessPage, noHeader)

const lastCreateAcctPagesRouteConfig = {}
if (__IS_PATIENT_APP__)
  addTab(lastCreateAcctPagesRouteConfig, YourPtAriaID, ONBOARDING_PT.YourPtAriaID, noHeader)
else
  addTab(lastCreateAcctPagesRouteConfig, YouDidIt, ONBOARDING_DR.YouDidIt, noHeader)


/* Doctor Drawer Stack */

const drDashboardStack = {}
addTab(drDashboardStack, DrDashboard, MAIN_DR.HomeDashboard, DrDashboard.navigationOptions)
addTab(drDashboardStack, AllPatientResults, MAIN_DR.AllPatientResults, noHeader)
addTab(drDashboardStack, ConfirmLogoutAccount, SECURITY.ConfirmLogoutAccount, noHeader)
addTab(drDashboardStack, ValidatePasscodeLogout, SECURITY.ValidatePasscodeLogout, noHeader)
addTab(drDashboardStack, DrRecord, MAIN_DR.ViewPatientRecord, DrRecord.navigationOptions)

const drSecurityStack = {}
addTab(drSecurityStack, SecurityList, SECURITY.List, SecurityList.navigationOptions)
addTab(drSecurityStack, ViewRecoverySeed, SECURITY.ViewRecoverySeed, ViewRecoverySeed.navigationOptions)
addTab(drSecurityStack, LearnMoreRecoveryPhrase, SECURITY.LearnMoreRecoveryPhrase, noHeader)
addTab(drSecurityStack, SecurityEnterPinCode, SECURITY.SecurityEnterPinCode, noHeader)
addTab(drSecurityStack, ConfirmChangePasscode, SECURITY.ConfirmChangePasscode, noHeader)
addTab(drSecurityStack, ConfirmDeleteAccount, SECURITY.ConfirmDeleteAccount, ConfirmDeleteAccount.navigationOptions)
addTab(drSecurityStack, EnterOtpForDeleteAccount, SECURITY.EnterOtpForDeleteAccount, noHeader)
addTab(drSecurityStack, ExportDataList, SECURITY.ExportDataList, ExportDataList.navigationOptions)
addTab(drSecurityStack, DataDetails, SECURITY.DataDetails, DataDetails.navigationOptions)

const drProfileStack = {}
addTab(drProfileStack, DrProfile, MAIN_DR.HomeProfile, DrProfile.navigationOptions)
addTab(drProfileStack, DrVerifyOTP, MAIN_DR.DrVerifyOTP, noHeader)
addTab(drProfileStack, DrVerifyOTPSuccess, MAIN_DR.DrVerifyOTPSuccess, noHeader)
addTab(drProfileStack, DrVerifyEmail, MAIN_DR.DrVerifyEmail, noHeader)
addTab(drProfileStack, DrVerifyEmailSuccess, MAIN_DR.DrVerifyEmailSuccess, noHeader)
addTab(drProfileStack, InformUserBeforeUpdate, MAIN_DR.InformUserBeforeUpdate, noHeader)
addTab(drProfileStack, ValidateCode, MAIN_DR.ValidateCode, noHeader)


// const drAppRouteConfig = createStackNavigator(drAppStack,{initialRouteName : MAIN_DR.DrDashboard})

const DrawerContent = (props: any): JSX.Element => (
  <SafeAreaView style={{ borderColor: 'red', flex: 1 }}>
    <View
      style={[{
        backgroundColor: 'white',
        height: '15%',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingLeft: 20,
        marginTop: 30,
      }]}>
      <Image style={{ width: 140, height: 70, borderWidth: 0, borderColor: 'blue' }}
        resizeMode="contain" source={require('./assets/header.png')} />
    </View>
    <DrawerItems style={{ paddingTop: 20 }} {...props} />
    <View style={logoutSt.logoutButtonContainer}>
      <TouchableOpacity
        style={logoutSt.tab}
        onPress={async (): Promise<void> => {
          devConsoleLog('logout!')

          const demo = await AriaKeyStringStorage.getItem('BrowseDemoProfile')
          if (demo === 'true') {
            await AriaKeyStringStorage.removeItem('BrowseDemoProfile')
            await AriaKeyStringStorage.removeItem('loggedInUserID')
            props.navigation.navigate('OpeningPage', { fromDashboard: true })

          } else props.navigation.navigate(SECURITY.ConfirmLogoutAccount)
        }
        }>
        <SimpleLineIcons name='logout' size={20} color={iconColor} />
        <Text style={logoutSt.label}>Logout</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
)

const drMainDrawer = createDrawerNavigator(
  {
    Dashboard: {
      screen: createStackNavigator(drDashboardStack),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          drawerIcon: <SimpleLineIcons name={'user'} size={20} />
        }
      }
    },
    Profile: {
      screen: createStackNavigator(drProfileStack),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'My Profile',
          drawerIcon: <MaterialCommunityIcons name={'face-profile'} size={20} />
        }
      }
    },
    Security: {
      screen: createStackNavigator(drSecurityStack),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'My Security',
          drawerIcon: <SimpleLineIcons name={'lock'} size={20} />
        }
      }
    }
  },
  {
    drawerPosition: 'right',
    contentComponent: DrawerContent,
  })

const ptDashboardStack = {}
addTab(ptDashboardStack, PtDashboard, MAIN_PT.PtDashboard, PtDashboard.navigationOptions)
addTab(ptDashboardStack, ConfirmLogoutAccount, SECURITY.ConfirmLogoutAccount, noHeader)
addTab(ptDashboardStack, ValidatePasscodeLogout, SECURITY.ValidatePasscodeLogout, noHeader)
addTab(ptDashboardStack, PtRecords, MAIN_PT.PtRecords, PtRecords.navigationOptions)
addTab(ptDashboardStack, PtRecordDetails, MAIN_PT.PtRecordDetails, noHeader)
addTab(ptDashboardStack, ShareDoctor, DOCTOR_LIST.ShareToADoctor, ShareDoctor.navigationOptions)
addTab(ptDashboardStack, PTDrProfile, 'DashboardDRProfile', PTDrProfile.navigationOptions)
addTab(ptDashboardStack, ConfirmSharing, MAIN_PT.ConfirmSharing, noHeader)
addTab(ptDashboardStack, AllRecordsAreShared, MAIN_PT.AllRecordsAreShared, noHeader)
addTab(ptDashboardStack, ConfirmShareAllRecords, MAIN_PT.ConfirmShareAllRecords, noHeader)
addTab(ptDashboardStack, ConfirmChangeFutureAccess, ACCESS_MANAGEMENT.ConfirmChangeFutureAccess, noHeader)

const ptFindDoctorStack = {}
addTab(ptFindDoctorStack, DoctorsList, DOCTOR_LIST.SearchADoctor, DoctorsList.navigationOptions)
addTab(ptFindDoctorStack, PTDrProfile, 'DashboardDRProfile', PTDrProfile.navigationOptions)
addTab(ptFindDoctorStack, PTDrProfile, MAIN_PT.PTDrProfile, PTDrProfile.navigationOptions)
addTab(ptFindDoctorStack, PtRecords, MAIN_PT.PtRecords, PtRecords.navigationOptions)
addTab(ptFindDoctorStack, PtRecordDetails, MAIN_PT.PtRecordDetails, noHeader)
addTab(ptFindDoctorStack, ConfirmChangeFutureAccess, ACCESS_MANAGEMENT.ConfirmChangeFutureAccess, noHeader)

const ptAccessManagement = {}
addTab(ptAccessManagement, AccessList, ACCESS_MANAGEMENT.List, AccessList.navigationOptions)
addTab(ptAccessManagement, AccessProfile, ACCESS_MANAGEMENT.Profile, AccessProfile.navigationOptions)
addTab(ptAccessManagement, AccessRecords, ACCESS_MANAGEMENT.Records, AccessRecords.navigationOptions)
addTab(ptAccessManagement, ConfirmRevoke, ACCESS_MANAGEMENT.ConfirmRevoke, noHeader)
addTab(ptAccessManagement, SetTimeLimit, ACCESS_MANAGEMENT.SetTimeLimit, noHeader)
addTab(ptAccessManagement, ConfirmChangeAccess, ACCESS_MANAGEMENT.ConfirmChangeAccess, noHeader)
addTab(ptAccessManagement, ConfirmChangeFutureAccess, ACCESS_MANAGEMENT.ConfirmChangeFutureAccess, noHeader)


const ptSecurity = {}
addTab(ptSecurity, SecurityList, SECURITY.List, SecurityList.navigationOptions)
addTab(ptSecurity, RevokeAllAccess, SECURITY.RevokeAllAccess, noHeader)
addTab(ptSecurity, SecurityEnterPinCode, SECURITY.SecurityEnterPinCode, noHeader)
addTab(ptSecurity, ActivityLogs, SECURITY.ActivityLogs, ActivityLogs.navigationOptions)
addTab(ptSecurity, ViewRecoverySeed, SECURITY.ViewRecoverySeed, ViewRecoverySeed.navigationOptions)
addTab(ptSecurity, LearnMoreRecoveryPhrase, SECURITY.LearnMoreRecoveryPhrase, noHeader)
addTab(ptSecurity, ConfirmChangePasscode, SECURITY.ConfirmChangePasscode, noHeader)
addTab(ptSecurity, ConfirmDeleteAccount, SECURITY.ConfirmDeleteAccount, noHeader)
addTab(ptSecurity, EnterOtpForDeleteAccount, SECURITY.EnterOtpForDeleteAccount, noHeader)
addTab(ptSecurity, ExportDataList, SECURITY.ExportDataList, ExportDataList.navigationOptions)
addTab(ptSecurity, DataDetails, SECURITY.DataDetails, DataDetails.navigationOptions)

const ptProfileStack = {}
addTab(ptProfileStack, PtProfile, MAIN_PT.PtProfile, PtProfile.navigationOptions)
addTab(ptProfileStack, EnterPinCode, MAIN_PT.EnterPinCode, noHeader)
addTab(ptProfileStack, EnterOtpAfterUpdate, MAIN_PT.EnterOtpAfterUpdate, noHeader)
addTab(ptProfileStack, VerifyEmail, MAIN_PT.VerifyEmail, noHeader)
addTab(ptProfileStack, EmailVerifiedInProfile, MAIN_PT.EmailVerifiedInProfile, noHeader)

const ptConnectToprovider = {}
addTab(ptConnectToprovider, DashboardQRScanner, COMPONENTS.DashboardQRScanner, noHeader)

const ptNotifications = {}
addTab(ptNotifications, UserNotifications, COMPONENTS.Notifications, UserNotifications.navigationOptions)

const ptMainDrawer = createDrawerNavigator(
  {
    Dashboard: {
      screen: createStackNavigator(ptDashboardStack),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          drawerIcon: <MaterialCommunityIcons name={'face-profile'} size={20} />,
        }
      }
    },
    Profile: {
      screen: createStackNavigator(ptProfileStack),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'My Profile',
          drawerIcon: <AntDesign name={'user'} size={20} />
        }
      },
      activeTintColor: primaryColor
    },
    Security: {
      screen: createStackNavigator(ptSecurity),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'My Security',
          drawerIcon: <SimpleLineIcons name={'lock'} size={20} />
        }
      }
    },
    Notifications: {
      screen: createStackNavigator(ptNotifications),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'Notifications',
          drawerIcon: <Ionicons name={'ios-notifications-outline'} size={20} />
        }
      }
    },
    FindDoctor: {
      screen: createStackNavigator(ptFindDoctorStack),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'Find a Doctor',
          drawerIcon: <MaterialCommunityIcons name={'doctor'} size={20} />
        }
      }
    },
    AccessManagement: {
      screen: createStackNavigator(ptAccessManagement),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'Manage Access',
          drawerIcon: <Feather name={'server'} size={20} />
        }
      }
    },
    ConnectToProvider: {
      screen: createStackNavigator(ptConnectToprovider),
      navigationOptions: (): NavigationDrawerScreenOptions => {
        return {
          title: 'Connect to provider',
          drawerIcon: <MaterialCommunityIcons name={'qrcode-scan'} size={20}></MaterialCommunityIcons>
        }
      }
    }
  },
  {
    drawerPosition: 'right',
    contentComponent: DrawerContent,
    contentOptions: {
      activeTintColor: primaryColor
    }
  },
)



const switchNavigator = createSwitchNavigator(
  {
    Auth: createStackNavigator(
      authRouteConfig
    ),
    PostSignup: createStackNavigator(
      postCreateAcctRouteConfig
    ),
    LastCreateAcct: createStackNavigator(
      lastCreateAcctPagesRouteConfig
    ),
    App: (__IS_PATIENT_APP__ ? ptMainDrawer : drMainDrawer)

  },
  {
    initialRouteName: 'Auth'
  }
)

const AppContainer = createAppContainer(switchNavigator)

import { CreateTables } from './src/ur3/localdb'
import ShareDoctor from './src/ui/pages/main/ShareDoctor'
import { SimpleLineIcons, MaterialCommunityIcons, Ionicons, AntDesign, Feather } from '@expo/vector-icons'
import DropdownAlert from 'react-native-dropdownalert'
import { LocalNotification } from './src/PushNotifications'
import { Notifications } from 'expo'
import { splitStringToArray, devConsoleLog, getAge } from './src/ur3/utilities'
import { LogEvents, AmplitudeEventType, ADescription, UserType } from './src/ur3/amplitude'
import AriaWebAPIFetcher from './src/accessors/AriaWebAPIFetcher'
import RecoverAccountCore from './src/core/RecoverAccountCore'
CreateTables()

function App(): JSX.Element {
  AriaKeyStringStorage.removeItem('loggedInUserToken')
  return <AppContainer />
}

export default App


const logoutSt = StyleSheet.create({
  label: {
    display: 'flex',
    color: textColor,
    fontSize: 17,
    paddingLeft: 40,
    alignSelf: 'center',
    fontWeight: '400'
  },
  tab: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingLeft: 15,
    alignItems: 'center'
  },
  logoutButtonContainer: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    justifyContent: 'center'
  }
})