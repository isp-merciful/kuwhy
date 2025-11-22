"use client";

import Link from "next/link";

const urlRegex = /(https?:\/\/[^\s]+)/g;

function getYoutubeId(rawUrl) {
  try {
    const url = new URL(rawUrl);

    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.slice(1);
    }

    if (host === "youtube.com" || host === "m.youtube.com") {

      if (url.pathname.startsWith("/watch")) {
        return url.searchParams.get("v");
      }

      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/shorts/")[1]?.split("/")[0];
      }
    }
  } catch (e) {
  }
  return null;
}

export default function CommentBody({ text = "" }) {
  if (!text) {
    return null;
  }

  const matches = [...text.matchAll(urlRegex)];

  if (matches.length === 0) {
    return (
      <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
        {text}
      </p>
    );
  }

  const parts = [];
  let lastIndex = 0;

  matches.forEach((match) => {
    const url = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({
        type: "text",
        value: text.slice(lastIndex, index),
      });
    }

    parts.push({
      type: "url",
      value: url,
    });

    lastIndex = index + url.length;
  });

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        if (part.type === "text") {
          return (
            <p
              key={idx}
              className="whitespace-pre-wrap break-words text-sm text-slate-800"
            >
              {part.value}
            </p>
          );
        }

        const url = part.value;
        const youtubeId = getYoutubeId(url);

        if (youtubeId) {
          const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;

          return (
            <div
              key={idx}
              className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950/5"
            >
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  title="YouTube video player"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="truncate px-3 py-2 text-xs text-slate-500">
                {url}
              </div>
            </div>
          );
        }

        return (
          <Link
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm text-sky-600 underline underline-offset-2"
          >
            {url}
          </Link>
        );
      })}
    </div>
  );
}
