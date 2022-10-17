import { WorkspaceStateRepository } from '../baseRepository';
import { Configuration } from './config';

export interface ConfigurationRepository {
  setConfig(config: Configuration): void;
  getConfig(): Configuration | undefined;
}

export class WorkspaceStateConfigRepository
  extends WorkspaceStateRepository
  implements ConfigurationRepository
{
  setConfig(configuration: Configuration) {
    this.set('configuration', configuration);
  }

  getConfig(): Configuration | undefined {
    return this.get('configuration');
  }
}
