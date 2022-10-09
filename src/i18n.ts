import * as vscode from 'vscode';
import localeEn from '../package.nls.json';
import localeJa from '../package.nls.ja.json';

export type LocaleKeyType = keyof typeof localeEn;
interface LocaleEntry {
  [key: string]: string;
}
const localeTableKey = vscode.env.language;
const localeTable = Object.assign(
  localeEn,
  (<{ [key: string]: LocaleEntry }>{
    ja: localeJa,
  })[localeTableKey] || {}
);

export const localeString = (key: LocaleKeyType): string =>
  localeTable[key] || key;
export const localeMap = (key: LocaleKeyType): string => localeString(key);
