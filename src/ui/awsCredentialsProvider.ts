import * as AWS from '@aws-sdk/types';
import { Region } from '../connection/region';
import {
  AWSCredentialsProvider,
  MFACodeNotFoundError,
} from '../domain/credentials/credentialsProvider';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { AssumeRoleParams } from '@aws-sdk/credential-provider-ini/dist-types/resolveAssumeRoleCredentials';
import { localeString } from '../i18n';
import { window } from 'vscode';
import { FailedAssumeRoleError, STSClientWrapper } from '../sts';

export class VSCodeAWSCredentialsProvider implements AWSCredentialsProvider {
  async provideCredentials(
    profile: string,
    region: Region
  ): Promise<AWS.Credentials | undefined> {
    try {
      return await this.getCredentialsFromIni(profile, region);
    } catch (error: unknown) {
      if (error instanceof MFACodeNotFoundError) {
        window.showErrorMessage(localeString('mfa-code-not-found'));
      } else if (error instanceof FailedAssumeRoleError) {
        window.showErrorMessage(localeString('failed-assume-role-error'));
      } else if (error instanceof Error) {
        window.showErrorMessage(error.message);
      } else {
        window.showErrorMessage(`unknown error: ${error}`);
      }
      return undefined;
    }
  }

  private async getCredentialsFromIni(
    profile: string,
    region: Region
  ): Promise<AWS.Credentials> {
    return fromIni({
      profile,
      roleAssumer: (sourceCreds: AWS.Credentials, params: AssumeRoleParams) =>
        this.assumeRole(region, sourceCreds, params),
      mfaCodeProvider: async (mfaSerial) =>
        this.readMfaInput(mfaSerial, profile),
    })();
  }

  private async assumeRole(
    region: Region,
    sourceCreds: AWS.Credentials,
    params: AssumeRoleParams
  ): Promise<AWS.Credentials> {
    const client = new STSClientWrapper(region.id, sourceCreds);
    return await client.getAssumeRole(params);
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
      throw new MFACodeNotFoundError();
    }

    return token;
  }
}
