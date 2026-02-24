export const CONTROL_CHAR_PATTERN = /[\x00-\x1f\x7f]/;

export const isSafeValue = (value: string) => {
  return !CONTROL_CHAR_PATTERN.test(value) && !/[\r\n]/.test(value);
};

export const extractBracketVariables = (commandText: string) => {
  const result: string[] = [];
  const seen = new Set<string>();
  const regex = /\[([^\[\]\s]+)\]/g;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(commandText)) !== null) {
    const name = match[1].trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }

  return result;
};

export const applyBracketTemplate = (
  commandText: string,
  values: Record<string, string>
) => {
  return commandText.replace(/\[([^\[\]\s]+)\]/g, (_, rawName: string) => {
    const name = rawName.trim();
    return values[name] ?? `[${name}]`;
  });
};
