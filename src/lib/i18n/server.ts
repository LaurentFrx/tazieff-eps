import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n/messages";

const LANG_COOKIE = "eps_lang";

export async function getCurrentLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LANG_COOKIE)?.value;
  return value === "en" ? "en" : "fr";
}
