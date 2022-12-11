import * as AWS from '@aws-sdk/types';
import { AssumeRoleParams } from '@aws-sdk/credential-provider-ini/dist-types/resolveAssumeRoleCredentials';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';

export class FailedAssumeRoleError extends Error {}

export class STSClientWrapper {
  private sts: STSClient;
  constructor(region: string, sourceCreds: AWS.Credentials) {
    this.sts = new STSClient({ credentials: sourceCreds, region });
  }
  async getAssumeRole(params: AssumeRoleParams): Promise<AWS.Credentials> {
    try {
      const response = await this.sts.send(new AssumeRoleCommand(params));
      return {
        accessKeyId: response.Credentials!.AccessKeyId!,
        secretAccessKey: response.Credentials!.SecretAccessKey!,
        sessionToken: response.Credentials?.SessionToken,
        expiration: response.Credentials?.Expiration,
      };
    } catch (e: any) {
      throw new FailedAssumeRoleError();
    }
  }
}
