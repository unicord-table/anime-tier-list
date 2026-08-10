import Link from "next/link";
import { ChatCircle, Eye, Heart } from "@phosphor-icons/react/ssr";

import { BoardThumb } from "@/components/feed/BoardThumb";
import { Tag } from "@/components/ui/Tag";
import { Text } from "@/components/ui/Text";
import {
  avatarGradient,
  postHref,
  thumbRows,
  titleCount,
  type FeedPost,
} from "@/lib/feed";

/**
 * The two card treatments the feed uses: `FeaturedCard` leads with the board,
 * `FeedCard` leads with the author. Both read the same `FeedPost`, so a
 * published board will render in either without a second shape.
 *
 * Engagement counts render as text, not buttons — liking needs a signed-in
 * mutation and a `likes` table, neither of which exists
 * (.docs/architecture/social-feed.md). A control that only sets local state
 * would be a lie about what the product does.
 */

const CARD =
  "block rounded-[12px] bg-surface shadow-sm transition-[box-shadow,transform] " +
  "hover:shadow-md hover:-translate-y-px focus-visible:-translate-y-px";

function Avatar({ post }: { post: FeedPost }) {
  return (
    <div
      aria-hidden
      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
      style={{ background: avatarGradient(post.hue) }}
    >
      <Text variant="micro" tone="card">
        {post.author.charAt(0)}
      </Text>
    </div>
  );
}

export function FeaturedCard({ post }: { post: FeedPost }) {
  return (
    <Link href={postHref()} className={`${CARD} overflow-hidden text-ink`}>
      <div className="relative bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-accent)_14%,var(--color-surface)),var(--color-surface))] p-[14px]">
        <BoardThumb rows={thumbRows(post.spec)} size="md" />
        <Tag
          tone="outline"
          className="absolute top-[12px] right-[12px] bg-[color-mix(in_srgb,var(--color-canvas)_70%,transparent)]"
        >
          {post.featured}
        </Tag>
      </div>

      <div className="px-[16px] pt-[14px] pb-[15px]">
        <Text as="h3" variant="title" className="mb-[6px] block">
          {post.title}
        </Text>
        <Text as="p" variant="bodySm" tone="dim" className="mb-[12px] block text-pretty">
          {post.excerpt}
        </Text>
        <div className="flex items-center gap-[9px]">
          <Avatar post={post} />
          <Text variant="label" tone="subtle" className="min-w-0 truncate">
            {post.handle}
          </Text>
          <Text variant="label" tone="ghost">
            ·
          </Text>
          <Text variant="label" tone="faint" className="whitespace-nowrap">
            {titleCount(post)} titles
          </Text>
          <div className="flex-1" />
          <Text variant="label" tone="faint" className="flex items-center gap-[5px]">
            <Heart size={14} />
            {post.likes}
          </Text>
        </div>
      </div>
    </Link>
  );
}

export function FeedCard({ post }: { post: FeedPost }) {
  const href = postHref();
  return (
    <article
      className={`${CARD} grid grid-cols-1 gap-[16px] p-[14px] sm:grid-cols-[186px_minmax(0,1fr)]`}
    >
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="self-start rounded-[9px] bg-canvas p-[9px]"
      >
        <BoardThumb rows={thumbRows(post.spec)} size="sm" />
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="mb-[7px] flex flex-wrap items-center gap-[9px]">
          <Avatar post={post} />
          <Text variant="uiSm" tone="bright">
            {post.author}
          </Text>
          <Text variant="label" tone="ghost">
            {post.handle}
          </Text>
          <Text variant="label" tone="ghost">
            ·
          </Text>
          <Text variant="label" tone="faint">
            {post.time}
          </Text>
          {post.fresh ? <Tag tone="accent">New</Tag> : null}
        </div>

        <Link href={href} className="text-ink">
          <Text as="h3" variant="title" className="mb-[5px] block">
            {post.title}
          </Text>
        </Link>
        <Text as="p" variant="bodySm" tone="dim" className="mb-[11px] block text-pretty">
          {post.excerpt}
        </Text>

        <div className="mb-[11px] flex flex-wrap gap-[6px]">
          {post.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[4px]">
          <Text variant="label" tone="dim" className="flex items-center gap-[6px]">
            <Heart size={15} />
            {post.likes} likes
          </Text>
          <Text variant="label" tone="dim" className="flex items-center gap-[6px]">
            <ChatCircle size={15} />
            {post.comments} comments
          </Text>
          <div className="flex-1" />
          <Text variant="label" tone="ghost" className="flex items-center gap-[6px]">
            <Eye size={14} />
            {post.views}
          </Text>
        </div>
      </div>
    </article>
  );
}
