"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SectionHero } from "@/components/SectionHero";
import { IlluShare } from "@/components/illustrations";
import { resolveEnv } from "@/lib/env";

export default function PartagerPage() {
  const { t } = useI18n();
  // Sprint A1 — APP_URL dérivé de resolveEnv() pour suivre l'env courant.
  const APP_URL = resolveEnv().baseUrl.eleve;
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  async function handleShare() {
    try {
      await navigator.share({
        title: "Muscu EPS",
        text: t("partager.shareText"),
        url: APP_URL,
      });
    } catch {
      // User cancelled or share failed — silent
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the URL text
    }
  }

  return (
    <section className="page">
      <SectionHero
        title={t("partager.title")}
        gradient="from-pink-500 to-rose-500"
        illustration={<IlluShare />}
      />

      <div className="flex flex-col items-center gap-6 mt-6">
        {/* QR Code */}
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <Image
            src="/images/muscu-eps-qr.png"
            alt="QR code muscu-eps.fr"
            width={280}
            height={280}
            priority
            className="w-[280px] h-[280px] md:w-[320px] md:h-[320px]"
          />
        </div>

        {/* Caption */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          {t("partager.scan")}
        </p>

        {/* URL */}
        <p className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100 select-all text-center">
          muscu-eps.fr
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {canShare && (
            <button
              onClick={handleShare}
              className="min-h-[44px] rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-base font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              {t("partager.share")}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="min-h-[44px] rounded-xl border-2 border-zinc-300 dark:border-zinc-600 px-6 py-3 text-base font-bold text-zinc-700 dark:text-zinc-200 transition-all duration-200 hover:border-pink-400 hover:text-pink-500 active:scale-[0.98]"
          >
            {copied ? t("partager.copied") : t("partager.copyLink")}
          </button>

          <a
            href="/images/muscu-eps-qr.png"
            download="muscu-eps-qr.png"
            className="min-h-[44px] rounded-xl border-2 border-zinc-300 dark:border-zinc-600 px-6 py-3 text-base font-bold text-zinc-700 dark:text-zinc-200 text-center transition-all duration-200 hover:border-pink-400 hover:text-pink-500 active:scale-[0.98]"
          >
            {t("partager.download")}
          </a>
        </div>

        {/* Hint */}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-xs px-4 mb-4">
          {t("partager.hint")}
        </p>
      </div>
    </section>
  );
}
