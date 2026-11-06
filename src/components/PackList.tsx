"use client";

import { FunctionComponent, useEffect, useState } from "react";
import { QUIZZES } from "../quizzes";
import { asset } from "../asset";

export const PackList: FunctionComponent<{ name: string }> = ({ name }) => (
  <div className="min-h-screen bg-night text-snow font-body p-10">
    <h1 className="font-display text-highlight text-6xl mb-4">Ukendt quiz: {name}</h1>
    <p className="mb-2">Vælg en quiz:</p>
    <ul className="list-disc pl-6">
      {[...QUIZZES.keys()].map((pack) => (
        <li key={pack}>
          <a className="text-highlight underline" href={asset(`/${pack}`)}>
            {pack}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export const UnknownPack: FunctionComponent = () => {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.location.pathname
      .replace(import.meta.env.BASE_URL, "")
      .replace(/\/+$/, "");
    try {
      setName(decodeURIComponent(raw));
    } catch {
      setName(raw);
    }
  }, []);

  if (name === null) return <div className="bg-night h-screen" />;
  return <PackList name={name} />;
};
