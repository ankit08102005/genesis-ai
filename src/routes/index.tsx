import { createFileRoute } from "@tanstack/react-router";
import { GenesisApp } from "../components/genesis/genesis-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Genesis AI — Project Intelligence" },
      { name: "description", content: "Persistent project intelligence, impact analysis and specialized AI agents for serious software teams." },
      { property: "og:title", content: "Genesis AI — Project Intelligence" },
      { property: "og:description", content: "Understand the blast radius before your code changes ship." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GenesisApp,
});
