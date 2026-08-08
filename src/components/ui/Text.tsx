import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * The single typographic primitive. Every piece of text in the app goes
 * through here, so a size or colour change happens in one place instead of
 * across forty inline styles.
 *
 * Variants are drawn from the Nocturne scale plus the sizes the Tierist design
 * actually uses — nothing speculative. Add one here rather than reaching for a
 * raw `text-[13px]` in a component.
 */

const VARIANTS = {
  /** Public tier-list title. */
  display: "font-heading text-[34px] font-medium leading-[1.12] tracking-[-0.015em]",
  /** Nocturne h3 — the heading inside a modal. */
  dialogTitle: "font-heading text-[23px] font-medium leading-[1.12] tracking-[-0.015em]",
  /** Board title, card titles. */
  title: "font-heading text-[17px] font-semibold leading-[1.2] tracking-[-0.01em]",
  /** Editable tier letter. */
  tierLabel: "font-heading text-[21px] font-bold leading-none tracking-[-0.01em]",
  /** Read-only tier letter on the public board. */
  tierLabelLg: "font-heading text-[23px] font-bold leading-none tracking-[-0.01em]",
  /** Nocturne h6 — the uppercase panel heading. */
  eyebrow: "font-heading text-[13px] font-medium uppercase tracking-[0.08em] leading-[1.12]",
  /** "Results", "Unranked pool". */
  sectionLabel: "font-heading text-[12px] font-semibold tracking-[0.02em]",
  /** Default paragraph copy. */
  body: "font-body text-[15px] leading-[1.55]",
  /** Buttons and inputs. */
  ui: "font-heading text-[14px] font-medium leading-[1.2]",
  /** Compact controls — tabs, segmented buttons. */
  uiSm: "font-heading text-[13px] font-medium leading-[1.2]",
  /** Field labels, status text. */
  label: "font-body text-[12px] leading-[1.4]",
  /** Counts and hints. */
  caption: "font-body text-[11px] leading-[1.45]",
  /** Cover-art overlays. */
  micro: "font-body text-[9px] font-semibold leading-[1.15]",
} as const;

const TONES = {
  default: "text-ink",
  muted: "text-muted",
  subtle: "text-neutral-300",
  dim: "text-neutral-400",
  faint: "text-neutral-500",
  accent: "text-accent",
  accentSoft: "text-accent-200",
  /** On cover art, over the dark scrim. */
  card: "text-card-ink",
  cardDim: "text-card-ink-dim",
  /** On a filled tier swatch — the tier colours are all light. */
  onTier: "text-canvas",
  inherit: "",
} as const;

export type TextVariant = keyof typeof VARIANTS;
export type TextTone = keyof typeof TONES;

type TextProps<T extends ElementType> = {
  as?: T;
  variant?: TextVariant;
  tone?: TextTone;
  /** Clamp to N lines. Cover-art titles rely on this. */
  clamp?: number;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Text<T extends ElementType = "span">({
  as,
  variant = "body",
  tone = "default",
  clamp,
  className = "",
  children,
  ...rest
}: TextProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={`${VARIANTS[variant]} ${TONES[tone]} ${className}`.trim()}
      style={
        clamp
          ? {
              display: "-webkit-box",
              WebkitLineClamp: clamp,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Convenience wrappers for the two headings that carry semantic weight. */
export const Heading = (
  props: Omit<TextProps<"h1">, "as" | "variant"> & { variant?: TextVariant },
) => <Text as="h1" variant="display" {...props} />;

export const SectionLabel = (props: Omit<TextProps<"span">, "variant">) => (
  <Text variant="sectionLabel" tone="subtle" {...props} />
);
