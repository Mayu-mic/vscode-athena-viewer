import { WorkspaceStateRepository } from '../baseRepository';
import { Configuration } from './config';

export interface ConfigurationRepository {
  setConfig(config: Configuration): Promise<void>;
  getConfig(): Promise<Configuration | undefined>;
}

export class WorkspaceStateConfigRepository
  extends WorkspaceStateRepository
  implements ConfigurationRepository
{
  setConfig(configuration: Configuration): Promise<void> {
    return Promise.resolve(this.set('configuration', configuration));
  }

  getConfig(): Promise<Configuration | undefined> {
    return Promise.resolve(this.get('configuration'));
  }
}
