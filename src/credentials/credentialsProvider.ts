import * as AWS from '@aws-sdk/types';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { AssumeRoleParams } from '@aws-sdk/credential-provider-ini/dist-types/resolveAssumeRoleCredentials';
import { localeString } from '../i18n';
import { window } from 'vscode';

export interface CredentialsProvider {
  provideCredentials(profile: string): Promise<AWS.Credentials | undefined>;
}

export class AWSCredentialsProvider implements CredentialsProvider {
  async provideCredentials(
    profile: string
  ): Promise<AWS.Credentials | undefined> {
    try {
      return await this.getCredentialsFromIni(profile);
    } catch (error) {
      window.showErrorMessage(localeString('mfa-code-not-found'));
      return undefined;
    }
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
      throw new Error('MFA token is required');
    }

    return token;
  }
}
