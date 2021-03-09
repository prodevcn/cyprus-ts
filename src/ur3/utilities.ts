// TODO determine proper types instead of any
/* eslint-disable @typescript-eslint/no-explicit-any */
declare var Promise: any
declare var setTimeout: any
import terms from '../locales/terms'
export async function sleep(
  timeInMs: number
): Promise<any> {
  return new Promise((resolve): void => {
    setTimeout(resolve, timeInMs)
  })
}

import { __LOG__, __IS_PATIENT_APP__ } from '../../env'
import { Country, getAllCountries } from 'react-native-country-picker-modal'
export function devConsoleLog(...args: any[]): void {
  if (__LOG__) {
    const n = new Date()
    // eslint-disable-next-line no-console
    console.log(n.toTimeString().substring(0, 8) + '.' + n.getMilliseconds(),
      ...args)
  }
}

export function lowerCaseAndCapitalizeFirst(text: string): string {
  const lower = text.toLocaleLowerCase()
  return lower.charAt(0).toUpperCase() + lower.substring(1)
}

export function splitAriaIDWithDash(ariaID: string): string {
  if (ariaID) {
    let ariaIDArray = ariaID.split('')
    ariaIDArray.splice(2, 0, '-')
    ariaIDArray.splice(6, 0, '-')
    ariaID = ariaIDArray.join('')

    return ariaID
  } else return ''
}

export function removeNonPhoneNumberCharacters(phone: string): string {
  const edited = phone.replace(/[^0-9+]/g, '')
  return edited
}

export function findAcronymOfMedLabel(label: string): string {
  for (const key in terms) {
    if (terms[key] && label) {
      if (terms[key].toUpperCase().trim() === label.toUpperCase().trim()) return key
    }
  }

  return null
}

export function parseStringUntilObj(raw: string): any {
  do {
    raw = JSON.parse(raw)
  } while (typeof raw === 'string')

  return raw
}

export function convertHL7ToLocalStringDate(hl7Date: string): string {
  var utcDate = new Date()
  if (hl7Date) {
    utcDate.setFullYear(parseInt(hl7Date.substring(0, 4)), parseInt(hl7Date.substring(4, 6)) - 1, parseInt(hl7Date.substring(6, 8)))
    return toLocalDateString(utcDate)
  } return ''
}

export function convertLocalStringToHL7Date(date?: any): string {
  let newDate = date ? typeof date === 'string' ? new Date(date) : date : new Date()

  const year = newDate.getFullYear().toString(),
    month = newDate.getMonth() + 1,
    day = newDate.getDate(),
    hour = newDate.getHours().toString(),
    seconds = newDate.getMilliseconds().toString()

  const monthS = month < 10 ? '0' + month.toString() : month.toString()
  const dayS = day < 10 ? '0' + day.toString() : day.toString()
  const hl7Date = year + monthS + dayS + hour + (seconds.length < 4 ? seconds + '0000' : seconds)

  return hl7Date.substring(0, 13)
}


export function removeSpecialCharacters(phone: string, withSpace?: boolean): string {
  let edited = phone

  if (withSpace) edited = phone.replace(/[^a-zA-Z0-9 ]/g, '')
  else edited = phone.replace(/[^a-zA-Z0-9]/g, '')

  return edited
}

export function toLocalDateString(dt: string | Date): string {
  let date = new Date()

  if (dt !== '') date = new Date(dt)
  return monthName(date.getMonth()) + ' ' + localNth(date.getDate()) + ' ' + date.getFullYear()
}

export function getAge(DOB: string, rawAge?: boolean): string {
  var today = new Date();
  var birthDate = new Date(DOB);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age = age - 1;
  }

  if (rawAge) return age + ''

  if (age < 2) return age + ' year old'
  return age + ' years old'
}

export function makeJsonUserReadable(values: any): string {
  let list = ''
  for (const key in values)
    list = list + key + values[key] + '\n'

  return list
}

export function formatDate(date: string): string {
  const fullYear = new Date(date).getFullYear()
  if (date) {
    const dateArray = date.split('/')
    const editedDate = dateArray[1] + ' / ' + dateArray[0] + ' / '
      + (fullYear ? fullYear : dateArray[2])

    return editedDate
  }
  return ''
}

export function formatDateString(date: string): string {
  if (date) {
    const dateArray = date.split('-')
    const editedDate = dateArray[2] + ' / ' + dateArray[1] + ' / ' + dateArray[0]
    return editedDate
  }
  return ''
}

export function reverseFormatDateString(string: string): string {
  if (string) {
    const date = string.replace(/\s/g, '')
    const dateArray = date.split('/')
    const editedDate = dateArray[2] + '-' + dateArray[1] + '-' + dateArray[0]
    return editedDate
  }
  return ''
}


export function formatDateWithName(date: string, newDate: Date): string {
  if (date) {
    let year = newDate.getFullYear()
    const dateArray = date.split('/')
    const editedDate = monthName(parseInt(dateArray[0]) - 1) + ' ' + parseInt(dateArray[1]) + ' ' + year

    return editedDate
  }
  return ''
}

export function formatTime(time: string, date?: Date): string {
  if (time) {
    const timeArray = time.split(':')

    let ampm = ''
    if (!time.toLocaleLowerCase().includes('pm') && !time.toLocaleLowerCase().includes('am')) {
      var hours = date ? date.getHours() : 0

      ampm = hours >= 12 ? 'PM' : 'AM';
    } else if (time.toLocaleLowerCase().includes('pm')) ampm = 'PM'
    else ampm = 'AM'

    ampm = __IS_PATIENT_APP__ ? ampm.toLocaleLowerCase() : ampm

    let hour = parseInt(timeArray[0])
    if (hour > 12) hour = hour - 12
    const editedTime = hour + ':' + timeArray[1] + ' ' + (date ? ampm ? ampm : '' : '')

    return editedTime
  }
  return ''
}

export function setDateFormat(initialDate: string): string {
  if (!initialDate.includes('-')) return initialDate

  const array = initialDate.split('-')
  const date = array[0]
  const time = array[1]
  const hour = parseInt(array[2]) >= 12 ? 'PM' : 'AM';

  const editedDate = formatDate(date)
  const editedTime = formatTime(time)


  return editedDate + ' ' + editedTime + hour
}

export function toDateString(dt: string | Date): string {
  let date = new Date()

  if (dt !== '') date = new Date(dt)
  return monthName(date.getMonth()) + ' ' + nth(date.getDate()) + ' ' + date.getFullYear()
}

export function toTimeString(dt: Date): string {
  return dt.toISOString().slice(11, 19) // HH:mm:ss
}

export function localNth(n: number): string { return [n + 'st', n + 'nd', n + 'rd'][((n + 90) % 100 - 10) % 10 - 1] || n + 'th' }

export function nth(n: number): string { return [n + 'st', n + 'nd', n + 'rd'][((n + 90) % 100 - 10) % 10 - 1] || n - 1 + 'th' }

export function monthName(i: number): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return monthNames[i]
}

export function isEmpty(obj): boolean {
  for (var key in obj) {
    if (obj[key] !== null || obj[key] !== undefined)
      return false
  }
  return true
}

export function findSubstringInArray(subString: string, keys: []): string {
  for (let i = 0; i < keys.length; ++i) {
    let key: string = keys[i]
    let value = null

    let keyValue = key.split('[')
    if (keyValue[0] === subString) {
      if (keyValue[1])
        value = keyValue[1].substring(0, (keyValue[1].length - 1))
    }
    return value
  }
}

export function calculateAge(birthday: Date): number { // birthday is a date
  var ageDifMs = Date.now() - birthday.getTime()
  var ageDate = new Date(ageDifMs) // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export function splitStringToArray(string: string, separator: string): string[] {
  return string.split(separator)
}

export function setUpPhoneNumberCallingCode(
  cca2: string,
  code: string,
  phone: string,
  initialValue: string): { numeric: string; callingCode: string; cca2Code: string } {

  let phoneNumber = phone
  if (phone === '') phoneNumber = initialValue

  if (phoneNumber && phoneNumber.startsWith('+')) {
    let numeric = removeSpecialCharacters(phoneNumber)
    let callingCode = code
    let cca2Code = cca2


    if (numeric.startsWith('63')) {
      numeric = numeric.slice(2)
      callingCode = '63'
      cca2Code = 'PH'
    }
    else if (numeric.startsWith('357')) {
      numeric = numeric.slice(3)
      callingCode = '357'
      cca2Code = 'CY'
    }
    else {
      const allCountries = getAllCountries()
      allCountries.forEach(
        (country: Country): void => {
          if (numeric.startsWith(country.callingCode)) {
            numeric = numeric.slice(code.length)
            callingCode = country.callingCode
            cca2Code = country.cca2
          }
        }
      )
    }
    return { numeric, callingCode, cca2Code }
  }
}