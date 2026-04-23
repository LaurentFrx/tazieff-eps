"use client";

// Phase E.2.3.4 — Mini QR code pour les cards classes. Wrapper autour de
// qrcode.react qui ne peut être rendu que côté client.

import { QRCodeSVG } from "qrcode.react";

type Props = {
  value: string;
  size?: number;
};

export default function ClassCardMiniQr({ value, size = 72 }: Props) {
  return (
    <div
      style={{
        background: "#f0f0f5",
        padding: 6,
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor="#f0f0f5"
        fgColor="#04040a"
      />
    </div>
  );
}
