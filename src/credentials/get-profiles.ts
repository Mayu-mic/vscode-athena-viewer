import { parseKnownFiles } from '@aws-sdk/shared-ini-file-loader';

export async function getCredentialProfiles(): Promise<string[]> {
  const result = await parseKnownFiles({});
  return Object.keys(result);
}
