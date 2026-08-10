import type { Metadata } from "next";
import Link from "next/link";
import { Ranking } from "@phosphor-icons/react/ssr";

import { MyBoards } from "@/components/feed/MyBoards";
import { SiteFooter, SiteHeader } from "@/components/feed/SiteChrome";
import { buttonClass } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Text";
import { TIERLIST_ROUTE } from "@/lib/feed";

export const metadata: Metadata = {
  title: "My tier lists — Tierist",
  description: "Every tier list you have published, with its share link.",
  robots: { index: false, follow: false },
};

/** The listing itself is client-rendered — see `MyBoards`. */
export default function MyTierListsPage() {
  return (
    <div className="min-h-full bg-canvas text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-[940px] px-[26px] pt-[40px] pb-[60px]">
        <div className="mb-[26px] flex flex-wrap items-end gap-[16px]">
          <div>
            <Heading>My tier lists</Heading>
            <Text as="p" variant="label" tone="faint" className="mt-[6px] block">
              Published boards only. Drafts live in the editor, on this device.
            </Text>
          </div>
          <div className="flex-1" />
          <Link href={TIERLIST_ROUTE} className={buttonClass("primary", "gap-[8px]")}>
            <Ranking size={16} />
            New tier list
          </Link>
        </div>

        <MyBoards />
      </main>

      <SiteFooter />
    </div>
  );
}
