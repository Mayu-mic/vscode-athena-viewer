import { window } from 'vscode';
import {
  IConfigurationProvider,
  IConfigurationRepository,
} from '../config/config-repository';
import { getCredentialProfiles } from '../credentials/get-profiles';
import { ExtensionConfig } from '../types';

export class SetupConfigsCommandProvider {
  constructor(
    private configRepository: IConfigurationRepository,
    private configProvider: IConfigurationProvider
  ) {}

  async setupConfigsCommand() {
    const result = await this.setConfigs();
    if (!result) {
      return;
    }
    window.showInformationMessage('Configuration updated!');
  }

  private async setConfigs(): Promise<ExtensionConfig | undefined> {
    const profiles = await getCredentialProfiles();
    const profile = await this.configProvider.provideProfile(profiles);
    if (!profile) {
      return;
    }
    this.configRepository.setProfile(profile);

    const region = await this.configProvider.provideRegion();
    if (!region) {
      return;
    }
    this.configRepository.setRegion(region);

    const workgroup = await this.configProvider.provideWorkgroup();
    if (!workgroup) {
      return;
    }
    this.configRepository.setWorkgroup(workgroup);

    return { profile, region, workgroup };
  }
}
