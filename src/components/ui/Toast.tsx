"use client";

import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Text } from "./Text";

export type ToastTone = "ok" | "error";

type ToastProps = {
  message: string;
  tone: ToastTone;
};

export function Toast({ message, tone }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[26px] left-1/2 z-50 flex -translate-x-1/2 items-center gap-[9px] rounded-md bg-surface px-[18px] py-[11px] shadow-md"
    >
      {tone === "ok" ? (
        <CheckCircle weight="fill" size={17} className="text-accent-400" />
      ) : (
        <WarningCircle weight="fill" size={17} className="text-[#e0698a]" />
      )}
      <Text variant="uiSm" className="font-normal">
        {message}
      </Text>
    </div>
  );
}
