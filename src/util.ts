export function filled<T>(item: T | undefined): item is T {
  return !!item;
}
