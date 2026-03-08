const isAsciiLetterOrDigit = (code: number) =>
  (code >= 48 && code <= 57) || // 0-9
  (code >= 65 && code <= 90) || // A-Z
  (code >= 97 && code <= 122); // a-z

const isCommonJapaneseRange = (code: number) =>
  (code >= 0x3040 && code <= 0x309f) || // Hiragana
  (code >= 0x30a0 && code <= 0x30ff) || // Katakana
  (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
  (code >= 0xff66 && code <= 0xff9f); // Half-width Katakana

const filterAllowedChars = (value: string) => {
  let result = "";
  for (const ch of value) {
    if (ch === "-") {
      result += ch;
      continue;
    }
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    if (isAsciiLetterOrDigit(code) || isCommonJapaneseRange(code)) {
      result += ch;
    }
  }
  return result;
};

export const normalizeName = (value: string) =>
  filterAllowedChars(
    value
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
  ).replace(/-+/g, "-");
