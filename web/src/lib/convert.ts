import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export function mdToHtml(md: string): string {
  return marked.parse(md ?? "") as string;
}

export function htmlToMd(html: string): string {
  return turndown.turndown(html ?? "");
}

export function mdToText(md: string): string {
  // Simple fallback: strip markdown via HTML then textContent
  const html = mdToHtml(md ?? "");
  if (typeof window === "undefined") {
    // server: naive strip tags
    return (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

export function textToMd(text: string): string {
  // Minimal: wrap as plain text (no formatting)
  return text ?? "";
}

