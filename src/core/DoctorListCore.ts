// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
import CoreResultObject, { AriaCore, CRO, CoreResult } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { DoctorDetails } from '../accessors/AriaAPIAccessor'
import _ from 'lodash'

export default class DoctorListCore extends AriaCore {

  private _doctors: DoctorDetails[] = []
  private _itemsProcessedCount: number = 0
  private _totalDoctors: number = 0
  private _totalFetchedDoctors: number = 0

  public isStillProcessing(): boolean {
    return this._itemsProcessedCount < this._totalFetchedDoctors
  }

  public resetTotalFetched(): boolean {
    this._totalFetchedDoctors = 0
    return true
  }

  public canloadMore(): boolean {
    return this._totalFetchedDoctors < this._totalDoctors
  }

  public _loadDemoDoctors(): DoctorDetails[] {
    const parsedDoctors = []

    const doctor1 = {
      ariaID: 'a12bc34',
      dateOfBirth: '1990-01-17',
      email: {
        value: 'demo.account@gmail.com',
        verified: true
      },
      firstName: 'Demo',
      fullName: 'Demo doctor',
      gender: 'male',
      institution: 'Hospital',
      licenseNumber: '123ABC',
      phone: {
        value: '639562662586',
        verified: true
      },
      specialisation: 'Surgeon',
      specialization: 'Surgeon',
      shareContactDetails: true,
      surname: 'Flores',
      title: 'Dr.',
      photo: ''
    }

    const doctor2 = {
      ariaID: 'a12bc56',
      dateOfBirth: '1990-01-17',
      email: {
        value: 'demo.account@gmail.com',
        verified: true
      },
      firstName: 'Demo',
      fullName: 'Demo doctor',
      gender: 'male',
      institution: 'Hospital',
      licenseNumber: '456ABC',
      phone: {
        value: '639562662586',
        verified: true
      },
      specialisation: 'Surgeon',
      specialization: 'Surgeon',
      shareContactDetails: true,
      surname: 'Smith',
      title: 'Mrs.',
      photo: ''
    }

    parsedDoctors.unshift(doctor1)
    parsedDoctors.unshift(doctor2)

    return parsedDoctors
  }

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)
  }

  public getDoctorsList(): DoctorDetails[] {
    return this._doctors
  }

  public async _checkIfAlreadyRegistered(doctors: DoctorDetails[]): Promise<void> {
    const publicKeys = []

    for (let j = 0; j < doctors.length; j++) {
      publicKeys.push(this._APIAccessor.getDoctorPublicKey(doctors[j].ariaID))
      this._itemsProcessedCount++
    }
    let result = await Promise.all(publicKeys)

    for (let i = 0; i < result.length; i++)
      if (result[i].publicKey) this._doctors.push(doctors[i])

    this._doctors = _.uniqBy(this._doctors, 'ariaID')

    if (this._doctors.length < 5) await this._loadDoctorsListAsync()
  }

  public async _refreshDoctor(): Promise<CoreResultObject> {
    this._totalFetchedDoctors = 0
    this._totalDoctors = 0
    return await this._loadDoctorsListAsync()
  }

  public async _loadDoctorsListAsync(): Promise<CoreResultObject> {
    if (this._totalFetchedDoctors < this._totalDoctors || this._totalFetchedDoctors === 0) {

      let apiResponse = await this._APIAccessor.getDoctorsListAsync(this._totalFetchedDoctors, 10)

      if (typeof apiResponse === 'string') apiResponse = JSON.parse(apiResponse)

      if (apiResponse.list) {
        this._totalFetchedDoctors = this._totalFetchedDoctors + apiResponse.list.length

        this._totalDoctors = apiResponse.total
        await this._checkIfAlreadyRegistered(apiResponse.list)
        return CRO(CoreResult.OK)
      } else if (apiResponse.message) {
        if (apiResponse.message.toLocaleLowerCase().includes('authentication error')) {
          return CRO(CoreResult.AUTHENTICATION_ERROR)
        }
        return CRO(CoreResult.NOK, { message: apiResponse.message })
      }
    }
  }

  public async addFavorite(ariaID: string): Promise<void> {
    const resp = await this._APIAccessor.fetchFavDoctors()
    const favoriteDoctors = resp.favoriteDoctors
    favoriteDoctors.push(ariaID)
    const info = { favoriteDoctors }
    await this._APIAccessor.sendupdatedDataToAPIAsync(info)
  }

  public async removeFavorite(ariaID: string): Promise<void> {
    const resp = await this._APIAccessor.fetchFavDoctors()
    const favoriteDoctors = resp.favoriteDoctors
    const index = favoriteDoctors.indexOf(ariaID)

    if (index !== -1) favoriteDoctors.splice(index, 1)
    const info = { favoriteDoctors }
    await this._APIAccessor.sendupdatedDataToAPIAsync(info)
  }

  public async getAllFavoriteDoctors(): Promise<any> {
    const resp = await this._APIAccessor.fetchFavDoctors()
    if (resp.favoriteDoctors) return resp.favoriteDoctors
    else return []
  }

  public async listRecordAccesskeys(txid: string): Promise<any> {
    const accessKeys = await this._APIAccessor.listrecordaccesskeys(txid)

    let arrayOfAriaIDSharedTo = []
    if (accessKeys && accessKeys.accesskeys) {
      const array = accessKeys.accesskeys
      for (let i = 0; i < array.length; ++i) {
        const ariaID = array[i].ariaID

        if (array && array[i].data && array[i].data.expiration === 0) continue
        else arrayOfAriaIDSharedTo.push(ariaID)
      }
    }

    return arrayOfAriaIDSharedTo

  }

}