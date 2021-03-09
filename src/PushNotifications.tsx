// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare var fetch: any
import { __IS_PATIENT_APP__ } from '../env'
import { _LOCALPTDB, _LOCALDRDB } from './ur3/localdb'

import React from 'react'
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import DropdownAlert from 'react-native-dropdownalert'
import { AriaKeyStringStorage } from './ur3/localdb'
import { devConsoleLog, splitStringToArray } from './ur3/utilities'
import { ONBOARDING_PT, MAIN_PT, RECOVER, ONBOARDING, MAIN_DR } from './routes'
import AriaWebAPIFetcher from './accessors/AriaWebAPIFetcher'
import RecoverAccountCore from './core/RecoverAccountCore'
import { LogEvents, AmplitudeEventType, UserType, ADescription } from './ur3/amplitude'

export interface LocalNotification {
  action: string;
  interval: number;
  message: string;
  payload: {};
  title: string;
  type: string;
}

export async function retrievePushTokenAsync(): Promise<string> {
  devConsoleLog('retrievePushToken')
  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.NOTIFICATIONS
  )

  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS)
    finalStatus = status
  }

  if (finalStatus !== 'granted') return

  const userExponentPushToken = await AriaKeyStringStorage.getItem('userExponentPushToken')
  if (userExponentPushToken) {
    _exponentPushTokenForThisUser = userExponentPushToken
    devConsoleLog('retrieved from AsyncStorage: ', _exponentPushTokenForThisUser)
  }
  else {
    try {
      const token = await Notifications.getExpoPushTokenAsync()
      devConsoleLog('getExpoPushTokenAsync: ', token)
      if (token) {
        AriaKeyStringStorage.setItem('userExponentPushToken', token)
        _exponentPushTokenForThisUser = token
        // TODO send ID to Aria Server
      }
    } catch (error) {
      devConsoleLog(error)
    }
  }

  return _exponentPushTokenForThisUser
}

let _exponentPushTokenForThisUser = ''

export async function testSendPushNotificationsAsync(): Promise<void> {
  if (!_exponentPushTokenForThisUser)
    return

  try {
    const body = JSON.stringify({
      to: _exponentPushTokenForThisUser,
      sound: 'default',
      data: {
        title: 'Aria Mobile Notification',
        body: 'Welcome to Aria! ' + new Date(),
      }
    })
    devConsoleLog('sending push notification body', body)

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body
    })

    devConsoleLog('sendPushNotifications response: ', response)
  } catch (error) {
    devConsoleLog('testSendPushNotificationsAsync fetch error', error)
  }
}

export default function PushNotifications(props: any): JSX.Element {

  const apiFetcher = new AriaWebAPIFetcher()
  const dbToUse = __IS_PATIENT_APP__ ? _LOCALPTDB : _LOCALDRDB
  this._core = new RecoverAccountCore(apiFetcher, dbToUse)


  this._notificationSubscription = Notifications.addListener(
    async (notification): Promise<void> => {

      devConsoleLog('notification: ', notification)

      const { data, origin } = notification
      let paramsToPass = {}
      const loggedInUserToken = await AriaKeyStringStorage.getItem('loggedInUserToken')

      if (data.type === 'request_connection') {
        const accountCreation = await AriaKeyStringStorage.getItem('accountCreation')
        const loggedInUserToken = await AriaKeyStringStorage.getItem('loggedInUserToken')

        if ((accountCreation === 'false' || accountCreation === null) && loggedInUserToken === null)
          paramsToPass = { navTo: ONBOARDING.LoginPasscode, hospital: data.hospital, message: data.body }
        else paramsToPass = { navTo: ONBOARDING_PT.HospitalRequest, hospital: data.hospital, message: data.body }
      }
      else if (data.type === 'new_record') {
        const userType = __IS_PATIENT_APP__ ? UserType.PT : UserType.DR
        LogEvents(AmplitudeEventType.RC, '1', { userType, event: ADescription.RECORDS_TOTAL })
        if (loggedInUserToken === null)
          paramsToPass = { navTo: '' }
        else {
          const navTo = __IS_PATIENT_APP__ ? MAIN_PT.PtRecordDetails : MAIN_DR.ViewPatientRecord
          paramsToPass = { navTo, hospital: data.hospital, recordTxid: data.recordTxid }
        }
      }
      else if (data.type === 'send_phrase') {
        const contact = data.details
        if (data.seedPhrase !== null) {
          await this._core.setRegistrationData({
            seedPhrase: data.seedPhrase !== undefined ? splitStringToArray(data.seedPhrase, ' ') : [],
            oldEmail: contact.email,
            oldPhone: contact.phone,
            issueID: contact.issueID
          })
          paramsToPass = { navTo: RECOVER.EnterContactRecoverAccount, ariaCore: this._core, details: data.details }
        } else paramsToPass = { navTo: RECOVER.NoSeedPhrase, ariaCore: this._core, details: data.details }
      }
      else if (data.type === 'restore_account_issues_approved') {
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
      }

      //Actions done to push notif
      if (origin === 'received')
        this._dropDownAlertRef.alertWithType('custom', data.title, data.body, paramsToPass)
      else if (origin === 'selected') {
        props.navigation.push(
          paramsToPass['navTo'],
          { ...paramsToPass, ...props })
      }

    }
  )
  // TODO check if unsubscribe needed
  function _handleLocalNotification(notification: LocalNotification, props: any): void {
    if (notification.action === 'tap') {
      const { payload } = notification
      if (notification.payload['navTo'] === MAIN_PT.PtRecords) props.navigation.replace('PtDashboard')

      props.navigation.push(
        payload['navTo'],
        { ...payload, ...props })
    }
  }

  return (
    <DropdownAlert ref={(ref): void => {
      this._dropDownAlertRef = ref
    }}
      onClose={(notification): void => { _handleLocalNotification(notification, props) }}
      closeInterval={3000} />
  )
}