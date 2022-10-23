import * as AWS from '@aws-sdk/types';
import { WorkspaceStateRepository } from '../baseRepository';

export interface CredentialsRepository {
  getCredentials(profile: string): AWS.Credentials | undefined;
  setCredentials(profile: string, credentials: AWS.Credentials): void;
}

export class WorkspaceStateCredentialsRepository
  extends WorkspaceStateRepository
  implements CredentialsRepository
{
  getCredentials(profile: string): AWS.Credentials | undefined {
    const key = this.getKey(profile);
    const credentials = this.get<AWS.Credentials>(key);

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
    this.set(key, credentials);
  }

  private getKey(profile: string): string {
    return `credentials:${profile}`;
  }
}
