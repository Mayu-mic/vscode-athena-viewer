export function filled<T>(item: T | undefined): item is T {
  return !!item;
}

export function truncate(
  text: string,
  length: number,
  option?: { omission: string }
): string {
  const defaultOption: Required<typeof option> = {
    omission: '...',
  };
  option = Object.assign({}, defaultOption, option);
  if (text.length <= length) {
    return text;
  } else {
    return text.substring(0, length - option.omission.length) + option.omission;
  }
}

export function isParameterizedQuery(query: string): boolean {
  const afterWhere = query.split('where')[1];
  return !!afterWhere?.includes('?');
}
