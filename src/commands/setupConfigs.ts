import { window } from 'vscode';
import { Configuration } from '../config/config';
import { ConfigurationRepository } from '../config/configRepository';
import { ConfigurationProvider } from '../config/configurationProvider';
import { getCredentialProfiles } from '../credentials/getCredentialProfiles';

export class SetupConfigsCommandProvider {
  constructor(
    private configRepository: ConfigurationRepository,
    private configProvider: ConfigurationProvider
  ) {}

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
    await this.configRepository.setConfig(config);
    return config;
  }
}
