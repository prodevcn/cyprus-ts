import CoreResultObject, { AriaCore, CRO, CoreResult } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { RecordDetails, UserProfile } from '../types'
import CryptoJS from 'crypto-js'
import { eciesDecrypt, eciesEncrypt, signRawTransaction } from '../ur3/signtxbundled'
import { findSubstringInArray, convertLocalStringToHL7Date, devConsoleLog, parseStringUntilObj } from '../ur3/utilities'
import CleanHl7 from '../ur3/declutter'
import { EmrDetails } from '../accessors/AriaAPIAccessor'
import { AriaKeyStringStorage } from '../ur3/localdb'

export default class PtRecordsCore extends AriaCore {

  private _ptRecords: RecordDetails[] = []
  private _profile: UserProfile
  private _itemsProcessedCount: number = 0
  private items = []
  private _fetched
  private _alreadyFetchedRecords: number = 0
  private _totalNumberOfRecords: number = 0

  public isStillProcessing(): boolean {
    return this._itemsProcessedCount < this.items.length
  }

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this.getUserProfile()
  }

  public getPtLatestRecords(): RecordDetails[] {
    return this._ptRecords
  }

  public canloadMore(): boolean {
    return this._alreadyFetchedRecords < this._totalNumberOfRecords
  }

  public totalNumberOfRecords(): number {
    return this._ptRecords.length
  }

  public getRawRecords(): any {
    if (this._fetched) return this._fetched
    return []
  }

  public async loadARecord(recordTxid: string): Promise<any> {
    return await this._APIAccessor.loadARecord(recordTxid)
  }

  public async getUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }

  public async fetchRecord(): Promise<any> {
    const profile = await this.getUserProfile()
    let raw = this._fetched
    const isConnected = await AriaKeyStringStorage.getItem('isConnected')

    if (this._alreadyFetchedRecords < this._totalNumberOfRecords || this._totalNumberOfRecords === 0) {

      if (this._fetched === undefined && isConnected !== 'true') {
        const records = await this._LocalDBAccessor.getPtRawRecords(profile.ariaID)
        if (records && records.raw && typeof records.raw === 'string') raw = JSON.parse(records.raw)
      } else if (isConnected === 'true') {
        raw = await this._APIAccessor.getPtLatestRecordsAsync(profile.ariaID, this._alreadyFetchedRecords)
      }


      if (typeof raw === 'string') raw = parseStringUntilObj(raw)
      if (raw.message && raw.message.toLowerCase().includes('authentication error')) {
        return CRO(CoreResult.AUTHENTICATION_ERROR, { message: raw.message })
      }
      else {
        if (this._fetched) {
          let existing = this._fetched
          const newArr = existing.concat(raw.records)
          this._fetched = newArr
        } else this._fetched = raw.records

        this._alreadyFetchedRecords = this._alreadyFetchedRecords + raw.length
        this._totalNumberOfRecords = raw.total

        if (isConnected === 'true' && raw.records && raw.records.length > 0)
          await this._LocalDBAccessor.storePtRawRecords(profile.ariaID, JSON.stringify(raw))

        return CRO(CoreResult.OK)
      }
    }
    return CRO()
  }

  public async _loadPtLatestRecords(): Promise<boolean> {
    const profile = await this.getUserProfile()
    await this.parseNewRecords(
      profile,
      this._fetched
    )
    return true
  }

  public _loadDemoRecords(): RecordDetails[] {
    const hl7Date = convertLocalStringToHL7Date()
    const parsedRecords = []

    const item = {
      txid: 'bdece159bd1339c59a257432fc7a33008504d6090bfbf62ef784c14e650demo01',
      data: '{\"observations\":[{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"PNLB00015\",\"label\":\"CBC DIFFERENTIAL\"}},\"obx\":[{\"abnormalFlags\":\"A\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"WBC\",\"value\":\"11.2\",\"range\":\"4 - 11\",\"units\":\"x10\\\\S\\\\3/µL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"RBC\",\"value\":\"4.9\",\"range\":\"4.5 - 6.5\",\"units\":\"x10\\\\S\\\\6/µL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"HGB\",\"value\":\"13.8\",\"range\":\"13.0 - 18.0\",\"units\":\"g/dL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"HCT\",\"value\":\"41.4\",\"range\":\"40.0 - 45.0\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MCV\",\"value\":\"85.0\",\"range\":\"80.0 - 94.0\",\"units\":\"fL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MCH\",\"value\":\"28.3\",\"range\":\"27.0 - 31.0\",\"units\":\"pg\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MCHC\",\"value\":\"33.3\",\"range\":\"30.0 - 35.0\",\"units\":\"g/dL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"RDW\",\"value\":\"11.8\",\"range\":\"11.5 - 14.5\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Platelets \",\"value\":\"159\",\"range\":\"150 - 400\",\"units\":\"x10\\\\S\\\\3/µL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MPV\",\"value\":\"8.6\",\"range\":\"7.2 - 11.1\",\"units\":\"fL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"A\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Neutrophils %\",\"value\":\"69\",\"range\":\"40.0 - 65.0\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"A\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"lymphocytes %\",\"value\":\"17\",\"range\":\"25.0 - 40.0\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"PNLB00015\",\"label\":\"CBC DIFFERENTIAL\"}},\"obx\":[{\"abnormalFlags\":\"A\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"WBC\",\"value\":\"11.2\",\"range\":\"4 - 11\",\"units\":\"x10\\\\S\\\\3/µL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"RBC\",\"value\":\"4.9\",\"range\":\"4.5 - 6.5\",\"units\":\"x10\\\\S\\\\6/µL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"HGB\",\"value\":\"13.8\",\"range\":\"13.0 - 18.0\",\"units\":\"g/dL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"HCT\",\"value\":\"41.4\",\"range\":\"40.0 - 45.0\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MCV\",\"value\":\"85.0\",\"range\":\"80.0 - 94.0\",\"units\":\"fL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MCH\",\"value\":\"28.3\",\"range\":\"27.0 - 31.0\",\"units\":\"pg\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MCHC\",\"value\":\"33.3\",\"range\":\"30.0 - 35.0\",\"units\":\"g/dL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"RDW\",\"value\":\"11.8\",\"range\":\"11.5 - 14.5\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Platelets \",\"value\":\"159\",\"range\":\"150 - 400\",\"units\":\"x10\\\\S\\\\3/µL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"MPV\",\"value\":\"8.6\",\"range\":\"7.2 - 11.1\",\"units\":\"fL\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"A\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Neutrophils %\",\"value\":\"69\",\"range\":\"40.0 - 65.0\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"A\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"lymphocytes %\",\"value\":\"17\",\"range\":\"25.0 - 40.0\",\"units\":\"%\",\"type\":\"NM\",\"displayKey\":\"value\"}]}]}',
      date: new Date(),
      licenseNumber: '123-45-678',
      name: 'Your Medical Centre',
      hospitalID: '12ABCD',
      randomKey: '7b3b0a7da6767166e154cf42b1e3beca6d75fca64394a5a767be3cda89demo01',
      sharedTo: '[]',
      expiration: '{}',
      providerAddress: 'XX Makariou Iii Ave, Phytide',
      providerPhone1: '+3579xxxxxx',
      providerEmail: 'medical@gmail.com',
      keys: null
    }

    const item2 = {
      txid: 'bdece159bd1339c59a257432fc7a33008504d6090bfbf62ef784c14e650demo03',
      data: '{\"observations\":[{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"11\",\"label\":\"Chemistry Tests\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observationIdentifier\":\"Urea, serum level\",\"value\":\"34\",\"range\":\"< 71\",\"type\":\"NM\",\"displayKey\":\"invalid\"},{\"abnormalFlags\":\"N\",\"observationIdentifier\":\"Creatinine, serum level\",\"value\":\"1\",\"range\":\"0.67 - 1.17\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observationIdentifier\":\"Uric acid, serum level\",\"value\":\"4\",\"range\":\"3.4 - 7\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"A\",\"observationIdentifier\":\"Calcium, serum level\",\"value\":\"7\",\"range\":\"8.6 - 10.2\",\"type\":\"NM\",\"displayKey\":\"value\"},{\"abnormalFlags\":\"N\",\"observationIdentifier\":\"Triglycerides, serum level\",\"value\":\"150\",\"range\":\"< 200\",\"type\":\"NM\",\"displayKey\":\"invalid\"}]}]}',
      date: new Date(),
      licenseNumber: '123-45-678',
      name: 'Your Medical Centre',
      hospitalID: '14ABCD',
      randomKey: '7b3b0a7da6767166e154cf42b1e3beca6d75fca64394a5a767be3cda89demo03',
      sharedTo: '[]',
      expiration: '{}',
      providerAddress: 'XX Makariou Iii Ave, Phytide',
      providerPhone1: '+3579xxxxxx',
      providerEmail: 'medical@gmail.com',
      keys: null
    }

    const item3 = {
      txid: 'bdece159bd1339c59a257432fc7a33008504d6090bfbf62ef784c14e650demo02',
      data: '{\"observations\":[{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00029\",\"label\":\"Bilirubin Direct\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Bilirubin Direct\",\"value\":\"0.4\",\"range\":\"0.1 - 0.5\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00028\",\"label\":\"Bilirubin Total\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Bilirubin Total\",\"value\":\"1.0\",\"range\":\"0.2 - 1.2\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00093\",\"label\":\"Fasting Blood Glucose (FBS), serum level\"}},\"obx\":[{\"abnormalFlags\":\"A\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Fasting Blood Glucose (FBS), serum level\",\"value\":\"113\",\"range\":\"70 -105\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00188\",\"label\":\"Sodium, serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Sodium, serum level\",\"value\":\"139\",\"range\":\"136 - 145\",\"units\":\"mmol/L\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00163\",\"label\":\"Potassium, serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Potassium, serum level\",\"value\":\"4.3\",\"range\":\"3.5 - 5.1\",\"units\":\"mmol/L\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00047\",\"label\":\"Chloride, serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Chloride, serum level\",\"value\":\"107\",\"range\":\"98 - 107\",\"units\":\"mmol/L\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00129\",\"label\":\"Magnesium , serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Magnesium , serum level\",\"value\":\"1.9\",\"range\":\"1.7 - 2.6\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00211\",\"label\":\"Urea, serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Urea, serum level\",\"value\":\"13.4\",\"range\":\"8.9 - 20.6\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00063\",\"label\":\"Creatinine, serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Creatinine, serum level\",\"value\":\"0.9\",\"range\":\"0.72 - 1.25\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00215\",\"label\":\"Uric acid, serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Uric acid, serum level\",\"value\":\"6.2\",\"range\":\"3.5 - 7.2\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]},{\"obr\":{\"endDate\":{\"value\":\"' + hl7Date + '\",\"label\":\"Observation End Date Time\",\"type\":\"date\"},\"universalServiceIdentifier\":{\"id\":\"CXLB00033\",\"label\":\"Calcium, serum level\"}},\"obx\":[{\"abnormalFlags\":\"N\",\"observResultStatus\":\"F\",\"observationIdentifier\":\"Calcium, serum level\",\"value\":\"9.8\",\"range\":\"8.4 - 10.2\",\"units\":\"mg/dL\",\"type\":\"NM\",\"displayKey\":\"value\"}]}]}',
      date: new Date(),
      licenseNumber: '123-45-678',
      name: 'Your Medical Centre',
      hospitalID: '13ABCD',
      randomKey: '7b3b0a7da6767166e154cf42b1e3beca6d75fca64394a5a767be3cda89demo02',
      sharedTo: '[]',
      expiration: '{}',
      providerAddress: 'XX Makariou Iii Ave, Phytide',
      providerPhone1: '+3579xxxxxx',
      providerEmail: 'medical@gmail.com',
      keys: null
    }


    parsedRecords.unshift(item)
    parsedRecords.unshift(item2)
    parsedRecords.unshift(item3)

    return parsedRecords
  }

  public async parseNewRecords(profile: UserProfile, records: any): Promise<any> {
    this._itemsProcessedCount = 0
    const parsedRecords = []

    if (records) {
      this.items = records

      this.items.forEach((item): void => {
        if (!item.keys.includes('root')) {
          var index = this.items.indexOf(item)
          if (index !== -1) this.items.splice(index, 1)
        }
      })

      for (let i = 0; i < this.items.length; ++i) {
        const rawItem = this.items[i]
        const info = await this._parseIndividualRecord(rawItem, profile)
        if (info != null) {
          parsedRecords.unshift(info)
          this._itemsProcessedCount++
        }
      }
      this._ptRecords = parsedRecords
    }
    return parsedRecords
  }

  public async getIndividualRecord(rawItem: any): Promise<any> {
    const profile = await this.getUserProfile()
    return this._parseIndividualRecord(rawItem, profile)
  }


  private async _parseIndividualRecord(rawItem: any, profile: UserProfile): Promise<any> {
    const item = {
      txid: '',
      data: null,
      date: '',
      licenseNumber: '',
      name: '',
      hospitalID: '',
      randomKey: '',
      sharedTo: '',
      expiration: '',
      providerAddress: '',
      providerPhone1: '',
      providerPhone2: '',
      providerEmail: '',
      keys: null
    }

    const cachedRecord = await this._LocalDBAccessor.getRecordInCache(rawItem.txid)
    if (cachedRecord !== null) {
      if (rawItem.blocktime)
        cachedRecord.date = new Date(rawItem.blocktime * 1000).toString()
      const sharedTo = await this._listRecordAccesskeys(cachedRecord.txid)
      cachedRecord.sharedTo = JSON.stringify(sharedTo[0])
      cachedRecord.expiration = JSON.stringify(sharedTo[1])

      return cachedRecord
    }
    else {
      item.txid = rawItem.txid
      item.keys = rawItem.keys

      if (!rawItem.keys.includes('root')) {
        this._itemsProcessedCount++; return null
      }

      const recordDataAndRKey = await this.getRecord(profile, rawItem.txid)
      item.data = recordDataAndRKey !== null ? JSON.stringify(recordDataAndRKey[0]) : ''

      item.randomKey = recordDataAndRKey[1]

      const newDate = new Date(rawItem.blocktime * 1000)
      if (rawItem.blocktime && newDate)
        item.date = newDate.toString()


      const hospitalID = findSubstringInArray('hospitalId', rawItem.keys)

      if (hospitalID) {
        item.hospitalID = hospitalID
        const providerInfo = await this._LocalDBAccessor.getProviderInfoInCache(hospitalID)
        if (providerInfo !== null) {
          item.licenseNumber = providerInfo.licensenumber
          item.name = providerInfo.name
          item.providerAddress = providerInfo.address
          item.providerPhone1 = providerInfo.phone1
          item.providerPhone2 = providerInfo.phone2
          item.providerEmail = providerInfo.email
        }
        else {
          const info = await this._APIAccessor.getProviderInfo(hospitalID) //TODO check if NOK

          if (info !== null) {
            await this._LocalDBAccessor.storeProviderInfo(
              hospitalID,
              info.licenseNumber,
              info.name,
              info.address,
              info.phone1,
              info.phone2,
              info.email.value
            )

            item.licenseNumber = info.licenseNumber
            item.name = info.name
            item.providerAddress = info.address
            item.providerPhone1 = info.phone1
            item.providerPhone2 = info.phone2
            item.providerEmail = info.email.value
          }
        }
      }

      const sharedTo = await this._listRecordAccesskeys(item.txid)
      item.sharedTo = JSON.stringify(sharedTo[0])
      item.expiration = JSON.stringify(sharedTo[1])

      if (item !== null) await this._LocalDBAccessor.storeRecordInCache(item)
      return item
    }
  }

  public async getRecord(profile: UserProfile, txid: string): Promise<[EmrDetails, string]> {
    if (profile.ariaID) {
      const item = await this._APIAccessor.getRecord(profile.ariaID, txid)
      
      if (item) {
        const { accesskey, recordItemData } = item.record
        if (profile.cryptoKeys.privateKey) {
          const rKey = eciesDecrypt(profile.cryptoKeys.privateKey, accesskey)
          
          if (recordItemData.invalid !== undefined && recordItemData.invalid !== null && recordItemData.invalid === true)
          return [null, rKey]
          
          const bytes = CryptoJS.AES.decrypt(recordItemData.emr, rKey)
          const data = bytes.toString(CryptoJS.enc.Utf8)
          const decluttered = new CleanHl7(JSON.parse(data))
          return [decluttered.data, rKey]
        }
      }
    }
    return [null, '']
  }

  public async shareRecord(shareTo: string, rKey: string, recordTxid: string, withNotif?: boolean): Promise<{ txid?: string; message?: string }> {
    const isDoctorPubKeyAlreadyInCache = await this._LocalDBAccessor.getDoctorInfoInCache(shareTo)

    let info
    if (isDoctorPubKeyAlreadyInCache === null) {
      info = await this._APIAccessor.getDoctorPublicKey(shareTo)
      if (info && info.publicKey)
        await this._LocalDBAccessor.storeDoctorInfo(shareTo, info.publicKey)
      else return JSON.parse(info)
    }
    else info = isDoctorPubKeyAlreadyInCache

    const accesskey = eciesEncrypt(info.publicKey, rKey)
    const sendPushNotif = withNotif !== undefined && withNotif !== null ? withNotif : true
    const toSign = await this._APIAccessor.shareRecord(
      shareTo,
      {
        recordTxid,
        accesskey
      },
      sendPushNotif)

    let sharedRecord = null
    if (toSign && toSign.decoded) {
      sharedRecord = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, this._profile.cryptoKeys.privateKey)
      )
    }

    return sharedRecord
  }

  public async _listRecordAccesskeys(txid: string): Promise<[string[], {}]> {
    const accessKeys = await this._APIAccessor.listrecordaccesskeys(txid)

    let arrayOfAriaIDSharedTo = []
    let values = {}
    if (accessKeys && accessKeys.accesskeys) {
      const array = accessKeys.accesskeys
      for (let i = 0; i < array.length; ++i) {
        const ariaID = array[i].ariaID

        if (array[i].data.expiration !== undefined) values[ariaID] = array[i].data.expiration
        if (array[i].data.expiration === 0) continue

        arrayOfAriaIDSharedTo.push(ariaID)
      }
    }

    return [arrayOfAriaIDSharedTo, values]
  }

  public async listAccesskeys(docAriaID: string): Promise<any> {
    return await this._APIAccessor.listAccesskeys(docAriaID)
  }

  public async updateRecordAccesskeys(txid: string): Promise<RecordDetails> {
    const accessKeys = await this._listRecordAccesskeys(txid)
    await this._LocalDBAccessor.updateSharedRecordTo(txid, JSON.stringify(accessKeys))
    return await this._LocalDBAccessor.getRecordInCache(txid)
  }

  public async shareFutureRecords(ariaID: string): Promise<any> {
    const profile = await this.getUserProfile()
    const toSign = await this._APIAccessor.grantFutureAccess(ariaID)

    let granted = null
    if (toSign && toSign.decoded) {
      granted = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )
    }

    return granted
  }

  public async revokeDoctorAccess(ariaID: string, recordTxid: string): Promise<CoreResultObject> {
    const profile = await this.getUserProfile()

    const shareItem = { recordTxid }
    const toSign = await this._APIAccessor.revokeDoctorAccess(ariaID, shareItem)

    let revokedRecord = null
    if (toSign && toSign.decoded) {
      revokedRecord = await this._APIAccessor.sendSignedTxAsync(
        signRawTransaction(toSign.decoded, profile.cryptoKeys.privateKey)
      )
    }

    return revokedRecord
  }

  public async refreshToken(): Promise<void> {
    const profile = await this.getUserProfile()
    await this._APIAccessor.fetchPtProfile(profile.ariaID)
  }

}