import { AriaCore } from './AriaCore'
import { APIFetcher } from '../accessors/BaseAccessor'
import { UserProfile } from '../types'

export default class PtDashboardCore extends AriaCore {

  private _profile = { ariaID: '' }

  public constructor(apiFetcher: APIFetcher, localDBTransactor) {
    super(apiFetcher, localDBTransactor)

    this.getUserProfile()
  }

  public async getUserProfile(): Promise<UserProfile> {
    const profile = await this._LocalDBAccessor.getProfileOfLoggedInUser()
    this._profile = profile
    return profile
  }
}