"use client";

import { useEffect, useState } from "react";
import { MinusCircle, PlusCircle, Star } from "@phosphor-icons/react";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Tag } from "@/components/ui/Tag";
import { Text } from "@/components/ui/Text";
import { fetchAnimeDetail } from "@/lib/anilist";
import { retryCover } from "@/lib/img";
import type { Media, MediaDetail } from "@/lib/types";

/** FINISHED -> Finished, NOT_YET_RELEASED -> Not yet released. */
function humanize(value: string | null): string | null {
  if (!value) return null;
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

type AnimeDetailModalProps = {
  media: Media | null;
  onClose: () => void;
  onBoard: boolean;
  onAdd: (media: Media) => void;
  onRemove: (media: Media) => void;
};

export function AnimeDetailModal({
  media,
  onClose,
  onBoard,
  onAdd,
  onRemove,
}: AnimeDetailModalProps) {
  // Keyed by the id it belongs to, so switching cards shows the loading state
  // again without a second setState to reset it.
  const [fetched, setFetched] = useState<{
    id: number;
    detail: MediaDetail | null;
    error: string | null;
  } | null>(null);

  const current = media && fetched?.id === media.id ? fetched : null;
  const detail = current?.detail ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!media) return;
    const controller = new AbortController();

    fetchAnimeDetail(media.id, controller.signal)
      .then((result) => setFetched({ id: media.id, detail: result, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setFetched({
          id: media.id,
          detail: null,
          error: err instanceof Error ? err.message : "Could not load details",
        });
      });

    return () => controller.abort();
  }, [media]);

  const meta = detail
    ? [
        humanize(detail.format),
        detail.seasonYear
          ? `${humanize(detail.season) ?? ""} ${detail.seasonYear}`.trim()
          : null,
        detail.episodes ? `${detail.episodes} eps` : null,
        detail.duration ? `${detail.duration} min` : null,
        humanize(detail.status),
        detail.studio,
      ].filter(Boolean)
    : [];

  return (
    <Modal
      open={media !== null}
      onClose={onClose}
      label="Anime details"
      // Sits over the banner art, so it needs its own scrim to stay legible.
      closeClassName="bg-[rgba(11,12,20,.55)] text-neutral-300 hover:text-ink"
    >
      {media ? (
        <>
          <div className="relative h-[132px] flex-none bg-neutral-900">
            {detail?.banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.banner}
                alt=""
                crossOrigin="anonymous"
                onError={retryCover}
                className="h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(transparent,var(--color-surface))]" />
          </div>

          {/* `relative` is load-bearing: the banner above is positioned, so a
              static sibling paints *under* it and the negative margin buries
              the top 54px of the cover behind the banner's gradient. */}
          <div className="scrollbar relative -mt-[54px] flex-1 overflow-y-auto px-[22px] pb-[20px]">
            <div className="flex gap-[18px]">
              {media.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail?.cover || media.cover}
                  alt=""
                  // Same CORS mode as AnimeCard — see retryCover. The detail
                  // query asks for extraLarge, which the CDN does not always
                  // have, so a failure falls back to the card's cover URL.
                  crossOrigin="anonymous"
                  onError={(e) => retryCover(e, media.cover)}
                  className="h-[168px] w-[118px] flex-none rounded-md object-cover shadow-md"
                />
              ) : null}

              <div className="min-w-0 flex-1 pt-[58px]">
                <Text as="h2" variant="title" className="text-[22px]">
                  {media.title}
                </Text>
                {detail?.titleEn && detail.titleEn !== media.title ? (
                  <Text as="p" variant="label" tone="muted" className="mt-[2px]">
                    {detail.titleEn}
                  </Text>
                ) : null}

                <div className="mt-[10px] flex flex-wrap items-center gap-[6px]">
                  {detail?.averageScore ? (
                    <Tag tone="accent" className="gap-[4px]">
                      <Star weight="fill" size={11} />
                      {detail.averageScore}%
                    </Tag>
                  ) : null}
                  {meta.map((item) => (
                    <Tag key={String(item)}>{item}</Tag>
                  ))}
                </div>
              </div>
            </div>

            {detail?.genres.length ? (
              <div className="mt-[16px] flex flex-wrap gap-[6px]">
                {detail.genres.map((genre) => (
                  <Tag key={genre} tone="outline">
                    {genre}
                  </Tag>
                ))}
              </div>
            ) : null}

            <div className="mt-[16px]">
              {error ? (
                <Text as="p" variant="label" tone="muted">
                  {error}
                </Text>
              ) : detail ? (
                <Text
                  as="p"
                  variant="body"
                  tone="subtle"
                  className="text-[14px] whitespace-pre-line"
                >
                  {detail.description || "No synopsis on AniList for this title."}
                </Text>
              ) : (
                <Text as="p" variant="label" tone="muted">
                  Loading details…
                </Text>
              )}
            </div>

            <div className="mt-[20px] flex flex-wrap items-center gap-[8px] border-t border-divider pt-[16px]">
              {onBoard ? (
                <Button
                  variant="secondary"
                  icon={<MinusCircle size={16} />}
                  onClick={() => onRemove(media)}
                >
                  Remove from board
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={<PlusCircle size={16} />}
                  onClick={() => onAdd(media)}
                >
                  Add to pool
                </Button>
              )}

              <div className="flex-1" />

              {detail ? (
                <>
                  <ExternalLink href={detail.siteUrl}>AniList</ExternalLink>
                  {detail.malUrl ? (
                    <ExternalLink href={detail.malUrl}>MyAnimeList</ExternalLink>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
