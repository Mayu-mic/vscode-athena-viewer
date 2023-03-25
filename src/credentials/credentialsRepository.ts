import * as AWS from '@aws-sdk/types';
import { ExtensionContext } from 'vscode';
import {
  MementoStateAccessor,
  StateAccessor,
} from '../infrastracture/stateAccessor';

export interface CredentialsRepository {
  getCredentials(profile: string): AWS.Credentials | undefined;
  setCredentials(profile: string, credentials: AWS.Credentials): void;
}

export class WorkspaceStateCredentialsRepository
  implements CredentialsRepository
{
  constructor(private accessor: StateAccessor<AWS.Credentials>) {}

  getCredentials(profile: string): AWS.Credentials | undefined {
    const key = this.getKey(profile);
    const credentials = this.accessor.get(key);

    if (
      credentials &&
      credentials.expiration &&
      new Date() < new Date(Date.parse(credentials.expiration.toString()))
    ) {
      return credentials;
    }
  }

  setCredentials(profile: string, credentials: AWS.Credentials): void {
    const key = this.getKey(profile);
    this.accessor.set(key, credentials);
  }

  private getKey(profile: string): string {
    return `credentials:${profile}`;
  }

  static createDefault(
    ctx: ExtensionContext
  ): WorkspaceStateCredentialsRepository {
    const accessor = new MementoStateAccessor<AWS.Credentials>(ctx);
    return new WorkspaceStateCredentialsRepository(accessor);
  }
}
