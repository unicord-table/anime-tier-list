"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastTone } from "@/components/ui/Toast";

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
    (err: unknown) =>
      show(err instanceof Error ? err.message : String(err), "error"),
    [show],
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return { toast, show, showError };
}
