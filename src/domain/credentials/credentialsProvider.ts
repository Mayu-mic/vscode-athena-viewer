import * as AWS from '@aws-sdk/types';
import { Region } from '../../connection/region';

export interface AWSCredentialsProvider {
  provideCredentials(
    profile: string,
    region: Region
  ): Promise<AWS.Credentials | undefined>;
}

export class MFACodeNotFoundError extends Error {}
