"use client";

import { useState } from "react";
import {
  GithubLogo,
  GoogleLogo,
  ShieldCheck,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { convex } from "@/components/ConvexClientProvider";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";

const PROVIDERS = [
  { id: "google", label: "Google", icon: <GoogleLogo size={17} weight="bold" /> },
  { id: "github", label: "GitHub", icon: <GithubLogo size={17} weight="fill" /> },
];

export function AccountMenu() {
  // Outside a ConvexAuthProvider the hooks below throw, so the guard has to sit
  // in a component that calls none of them.
  if (!convex) return null;
  return <Account />;
}

function Account() {
  const { signIn, signOut } = useAuthActions();
  // undefined = still resolving, null = signed out. No separate isLoading /
  // isAuthenticated state to keep in step with this one.
  const viewer = useQuery(api.users.viewer);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (viewer === undefined) return null;

  if (viewer !== null) {
    const detail = [
      viewer.email,
      viewer.provider && `signed in with ${viewer.provider}`,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <div className="flex items-center gap-[7px]">
        {viewer.image ? (
          // Plain <img> for the same reason as cover art — see AnimeCard.
          // no-referrer because Google's avatar CDN 403s on some Referer
          // headers, and a broken avatar is worse than an unattributed one.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewer.image}
            alt=""
            referrerPolicy="no-referrer"
            className="h-[24px] w-[24px] rounded-full object-cover"
          />
        ) : (
          <UserCircle size={24} className="text-neutral-400" />
        )}
        <Text variant="uiSm" title={detail || undefined}>
          {viewer.name}
        </Text>
        <IconButton
          title="Sign out"
          size="sm"
          icon={<SignOut />}
          onClick={() => void signOut()}
        />
      </div>
    );
  }

  const start = async (id: string, label: string) => {
    setError(null);
    try {
      // Redirects the browser on success, so nothing follows this line.
      await signIn(id);
    } catch {
      setError(`Couldn't start the ${label} sign-in. Try again in a moment.`);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        icon={<UserCircle size={17} />}
        onClick={() => setOpen(true)}
      >
        Sign in
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        label="Sign in"
        className="max-w-[408px]"
      >
        <div className="relative px-[26px] pt-[26px] pb-[20px]">
          {/* The accent hairline across the panel's top edge. */}
          <div className="absolute top-0 right-[34px] left-[34px] h-px bg-[linear-gradient(90deg,transparent,var(--color-accent),transparent)]" />

          <Brand />

          <Text as="h2" variant="dialogTitle" className="mt-[16px]">
            Welcome back
          </Text>
          <Text as="p" variant="label" tone="muted" className="mt-[5px] mb-[18px]">
            One tap with Google or GitHub — there is no password to set.
          </Text>

          <div className="flex gap-[9px]">
            {PROVIDERS.map((p) => (
              <Button
                key={p.id}
                variant="social"
                icon={p.icon}
                className="flex-1"
                onClick={() => void start(p.id, p.label)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {error ? (
            <Text
              as="p"
              variant="label"
              tone="accent"
              role="alert"
              className="mt-[13px]"
            >
              {error}
            </Text>
          ) : null}

          <div className="mt-[16px] flex items-center justify-center gap-[6px] border-t border-neutral-800 pt-[15px]">
            <ShieldCheck size={14} className="text-accent-500" />
            <Text variant="caption" tone="faint">
              Boards on this device stay saved either way
            </Text>
          </div>
        </div>
      </Modal>
    </>
  );
}
