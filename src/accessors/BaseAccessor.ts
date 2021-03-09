// TODO determine proper types instead of any
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface APIFetcher {
  post(apiPath: string, params: any): any;
  postFormData(apiPath: string, formData: FormData): any;
  get(apiPath: string, params: any, options?: any): any;
}

export class APIAccessor {
  protected _ApiFetcher: APIFetcher

  public constructor(apiFetcher: APIFetcher) {
    this._ApiFetcher = apiFetcher
  }
}