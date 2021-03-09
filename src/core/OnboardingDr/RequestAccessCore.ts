// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Promise: any
import { AriaCore } from '../AriaCore'
import { APIFetcher } from '../../accessors/BaseAccessor'
import { devConsoleLog } from '../../ur3/utilities'

export default class RequestAccessCore extends AriaCore {

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)
  }

  public async requestAriaToJoin(newInfo: any): Promise<any> {
    devConsoleLog('core newInfo: ', newInfo)
    return this._APIAccessor.requestAriaToJoin(newInfo)
  }

  public async listProviders(): Promise<any> {
    // const providers = await this._APIAccessor.listProviders()
    // devConsoleLog('providers: ', providers)
    // if(providers.list) return providers.list
    
    return [{ value: 'Provider1' }, { value: 'Provider2' }, { value: 'Provider3' }, { value: 'Provider4' }] //TODO test
  }
}