"use client";

import { useState } from "react";
import {
  GithubLogo,
  GoogleLogo,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { convex } from "@/components/ConvexClientProvider";
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
      <Button icon={<UserCircle size={16} />} onClick={() => setOpen(true)}>
        Sign in
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        label="Sign in"
        className="max-w-[380px]"
      >
        <div className="flex flex-col gap-[14px] p-[26px]">
          <Text as="h2" variant="title">
            Sign in to Tierist
          </Text>
          <Text variant="label" tone="muted">
            Your board stays on this device — accounts don&apos;t sync it yet.
          </Text>
          {PROVIDERS.map((p) => (
            <Button
              key={p.id}
              icon={p.icon}
              className="w-full justify-start"
              onClick={() => void start(p.id, p.label)}
            >
              Continue with {p.label}
            </Button>
          ))}
          {error ? (
            <Text variant="label" tone="accent" role="alert">
              {error}
            </Text>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
