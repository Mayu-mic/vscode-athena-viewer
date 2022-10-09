import { WorkspaceStateRepository } from '../base-repository';

export interface IConfigurationRepository {
  getProfile(): string | undefined;
  getRegion(): string | undefined;
  getWorkgroup(): string | undefined;
  setProfile(profile: string): void;
  setRegion(region: string): void;
  setWorkgroup(workspace: string): void;
}

export interface IConfigurationProvider {
  provideProfile(candidates: string[]): Promise<string | undefined>;
  provideRegion(): Promise<string | undefined>;
  provideWorkgroup(): Promise<string | undefined>;
}

export class WorkspaceStateConfigRepository
  extends WorkspaceStateRepository
  implements IConfigurationRepository
{
  getProfile(): string | undefined {
    return this.getConfig('profile');
  }

  getRegion(): string | undefined {
    return this.getConfig('region');
  }

  getWorkgroup(): string | undefined {
    return this.getConfig('workspace');
  }

  setProfile(profile: string): void {
    this.setConfig('profile', profile);
  }

  setRegion(region: string): void {
    this.setConfig('region', region);
  }

  setWorkgroup(workspace: string): void {
    this.setConfig('workspace', workspace);
  }
}
