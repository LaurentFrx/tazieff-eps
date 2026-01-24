/* eslint-disable @next/next/no-img-element */
import Image, { type StaticImageData } from "next/image";

type FigureProps = {
  src: string | StaticImageData;
  alt?: string;
  caption?: string;
  credit?: string;
  priority?: boolean;
};

export function Figure({
  src,
  alt = "",
  caption,
  credit,
  priority,
}: FigureProps) {
  const imageClassName =
    "block w-full h-auto object-contain max-h-[70vh] md:max-h-[720px]";

  const image = typeof src === "string" ? (
    // Use native img for string paths so dimensions are not required.
    <img
      src={src}
      alt={alt}
      className={imageClassName}
      loading={priority ? "eager" : "lazy"}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 900px, 980px"
      className={imageClassName}
    />
  );

  return (
    <figure className="overflow-hidden rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[var(--shadow)] backdrop-blur-xl">
      <div className="bg-[color:var(--bg-2)]">{image}</div>
      {(caption || credit) && (
        <figcaption className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs text-[color:var(--muted)]">
          {caption ? <span>{caption}</span> : null}
          {credit ? (
            <span className="ml-auto text-[color:var(--muted)]">
              {credit}
            </span>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}
