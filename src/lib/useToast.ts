"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConvexError } from "convex/values";
import type { ToastTone } from "@/components/ui/Toast";

/**
 * A Convex mutation that throws `ConvexError("...")` puts the message in
 * `.data`, not `.message` — `.message` carries the server's framing. Unwrap it
 * here rather than at each call site, so every caller shows the sentence the
 * mutation meant to send.
 */
export const errorMessage = (err: unknown): string => {
  if (err instanceof ConvexError && typeof err.data === "string") return err.data;
  return err instanceof Error ? err.message : String(err);
};

export type ToastState = { message: string; tone: ToastTone } | null;

export function useToast(timeoutMs = 2600) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, tone: ToastTone = "ok") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone });
      timer.current = setTimeout(() => setToast(null), timeoutMs);
    },
    [timeoutMs],
  );

  const showError = useCallback(
    (err: unknown) => show(errorMessage(err), "error"),
    [show],
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return { toast, show, showError };
}
