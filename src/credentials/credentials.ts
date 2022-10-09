import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { AssumeRoleParams } from '@aws-sdk/credential-provider-ini/dist-types/resolveAssumeRoleCredentials';
import * as AWS from '@aws-sdk/types';
import { localeString } from '../i18n';
import { window } from 'vscode';
import { WorkspaceStateRepository } from '../base-repository';

export interface ICredentialsProvider {
  provideCredentials(profile: string): Promise<AWS.Credentials>;
}

export interface ICredentialsRepository {
  getCredentials(profile: string): AWS.Credentials | undefined;
  setCredentials(profile: string, credentials: AWS.Credentials): void;
}

export class WorkspaceStateCredentialsRepository
  extends WorkspaceStateRepository
  implements ICredentialsRepository
{
  getCredentials(profile: string): AWS.Credentials | undefined {
    const key = this.getKey(profile);
    const credentials = this.getConfig<AWS.Credentials>(key);

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
    this.setConfig(key, credentials);
  }

  private getKey(profile: string): string {
    return `credentials:${profile}`;
  }
}

export class CredentialsProvider implements ICredentialsProvider {
  async provideCredentials(profile: string): Promise<AWS.Credentials> {
    return await this.getCredentialsFromIni(profile);
  }

  private async getCredentialsFromIni(
    profile: string
  ): Promise<AWS.Credentials> {
    return fromIni({
      profile,
      roleAssumer: this.assumeRole,
      mfaCodeProvider: async (mfaSerial) =>
        this.readMfaInput(mfaSerial, profile),
    })();
  }

  private async assumeRole(
    sourceCreds: AWS.Credentials,
    params: AssumeRoleParams
  ): Promise<AWS.Credentials> {
    const sts = new STSClient({ credentials: sourceCreds });
    const response = await sts.send(new AssumeRoleCommand(params));
    return {
      accessKeyId: response.Credentials!.AccessKeyId!,
      secretAccessKey: response.Credentials!.SecretAccessKey!,
      sessionToken: response.Credentials?.SessionToken,
      expiration: response.Credentials?.Expiration,
    };
  }

  private async readMfaInput(
    mfaSerial: string,
    profile: string
  ): Promise<string> {
    const token = await window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'Enter Authentication Code Here',
      title: `MFA Challange for ${profile}`,
      prompt: `Enter code for MFA device ${mfaSerial}`,
    });

    if (!token) {
      throw new Error(localeString('mfa-code-not-found'));
    }

    return token;
  }
}
