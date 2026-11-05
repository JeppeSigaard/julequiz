import { useState } from "react";
import { asset } from "./asset";

// Nøglen er URL'en uden fragment (fx "#t=00:00:50"), så samme fil kun hentes én gang.
const blobUrls = new Map<string, string>();
const loads = new Map<string, Promise<void>>();

const withoutFragment = (url: string) => url.split("#")[0] ?? url;

const load = (url: string): Promise<void> => {
  const existing = loads.get(url);
  if (existing) return existing;
  const promise = (async () => {
    try {
      const res = await fetch(url);
      if (res.ok) blobUrls.set(url, URL.createObjectURL(await res.blob()));
    } catch {
      // Fejlede filer forbliver umappede, så netværks-URL'en bruges.
    }
  })();
  loads.set(url, promise);
  return promise;
};

export const preloadMedia = async (
  urls: string[],
  onProgress: (done: number, total: number) => void,
): Promise<void> => {
  const queue = [...new Set(urls.filter((u) => !u.startsWith("data:")).map(withoutFragment))];
  const total = queue.length;
  let done = 0;
  onProgress(0, total);
  const worker = async () => {
    for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
      await load(url);
      onProgress(++done, total);
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
};

export const cachedUrl = (url: string): string => {
  const base = withoutFragment(url);
  const blob = blobUrls.get(base);
  return blob === undefined ? url : blob + url.slice(base.length);
};

// URL'en fryses pr. montering: skifter src midt i visningen fra netværks- til blob-URL, genindlæses
// og genstartes mediet (fx en video, der re-renderes, når klippet slutter).
export const useCachedUrl = (url: string) => useState(() => cachedUrl(url))[0];

export function useAsset(path: string): string;
export function useAsset(path: string | undefined): string | undefined;
export function useAsset(path: string | undefined): string | undefined {
  return useState(() => (path === undefined ? undefined : cachedUrl(asset(path))))[0];
}

export const fileExtension = (path: string): string =>
  (path.split(/[?#]/)[0] ?? path).split(".").pop()?.toLowerCase() ?? "";
