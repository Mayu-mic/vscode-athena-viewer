import { Event, EventEmitter, window } from 'vscode';
import { Configuration } from '../config/config';
import { ConfigurationRepository } from '../config/configRepository';
import { ConfigurationProvider } from '../config/configurationProvider';
import { getCredentialProfiles } from '../credentials/getCredentialProfiles';

export class SetupConfigsCommandProvider {
  constructor(
    private configRepository: ConfigurationRepository,
    private configProvider: ConfigurationProvider
  ) {}

  private _onChangeProfileStatus: EventEmitter<void> = new EventEmitter();
  readonly onChangeProfileStatus: Event<void> =
    this._onChangeProfileStatus.event;

  async setupConfigsCommand() {
    const result = await this.setConfigs();
    if (!result) {
      return;
    }
    window.showInformationMessage('Configuration updated!');
  }

  private async setConfigs(): Promise<Configuration | undefined> {
    const profiles = await getCredentialProfiles();
    const profile = await this.configProvider.provideProfile(profiles);
    if (!profile) {
      return;
    }
    const region = await this.configProvider.provideRegion();
    if (!region) {
      return;
    }
    const workgroup = await this.configProvider.provideWorkgroup();
    if (!workgroup) {
      return;
    }
    const config: Configuration = {
      profile,
      region,
      workgroup,
    };
    this.configRepository.setConfig(config);
    this._onChangeProfileStatus.fire();
    return config;
  }
}
