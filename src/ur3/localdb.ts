import { __IS_PATIENT_APP__ } from '../../env'

import * as SQLite from 'expo-sqlite'
import { AsyncStorage } from 'react-native'
export const AriaKeyStringStorage = AsyncStorage

import {
  DbTxnErrorHandler,
  DbTxnSuccessHandler,
  ExecSqlErrorHandler,
  ExecSqlSuccessHandler
} from './reactutilities'
import { devConsoleLog } from '../ur3/utilities'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DBTransactor {
  transaction: any;
}

export const _LOCALPTDB = SQLite.openDatabase('ariaptlocal.db') as DBTransactor
export const _LOCALDRDB = SQLite.openDatabase('ariadrlocal.db') as DBTransactor

export function CreateTables(): void {
  let DbToUse = __IS_PATIENT_APP__ ? _LOCALPTDB : _LOCALDRDB
  // doDBTransactionTo(DbToUse, 'DROP TABLE users')
  // doDBTransactionTo(DbToUse, 'DROP TABLE providers')
  // doDBTransactionTo(DbToUse, 'DROP TABLE records')
  // doDBTransactionTo(DbToUse, 'DROP TABLE rawRecords')
  // doDBTransactionTo(DbToUse, 'DROP TABLE doctors')
  // doDBTransactionTo(DbToUse, 'DROP TABLE issues')
  // doDBTransactionTo(DbToUse, 'DROP TABLE restore')
  // doDBTransactionTo(DbToUse, 'DROP TABLE notifications')

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS users ('
    + 'userid INTEGER PRIMARY KEY NOT NULL'
    + ', ariaid TEXT(10) NOT NULL'
    + ', personaldatajson TEXT NOT NULL' // includes doctor fields if doctor app
    + ', personalsettingsjson TEXT NOT NULL'
    + ', walletaddress TEXT(100)'
    + ', publickey TEXT(100)'
    + ', privatekey TEXT(255)'
    + ', CONSTRAINT unique_ariaid UNIQUE (ariaid)'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS providers ('
    + 'hospitalid TEXT(100) PRIMARY KEY NOT NULL'
    + ', licensenumber TEXT NOT NULL'
    + ', name TEXT NOT NULL'
    + ', address TEXT NOT NULL'
    + ', phone1 TEXT NOT NULL'
    + ', phone2 TEXT NOT NULL'
    + ', email TEXT NOT NULL'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS records ('
    + 'txid TEXT PRIMARY KEY NOT NULL'
    + ', date TEXT NOT NULL'
    + ', data TEXT NOT NULL'
    + ', name TEXT NOT NULL'
    + ', hospitalID TEXT NOT NULL'
    + ', licenseNumber TEXT NOT NULL'
    + ', randomKey TEXT NOT NULL'
    + ', sharedTo TEXT'
    + ', expiration TEXT'
    + ', providerAddress TEXT NOT NULL'
    + ', providerPhone1 TEXT NOT NULL'
    + ', providerPhone2 TEXT NOT NULL'
    + ', providerEmail TEXT NOT NULL'
    + ', CONSTRAINT unique_txid UNIQUE (txid)'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS rawRecords ('
    + 'ariaID TEXT PRIMARY KEY NOT NULL'
    + ', raw TEXT NOT NULL'
    + ', CONSTRAINT unique_txid UNIQUE (ariaID)'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS doctors ('
    + 'ariaID TEXT PRIMARY KEY NOT NULL'
    + ', publicKey TEXT NOT NULL'
    + ', CONSTRAINT unique_txid UNIQUE (ariaID)'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS favoriteDoctor ('
    + 'ariaID TEXT PRIMARY KEY NOT NULL'
    + ', CONSTRAINT unique_txid UNIQUE (ariaID)'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS restore ('
    + 'issueID TEXT PRIMARY KEY NOT NULL'
    + ', seedPhrase TEXT'
    + ', email TEXT'
    + ', phone TEXT'
    + ', otp TEXT'
    + ', passcode TEXT'
    + ', CONSTRAINT unique_txid UNIQUE (issueID)'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS issues ('
    + 'ariaID TEXT PRIMARY KEY NOT NULL'
    + ', issueID TEXT NOT NULL'
    + ', newInfo TEXT NOT NULL'
    + ');'
  )

  doDBTransactionTo(DbToUse,
    'CREATE TABLE IF NOT EXISTS notifications ('
    + 'txid TEXT NOT NULL'
    + ', ariaID TEXT NOT NULL'
    + ', header TEXT NOT NULL'
    + ', message TEXT NOT NULL'
    + ', date TEXT NOT NULL'
    + ');'
  )

  // doDBTransactionTo(_LOCALPTDB,
  //   'PRAGMA table_info(users)'
  //   + ';', [], consoleLogResult
  // )

  doDBTransactionTo(DbToUse,
    'SELECT * FROM users'
    + ';', [], consoleLogResultWithBoundPrefix.bind({
      boundPrefix: 'Users:'
    })
  )
}

function doDBTransactionTo(
  dbTransactor: DBTransactor,
  sqlStatement: string,
  sqlArguments: any[] = [],
  executeSqlSuccessFunction?: any,
  executeSqlErrorFunction?: any /*(tx, errorDescription) => void*/
): void {
  // console.log('Transaction: ' + sqlStatement)

  if (!executeSqlErrorFunction)
    executeSqlErrorFunction = ExecSqlErrorHandler

  if (!executeSqlSuccessFunction)
    executeSqlSuccessFunction = ExecSqlSuccessHandler

  dbTransactor.transaction(
    txExecuteSqlWithBoundArgs.bind(
      {
        boundSqlStatement: sqlStatement,
        boundSqlArguments: sqlArguments,
        boundExecuteSqlSuccessFunction: executeSqlSuccessFunction,
        boundExecuteSqlErrorFunction: executeSqlErrorFunction
      }
    ),
    DbTxnErrorHandler,
    DbTxnSuccessHandler
    // successHandler is optional as it's called without parameters by sqlite
  )
}

function txExecuteSqlWithBoundArgs(tx: any): void {
  tx.executeSql(
    this.boundSqlStatement,
    this.boundSqlArguments,
    this.boundExecuteSqlSuccessFunction,
    this.boundExecuteSqlErrorFunction
  )
}

function consoleLogResultWithBoundPrefix(
  tx: any,
  result: { rows: any /*WebSQLRows*/ }
): void {
  const rows = result.rows._array
  devConsoleLog(this.boundPrefix, rows)
}