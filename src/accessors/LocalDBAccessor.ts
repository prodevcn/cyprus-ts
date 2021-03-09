/* eslint-disable @typescript-eslint/no-explicit-any */
declare var Promise: any

import { ExecSqlErrorHandler as alertAndLogExecSqlError } from '../ur3/reactutilities'
import { sleep, devConsoleLog } from '../ur3/utilities'

import { PtRegistrationData, DrAccountDetails, DoctorDetails } from './AriaAPIAccessor'
import { AriaKeyStringStorage, DBTransactor } from '../ur3/localdb'
import { UserProfile, CryptoKeys, RecordDetails } from '../types'
import CoreResultObject, { CRO } from '../core/AriaCore'
import { mixedTypeAnnotation } from '@babel/types'

interface UserProfileDB {
  ariaid: string;
  personaldatajson: string;
  personalsettingsjson: string;
  privatekey: string;
  publickey: string;
  userid: number;
  walletaddress: string;
}

export default class LocalDBAccessor {
  protected _DBTransactor: DBTransactor

  public constructor(apiFetcher: DBTransactor) {
    this._DBTransactor = apiFetcher
  }

  public async addPatientAndSetAsLoggedInAsync(ariaID: string, registrationData: PtRegistrationData): Promise<void> {
    const { fullName, gender, dateOfBirth, email, phone, shareContactDetails, isEmailVerified } = registrationData
    const personalData = { fullName, gender, dateOfBirth, email, phone }
    const personalSettings = { shareContactDetails, isEmailVerified }

    const alreadyInDb = await this.checkIfUserIsAlreadyExisting(ariaID)
    devConsoleLog('alreadyInDb: ', alreadyInDb)
    if (alreadyInDb) {
      return this._updateUserInfoAsync(ariaID,
        JSON.stringify(personalData),
        JSON.stringify(personalSettings))
    }
    return this._addUserAndSetAsLoggedInAsync(ariaID,
      JSON.stringify(personalData),
      JSON.stringify(personalSettings))
  }

  public updatePatientInfoAsync(ariaID: string, registrationData: any): Promise<void> {
    const { fullName, gender, dateOfBirth, email, phone, shareContactDetails, isEmailVerified } = registrationData
    const personalData = { fullName, gender, dateOfBirth, email, phone }
    const personalSettings = { shareContactDetails, isEmailVerified }

    return this._updateUserInfoAsync(ariaID,
      JSON.stringify(personalData),
      JSON.stringify(personalSettings))
  }


  public async addDoctorAndSetAsLoggedInAsync(drAccountDetails: DrAccountDetails): Promise<void> {
    const { fullName, gender, dateOfBirth, email, phone, shareContactDetails,
      specialization, institution, licenseNumber, ariaID
    } = drAccountDetails
    const personalData = {
      fullName,
      gender,
      dateOfBirth,
      email,
      phone,
      specialization,
      institution,
      licenseNumber
    }
    const personalSettings = { shareContactDetails }

    const alreadyInDb = await this.checkIfUserIsAlreadyExisting(ariaID)
    if (alreadyInDb) {
      return this._updateUserInfoAsync(ariaID,
        JSON.stringify(personalData),
        JSON.stringify(personalSettings))
    }
    return this._addUserAndSetAsLoggedInAsync(ariaID,
      JSON.stringify(personalData),
      JSON.stringify(personalSettings))
  }

  public async updateDoctorProfile(drAccountDetails: DoctorDetails): Promise<void> {
    const { title, firstName, surname, gender, dateOfBirth, email, phone, shareContactDetails,
      specialization, institution, licenseNumber, ariaID
    } = drAccountDetails
    const fullName = title + ' ' + firstName + ' ' + surname
    const personalData = {
      fullName,
      gender,
      dateOfBirth,
      email: email.value,
      phone: phone.value,
      specialization,
      institution,
      licenseNumber
    }
    const personalSettings = { shareContactDetails }


    return this._updateUserInfoAsync(ariaID,
      JSON.stringify(personalData),
      JSON.stringify(personalSettings))
  }

  public async addFavorite(ariaID: string): Promise<void> {
    const alreadyInDb = await this.checkIfMarkedAsfavorite(ariaID)
    if (!alreadyInDb) {
      await this._transactionAsync('INSERT INTO favoriteDoctor'
        + ' (ariaID)' + ' VALUES (?)', [ariaID]
      )
    }
  }

  public async removeFavorite(ariaID: string): Promise<void> {

    const alreadyInDb = await this.checkIfMarkedAsfavorite(ariaID)
    if (alreadyInDb) {
      await this._transactionAsync('DELETE from favoriteDoctor'
        + ' WHERE ariaID = ?', [ariaID]
      )
    }
  }

  public async removeUserAccount(): Promise<CoreResultObject> {
    const userID = await AriaKeyStringStorage.getItem('loggedInUserID')
    devConsoleLog('userID: ', userID)
    await this._transactionAsync('DELETE from users'
      + ' WHERE userid = ?', [userID]
    )

    return CRO()
  }

  public async removeFavoriteDoctors(): Promise<CoreResultObject> {
    this._transactionAsync('DROP TABLE favoriteDoctor')
    this._transactionAsync('CREATE TABLE IF NOT EXISTS favoriteDoctor ('
      + 'ariaID TEXT PRIMARY KEY NOT NULL'
      + ', CONSTRAINT unique_txid UNIQUE (ariaID)'
      + ');')
    return CRO()
  }

  public async removeDemoAccount(): Promise<void> {
    await this._transactionAsync('DELETE from users'
      + ' WHERE ariaID = ?', ['a12bc34']
    )
    return
  }

  public async checkIfMarkedAsfavorite(ariaID: string): Promise<boolean> {
    const faved = await this._transactionAsync('SELECT * FROM favoriteDoctor'
      + ' WHERE ariaID = ?', [ariaID]
    )

    if (faved && faved.length > 0) return true
    return false

  }

  public async getAllFavoriteDoctors(): Promise<string[]> {
    const favs = await this._transactionAsync('SELECT * FROM favoriteDoctor')
    if (favs.length !== 0 || favs !== null || favs !== undefined) {
      let arrayOfFaves = []

      for (let j = 0; j < favs.length; j++) arrayOfFaves.push(favs[j].ariaID)
      return arrayOfFaves
    }
    return []
  }

  public async getDoctorIssueInfo(ariaID: string): Promise<any> {
    const issues = await this._transactionAsync('SELECT * FROM issues'
      + ' WHERE ariaid = ?', [ariaID]
    )
    return issues
  }

  public setIssueData(existing: any, newInfo: any): any {
    const mergedIssues = {}
    for (const key in newInfo)
      mergedIssues[key] = newInfo[key]

    for (const key in existing) {
      if (!newInfo[key])
        mergedIssues[key] = existing[key]
    }

    return mergedIssues
  }

  public removeIssueData(existing: any, newInfo: any): any {
    const mergedIssues = {}
    for (const key in existing) {
      if (!newInfo[key])
        mergedIssues[key] = existing[key]
    }
    return mergedIssues
  }

  public async addDoctorUpdateIssue(ariaID: string, issueID: string, newInfo: any): Promise<void> {
    const alreadyInDb = await this.checkIfAlreadyHasIssues(ariaID)
    if (alreadyInDb) {
      const existingIssue = await this.getDoctorIssueInfo(ariaID)
      let existing = existingIssue[0] ? existingIssue[0].newInfo : {}

      if (typeof existing === 'string') existing = JSON.parse(existing)

      const mergedIssues = this.setIssueData(existing, newInfo)
      await this._transactionAsync('UPDATE issues SET newInfo = ?'
        + ' WHERE ariaID = ?', [JSON.stringify(mergedIssues), ariaID]
      )
    } else {
      await this._transactionAsync('INSERT INTO issues'
        + ' (ariaID, issueID, newInfo)'
        + ' VALUES (?, ?, ?)',
        [
          ariaID,
          issueID,
          JSON.stringify(newInfo)
        ]
      )
    }
  }

  public async removeDoctorUpdateIssue(ariaID: string, approvedInfo: any): Promise<void> {
    const existingIssue = await this.getDoctorIssueInfo(ariaID)
    let existing = existingIssue[0] ? existingIssue[0].newInfo : {}
    
    if (typeof existing === 'string') existing = JSON.parse(existing)

    const mergedIssues = this.removeIssueData(existing, approvedInfo)
    await this._transactionAsync('UPDATE issues SET newInfo = ?'
      + ' WHERE ariaID = ?', [JSON.stringify(mergedIssues), ariaID]
    )
  }

  public async _addRestorationIssue(issueID: string, values: { seedPhrase: string; email: string; phone: string; otp: string; passcode: string }): Promise<void> {
    const alreadyInDb = await this.checkIfAlreadyHasRestoreIssues(issueID)
    if (!alreadyInDb) {
      await this._transactionAsync('INSERT INTO restore'
        + ' (issueID, seedPhrase, email, phone, otp, passcode)'
        + ' VALUES (?, ?, ?, ?, ?, ?)',
        [
          issueID,
          values.seedPhrase,
          values.email,
          values.phone,
          values.otp,
          values.passcode
        ]
      )
    }
  }

  public async addPushNotification(txid: string, ariaID: string, header: string, message: string): Promise<void> {
    const d = new Date()
    const date = d.toLocaleDateString() + '-' + d.toLocaleTimeString() + '-' + d.getHours()

    const alreadyInDb = await this.checkIfAlreadyInNotifTable(txid)
    if (!alreadyInDb) {
      await this._transactionAsync('INSERT INTO notifications'
        + ' (txid, ariaID, header, message, date)'
        + ' VALUES (?, ?, ?, ?, ?)',
        [
          txid,
          ariaID,
          header,
          message,
          date
        ]
      )
    }
  }

  public async removePushNotification(ariaID: string): Promise<void> {
    await this._transactionAsync('DELETE from notifications'
      + ' WHERE ariaID = ?', [ariaID]
    )
  }

  public async checkIfAlreadyInNotifTable(txid: string): Promise<boolean> {
    const value = await this._transactionAsync('SELECT * FROM notifications'
      + ' WHERE txid = ?', [txid]
    )

    devConsoleLog('value: ', value)
    if (value && value.length > 0) return true
    return false
  }

  public async getLoggedInUserNotifications(): Promise<any> {
    const profile = await this.getProfileOfLoggedInUser()
    const value = await this._transactionAsync('SELECT DISTINCT * FROM notifications'
      + ' WHERE ariaID = ?', [profile.ariaID]
    )

    devConsoleLog('value: ', value)
    if (value && value.length > 0) return value
    return []
  }


  private async _addUserAndSetAsLoggedInAsync(ariaID: string, personalDataJSONString: string, personalSettingsJSONString: string): Promise<void> {
    devConsoleLog('_addUserAndSetAsLoggedInAsync ')
    await this._transactionAsync('INSERT INTO users'
      + ' (ariaid, personaldatajson, personalsettingsjson)'
      + ' VALUES (?, ?, ?)',
      [
        ariaID,
        personalDataJSONString,
        personalSettingsJSONString
      ]
    )

    const newUserRows = await this._transactionAsync('SELECT userid FROM users'
      + ' WHERE ariaid = ?', [ariaID]
    )
    const localUserIDString = newUserRows[0].userid.toString()
    await AriaKeyStringStorage.setItem('loggedInUserID', localUserIDString)
  }

  public async _updateUserInfoAsync(ariaID: string, personalDataJSONString: string, personalSettingsJSONString: string): Promise<void> {
    await this._transactionAsync(
      'UPDATE users SET personaldatajson = ?, personalsettingsjson = ?'
      + ' WHERE ariaid = ?', [personalDataJSONString, personalSettingsJSONString, ariaID]
    )

    const newUserRows = await this._transactionAsync('SELECT userid FROM users'
      + ' WHERE ariaid = ?', [ariaID]
    )
    const localUserIDString = newUserRows[0].userid.toString()
    await AriaKeyStringStorage.setItem('loggedInUserID', localUserIDString)

    return
  }

  public async setProfileOfDemoUser(): Promise<void> {

    const registrationData = {
      fullName: 'Demo Account',
      gender: 'male',
      dateOfBirth: '1992-01-20',
      email: 'demo.account@gmail.com',
      phone: '639562662586',
      shareContactDetails: true,
      isEmailVerified: true
    }
    const { fullName, gender, dateOfBirth, email, phone, shareContactDetails, isEmailVerified } = registrationData
    const ariaID = 'a12bc34'


    const personalData = { fullName, gender, dateOfBirth, email, phone }
    const personalSettings = { shareContactDetails, isEmailVerified }

    const alreadyInDb = await this.checkIfUserIsAlreadyExisting('ariaID')
    devConsoleLog('alreadyInDb: ', alreadyInDb)
    if (alreadyInDb) {
      return this._updateUserInfoAsync(ariaID,
        JSON.stringify(personalData),
        JSON.stringify(personalSettings))
    }
    return this._addUserAndSetAsLoggedInAsync(ariaID,
      JSON.stringify(personalData),
      JSON.stringify(personalSettings))
  }


  public async setProfileOfDemoDoctor(): Promise<void> {
    devConsoleLog('setProfileOfDemoDoctor')
    const ariaID = 'a12bc34'
    const drAccountDetails = {
      fullName: 'Aria Demo',
      gender: 'male',
      firstName: 'Aria',
      surname: 'Demo',
      title: 'Dr.',
      dateOfBirth: '1992-01-20',
      email: 'demo.account@gmail.com',
      phone: '639562662586',
      shareContactDetails: true,
      isEmailVerified: true,
      specialization: 'Specialization',
      institution: 'Hospital',
      licenseNumber: '123ABC'
    }

    const { fullName, gender, dateOfBirth, email, phone, shareContactDetails, firstName, surname,
      specialization, institution, licenseNumber
    } = drAccountDetails
    const personalData = {
      fullName,
      firstName,
      surname,
      gender,
      dateOfBirth,
      email,
      phone,
      specialization,
      institution,
      licenseNumber
    }
    const personalSettings = { shareContactDetails }

    const alreadyInDb = await this.checkIfUserIsAlreadyExisting(ariaID)
    if (alreadyInDb) {
      return this._updateUserInfoAsync(ariaID,
        JSON.stringify(personalData),
        JSON.stringify(personalSettings))
    }
    return this._addUserAndSetAsLoggedInAsync(ariaID,
      JSON.stringify(personalData),
      JSON.stringify(personalSettings))
  }


  public async getProfileOfLoggedInUser(): Promise<UserProfile> {
    const userID = await AriaKeyStringStorage.getItem('loggedInUserID')
    if (userID) {
      const result = await this._transactionAsync('SELECT * FROM users'
        + ' WHERE userid = ?', [userID]
      )
      let profile = result[0]

      if (profile === undefined) {
        const allUsers = await this._transactionAsync('SELECT * FROM users')
        if (allUsers.length > 0) profile = allUsers[allUsers.length - 1]
      }

      if (profile) {
        const { fullName, gender, dateOfBirth, phone, email, firstName, surname,
          specialization, institution, licenseNumber
        } = JSON.parse(profile.personaldatajson)
        const { shareContactDetails, isEmailVerified } = JSON.parse(profile.personalsettingsjson)

        const isDoctor = specialization != null
        if (isDoctor) {
          return {
            ariaID: profile.ariaid,
            fullName,
            gender,
            firstName,
            surname,
            dateOfBirth,
            phone,
            email,
            specialization,
            institution,
            licenseNumber,
            shareContactDetails,
            isEmailVerified,
            cryptoKeys: {
              walletAddress: profile.walletaddress,
              privateKey: profile.privatekey,
              publicKey: profile.publickey
            }
          }
        }

        return {
          ariaID: profile.ariaid,
          fullName,
          gender,
          dateOfBirth,
          phone,
          email,
          shareContactDetails,
          isEmailVerified,
          cryptoKeys: {
            walletAddress: profile.walletaddress,
            privateKey: profile.privatekey,
            publicKey: profile.publickey
          }
        }
      }
    }

    return null
  }

  public async getProfileOfPhoneNumber(userPhone: string): Promise<string> {
    const users = await this._transactionAsync('SELECT * FROM users')

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const { phone } = JSON.parse(user.personaldatajson)
      if (userPhone === phone)
        return user.ariaid
    }

    return null
  }

  public async getAllUsers(): Promise<UserProfileDB[]> {
    return await this._transactionAsync('SELECT * FROM users')
  }

  public async checkWalletKeys(): Promise<boolean> {
    const userID = await AriaKeyStringStorage.getItem('loggedInUserID')
    const userRows = await this._transactionAsync('SELECT privatekey FROM users'
      + ' WHERE userid = ?', [userID]
    )

    return userRows[0].privatekey !== null && userRows[0].privatekey !== undefined
  }

  public async tempValidatePasscodeLocally(userid: number, passcode: string): Promise<boolean> {
    const userRows = await this._transactionAsync('SELECT passcode FROM users'
      + ' WHERE userid = ?', [userid]
    )
    const retrievedPasscode = userRows[0].passcode
    await sleep(1000)
    return retrievedPasscode === passcode
  }

  public async checkIfUserIsAlreadyExisting(ariaID: string): Promise<boolean> {
    const user = await this._transactionAsync('SELECT * FROM users'
      + ' WHERE ariaid = ?', [ariaID]
    )

    if (user && user.length > 0) return true
    return false
  }

  public async checkIfAlreadyHasIssues(ariaID: string): Promise<boolean> {
    const user = await this._transactionAsync('SELECT * FROM issues'
      + ' WHERE ariaid = ?', [ariaID]
    )

    if (user && user.length > 0) return true
    return false
  }

  public async checkIfAlreadyHasRestoreIssues(issueID: string): Promise<boolean> {
    const user = await this._transactionAsync('SELECT * FROM restore'
      + ' WHERE issueID = ?', [issueID]
    )

    if (user && user.length > 0) return true
    return false
  }

  public async checkIfRecordIsAlreadyExisting(record: RecordDetails): Promise<boolean> {
    devConsoleLog('record.txid: ', record.txid)
    const rec = await this._transactionAsync('SELECT * FROM records'
      + ' WHERE txid = ?', [record.txid]
    )

    devConsoleLog('****rec: ', rec)
    if (rec && rec.length > 0) return true
    return false
  }

  public async checkIfProviderIsAlreadyExisting(hospitalid: string): Promise<boolean> {
    const provider = await this._transactionAsync('SELECT * FROM providers'
      + ' WHERE hospitalid = ?', [hospitalid]
    )

    if (provider && provider.length > 0) return true
    return false
  }

  public async storeWalletAndKeys(ariaID: string,
    walletAndKeys: CryptoKeys): Promise<void> {
    const { walletAddress, publicKey, privateKey } = walletAndKeys
    await this._transactionAsync(
      'UPDATE users SET walletaddress = ?, publickey = ?, privatekey = ?'
      + ' WHERE ariaid = ?', [walletAddress, publicKey, privateKey, ariaID]
    )
    return
  }

  public async updateSharedRecordTo(txid: string, sharedTo: string): Promise<void> {
    await this._transactionAsync(
      'UPDATE records SET sharedTo = ?'
      + ' WHERE txid = ?', [sharedTo, txid]
    )
  }

  public async getRestoreDetailsInDB(issueID: string): Promise<any> {
    const restore = await this._transactionAsync('SELECT * FROM restore'
      + ' WHERE issueID = ?', [issueID]
    )

    devConsoleLog('restore: ', restore)

    if (restore[0] !== undefined) return restore[0]
    return null
  }

  public async getRecordsSharedTo(txid: string): Promise<string> {
    const record = await this._transactionAsync('SELECT * FROM records'
      + ' WHERE txid = ?', [txid]
    )

    if (record[0] && record[0].sharedTo !== undefined) return record[0].sharedTo
    return ''
  }

  public async getProviderInfoInCache(hospitalID: string): Promise<any> {

    const alreadyInDb = await this._transactionAsync(
      'SELECT * FROM providers WHERE hospitalid = ?',
      [hospitalID]
    )

    devConsoleLog('alreadyInDb: ', alreadyInDb)
    if (alreadyInDb && alreadyInDb.length > 0)
      return alreadyInDb[0]

    return null
  }

  public async storeProviderInfo(
    hospitalID: string,
    licenseNumber: string,
    name: string,
    address: string,
    phone1: string,
    phone2: string,
    email: string,
  ): Promise<void> {
    //TODO include all provider info

    const alreadyInDb = await this.checkIfProviderIsAlreadyExisting(hospitalID)
    if (!alreadyInDb) {
      await this._transactionAsync('INSERT INTO providers'
        + ' (hospitalid, licensenumber, name, address, phone1, phone2, email)'
        + ' VALUES (?,?,?,?,?,?,?)',
        [hospitalID, licenseNumber, name, address, phone1, phone2, email]
      )
    }
  }

  public async getDoctorInfoInCache(ariaID: string): Promise<any> {

    const alreadyInDb = await this._transactionAsync(
      'SELECT * FROM doctors WHERE ariaID = ?',
      [ariaID]
    )

    devConsoleLog('alreadyInDb: ', alreadyInDb)
    if (alreadyInDb && alreadyInDb.length > 0)
      return alreadyInDb[0]

    return null
  }

  public async storeDoctorInfo(ariaID: string, publicKey: string): Promise<void> {
    await this._transactionAsync('INSERT INTO doctors'
      + ' (ariaID, publicKey)'
      + ' VALUES (?,?)',
      [ariaID, publicKey]
    )
  }

  public async getRecordInCache(txid: string): Promise<any> {
    const cachedDataInDb = await this._transactionAsync(
      'SELECT * FROM records WHERE txid = ?',
      [txid]
    )
    if (cachedDataInDb && cachedDataInDb.length > 0)
      return cachedDataInDb[0]

    return null
  }

  public async storePtRawRecords(ariaID: string, raw: string): Promise<any> {
    const alreadyInDb = await this.getPtRawRecords(ariaID)
    if (alreadyInDb === null) {
      await this._transactionAsync('INSERT INTO rawRecords'
        + ' (ariaID, raw)'
        + ' VALUES (?,?)',
        [ariaID, raw]
      )
    } else {
      await this._transactionAsync(
        'UPDATE rawRecords SET raw = ?'
        + ' WHERE ariaID = ?', [raw, ariaID]
      )
    }
  }

  public async getPtRawRecords(ariaID: string): Promise<any> {
    const cachedDataInDb = await this._transactionAsync(
      'SELECT * FROM rawRecords WHERE ariaID = ?',
      [ariaID]
    )

    if (cachedDataInDb && cachedDataInDb.length > 0)
      return cachedDataInDb[0]

    return null
  }

  public async storeRecordInCache(record: RecordDetails): Promise<void> {
    const alreadyInDb = await this.checkIfRecordIsAlreadyExisting(record)
    devConsoleLog('alreadyInDb: ', alreadyInDb)
    if (!alreadyInDb) {
      await this._transactionAsync('INSERT INTO records'
        + ' (txid, date, data, name, hospitalID, licenseNumber, randomKey, sharedTo'
        + ', expiration,providerAddress,providerPhone1, providerPhone2, providerEmail )'
        + ' VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          record.txid,
          record.date,
          record.data,
          record.name,
          record.hospitalID,
          record.licenseNumber,
          record.randomKey,
          record.sharedTo,
          record.expiration,
          record.providerAddress,
          record.providerPhone1,
          record.providerPhone2,
          record.providerEmail
        ]
      )
    }
  }

  /* eslint-disable @typescript-eslint/explicit-function-return-type */
  private async _transactionAsync(
    sqlStatement: string,
    sqlParams: any[] = [],
    rejectCallback: any = alertAndLogExecSqlError
    // TODO PROD use imported alertAndLogExecSqlError from reactutilties
  ) {
    return await new Promise(resolve => {
      this._DBTransactor.transaction(tx =>
        tx.executeSql(
          sqlStatement,
          sqlParams,
          (tx, { rows }) => resolve(rows._array),
          rejectCallback
        )
      )
    })
  }
}