/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare var fetch: any

import { APIFetcher } from './BaseAccessor'
import { devConsoleLog, isEmpty } from '../ur3/utilities'
import { AriaKeyStringStorage } from '../ur3/localdb'

export default class AriaWebAPIFetcher implements APIFetcher {
  private _webAPIURL = 'http://aria.healthblocks.co/webapi/'
  // private _webAPIURL = 'http://18.139.37.78/webapi/'
  // private _webAPIURL = 'http://3.0.148.110/webapi/' //DEMO

  public constructor() {
    devConsoleLog('using WebAPI', this._webAPIURL)
  }

  public async post(apiPath: string, params: any): Promise<any> {
    // await sleep(500)
    devConsoleLog('[POST]', apiPath, params)

    // const loggedInUserToken = null
    const loggedInUserToken = await AriaKeyStringStorage.getItem('loggedInUserToken')
    devConsoleLog('loggedInUserToken: ', loggedInUserToken)
    if (loggedInUserToken !== null) {
      return this._post(
        apiPath,
        { 'Content-Type': 'application/json', 'x-access-token': loggedInUserToken },
        JSON.stringify(params)
      )
    }

    return this._post(
      apiPath,
      { 'Content-Type': 'application/json' },
      JSON.stringify(params)
    )
  }

  public postFormData(apiPath: string, formData: FormData): any {
    devConsoleLog('[POSTFD]', apiPath, formData)
    return this._post(
      apiPath,
      { 'Content-Type': 'multipart/form-data' },
      formData
    )
  }

  private _post(
    apiPath: string,
    headers: any,
    body: any
  ): any {
    const completeAPIURL = this._webAPIURL + apiPath

    return fetch(completeAPIURL, {
      method: 'POST',
      headers,
      body
    })
      .then(async (apiResponse: Response): Promise<any> => {
        if (!apiResponse.ok /* status <> 200-299 */) {
          devConsoleLog(
            'apiResponse NOK from',
            completeAPIURL,
            headers,
            body,
            ' status',
            apiResponse.status,
            apiResponse
          )

          return apiResponse.text()
        } else {
          const json = await apiResponse.json()
          devConsoleLog(
            '[RE]',
            apiPath,
            headers,
            body,
            JSON.stringify(json)
              .length.toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            json
          )

          return json
        }
      })
      .catch((error): any => {
        // NOTE Handled undefined return in caller (== null) and show network error
        devConsoleLog(
          'Exception: Network failure',
          completeAPIURL,
          body,
          error
        )

        return {
          status: 'error',
          message: error.toString()
        }
      });
  }

  public async get(apiPath: string, params: any, options?: any): Promise<any> {
    const urlEncodedParams = AriaWebAPIFetcher._convertObjectToFormURLEncoded(
      params
    )
    const completeAPIandParamsURL =
      this._webAPIURL + apiPath + (!isEmpty(params) ? ('&' + urlEncodedParams) : '')
    let headers = { 'Content-Type': 'application/json' }

    const loggedInUserToken = await AriaKeyStringStorage.getItem('loggedInUserToken')
    devConsoleLog('loggedInUserToken: ', loggedInUserToken)
    if (loggedInUserToken !== null)
      headers['x-access-token'] = loggedInUserToken

    return fetch(completeAPIandParamsURL, {
      method: 'GET',
      headers: headers
    })
      .then((apiResponse: Response): any => {
        if (!apiResponse.ok /* status <> 200-299 */) {
          devConsoleLog('apiResponse NOK status', apiResponse.status, completeAPIandParamsURL)
          return apiResponse.text()
        } else return apiResponse.json()
      })
      .catch((error): any => {
        // NOTE Handled undefined return in caller (== null) and show network error
        devConsoleLog(
          'Network failure',
          apiPath,
          urlEncodedParams,
          error
        )

        return {
          status: 'error',
          message: error.toString()
        }
      })
  }

  private static _convertObjectToFormURLEncoded(params: any): string {
    const formBody = []

    if (params !== {}) {
      for (let p in params) {
        formBody.push(
          encodeURIComponent(p) + '=' + encodeURIComponent(params[p])
        )
      }

      return formBody.join('&')
    }
    return ''
  }
}