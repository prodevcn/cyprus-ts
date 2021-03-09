// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import { Alert } from 'react-native'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ExecSqlErrorHandler(
  transaction: any,
  errorDescriptionReadableNativeMap: {}
): void {
  logObjectIfNotEmpty('Exec Sql Error', errorDescriptionReadableNativeMap)
}

export function ExecSqlSuccessHandler(transaction: any, possibleData: {}): void {
  logObjectIfNotEmpty('Exec Sql Success', possibleData)
}

export function DbTxnErrorHandler(errorDescriptionReadableNativeMap: {}): void {
  consoleLog('Database Txn Error')
  logObjectIfNotEmpty('Database Error', errorDescriptionReadableNativeMap)
}

export function DbTxnSuccessHandler(possibleData: {}): void {
  logObjectIfNotEmpty('Database Txn Success', possibleData)
}

function alertAndLogObject(title: string, data: Record<string, any>): void {
  if (data && Object.keys(data).length !== 0) {
    consoleLog(' ')
    consoleLog('-------------------')
    const datastring = JSON.stringify(data)
    consoleLog(title + ': ' + datastring)
    Alert.alert(title, datastring)
  }
}

export function alert(title: string, description?: string): void {
  Alert.alert(title, description)
}

function logObjectIfNotEmpty(title: string, data: any): void {
  if (data && Object.keys(data).length !== 0) {
    const datastring = JSON.stringify(data)
    consoleLog(title + ': ' + datastring)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function consoleLog(message: string): void {
  // console.log(message) // comment this during unit testing if not needed
}