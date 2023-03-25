import { Region, regions } from './region';

export interface Connection {
  region: Region;
  workgroup: string;
}

export const defaultWorkgroup = 'primary';

export const defaultConnection = {
  region: regions[0],
  workgroup: defaultWorkgroup,
};
