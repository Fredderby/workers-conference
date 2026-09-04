import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toProperCase(input: string): string {
  if (!input) return input;
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part
            .split("'")
            .map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p))
            .join("'")
        )
        .join("-")
    )
    .join(" ");
}
