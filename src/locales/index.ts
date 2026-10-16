import { ko, type LocaleMessages } from "./ko";
import { en } from "./en";

export type Locale = "ko" | "en";

export const locales: Record<Locale, LocaleMessages> = {
  ko,
  en,
};

export { ko, en };
export type { LocaleMessages };
