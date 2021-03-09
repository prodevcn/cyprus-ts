interface TranslatableResult {
  tKey: string;
  tOptions?: Record<string, string>;
}

export type ValidationResult = { isValid: true } | { isValid: false; errorResult: TranslatableResult }

export interface Validator {
  validate(input: string): ValidationResult;
}

export class RequiredFieldValidator implements Validator {
  private _fieldNameTKey = ''

  public constructor(fieldNameTKey: string) {
    if (fieldNameTKey) this._fieldNameTKey = fieldNameTKey
  }

  public validate(input: string): ValidationResult {
    if (!this._isValid(input)) {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisrequired',
          tOptions: { fieldNameTKey: this._fieldNameTKey },
        }
      }
    }

    return { isValid: true }
  }

  private _isValid(input: string): boolean {
    return input != null && input.length > 0
  }
}

export class RequiredDateValidator implements Validator {
  private _fieldNameTKey = ''
  private _shouldBePastDate
  private _shouldBe18YrsAgo

  public constructor(fieldNameTKey: string, shouldBePastDate = null, shouldBe18YrsAgo = null) {
    if (fieldNameTKey) this._fieldNameTKey = fieldNameTKey
    this._shouldBePastDate = shouldBePastDate
    this._shouldBe18YrsAgo = shouldBe18YrsAgo
  }

  public validate(input: string): ValidationResult {
    if (input == null || input === '') {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisrequired',
          tOptions: { fieldNameTKey: this._fieldNameTKey },
        }
      }
    }

    if (!this._isValid(input)) {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisinvalid',
          tOptions: { fieldNameTKey: this._fieldNameTKey },
        }
      }
    }

    return { isValid: true }
  }

  private _isValid(input: string): boolean {
    if (this._shouldBePastDate == null)
      return true

    const inputDate = new Date(input)
    const EighteenYrsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    const now = new Date()

    devConsoleLog('EighteenYrsAgo: ', EighteenYrsAgo)
    // // TODO check if present day selected is valid even with timezone
    // //  else parse into yyyymmdd
    // // const dateNowNumber = parseInt(''
    // //   + now.getFullYear()
    // //   + (now.getMonth() + 1).toString().padStart(2, '0')
    // //   + now.getDate())
    // // Moment is not used so that no library is imported

    if (this._shouldBePastDate) {
      if (this._shouldBe18YrsAgo)
        return EighteenYrsAgo > inputDate
      return now > inputDate
    }
    else
      return now <= inputDate
  }
}

export class EmailValidator implements Validator {
  private _fieldNameTKey = ''
  private _isOptional = false
  //eslint-disable-next-line no-useless-escape
  private _emailRegexUnicode = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  public constructor(fieldNameTKey: string, isOptional?: boolean) {
    if (fieldNameTKey) this._fieldNameTKey = fieldNameTKey
    if (isOptional) this._isOptional = isOptional
  }

  public validate(input: string): ValidationResult {
    if ((input === '' || input === undefined || input === null) && !this._isOptional) {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisrequired',
          tOptions: { fieldNameTKey: this._fieldNameTKey },
        }
      }
    }

    if (!this._isValid(input)) {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisinvalid',
          tOptions: { fieldNameTKey: this._fieldNameTKey }
        }
      }
    }

    return { isValid: true }
  }

  private _isValid(input: string): boolean {
    if ((input === '' || input === undefined || input === null) && this._isOptional) return true
    return input != null && this._emailRegexUnicode.test(input.toLowerCase())
  }
}

import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { devConsoleLog } from './utilities';

export class PhoneValidator implements Validator {
  private _fieldNameTKey = ''

  public constructor(fieldNameTKey: string) {
    if (fieldNameTKey) this._fieldNameTKey = fieldNameTKey
  }

  public validate(input: string): ValidationResult {
    if (input == null || input === '') {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisrequired',
          tOptions: { fieldNameTKey: this._fieldNameTKey },
        }
      }
    }

    if (!this._isValid(input)) {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisinvalid',
          tOptions: { fieldNameTKey: this._fieldNameTKey }
        }
      }
    }

    return { isValid: true }
  }

  private _isValid(input: string): boolean {

    let number = input
    if (!input.startsWith('0')) number = '+' + input

    let phoneNumber = parsePhoneNumberFromString(number, 'CY')
    if (phoneNumber && phoneNumber.isValid())
      return true

    phoneNumber = parsePhoneNumberFromString(number, 'PH')
    if (phoneNumber && phoneNumber.isValid())
      return true

    phoneNumber = parsePhoneNumberFromString(input)
    return phoneNumber != null && phoneNumber.isValid()
  }
}

export class NumberValidator implements Validator {
  private _fieldNameTKey = ''
  private _numberOnlyRegexUnicode = /^[0-9]+$/;

  public constructor(fieldNameTKey: string) {
    if (fieldNameTKey) this._fieldNameTKey = fieldNameTKey
  }

  public validate(input: string): ValidationResult {
    if (input == null || input === '') {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisrequired',
          tOptions: { fieldNameTKey: this._fieldNameTKey },
        }
      }
    }

    if (!this._isValid(input)) {
      return {
        isValid: false,
        errorResult:
        {
          tKey: 'inputerrors:fieldnameisinvalid',
          tOptions: { fieldNameTKey: this._fieldNameTKey }
        }
      }
    }

    return { isValid: true }
  }

  private _isValid(input: string): boolean {
    return input != null && this._numberOnlyRegexUnicode.test(input.toLowerCase())
  }
}