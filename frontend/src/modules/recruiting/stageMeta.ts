import type { CandidateStage } from "./api";

export interface StageMeta {
  solid: string;
  gradient: string;
  soft: string;
  className: string;
}

export const STAGE_META: Record<CandidateStage, StageMeta> = {
  Applied: {
    solid: "#4361ee",
    gradient: "linear-gradient(135deg, #4361ee, #3a56d4)",
    soft: "#4361ee1a",
    className: "stage-applied",
  },
  Screened: {
    solid: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    soft: "#8b5cf61a",
    className: "stage-screened",
  },
  Interview: {
    solid: "#ff6f4f",
    gradient: "linear-gradient(135deg, #ff9d42, #ff6f4f)",
    soft: "#ff6f4f1a",
    className: "stage-interview",
  },
  Offer: {
    solid: "#14b8a6",
    gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
    soft: "#14b8a61a",
    className: "stage-offer",
  },
  Hired: {
    solid: "#22c55e",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    soft: "#22c55e1a",
    className: "stage-hired",
  },
  Rejected: {
    solid: "#f43f5e",
    gradient: "linear-gradient(135deg, #fb7185, #e11d48)",
    soft: "#f43f5e1a",
    className: "stage-rejected",
  },
};

export const SOURCE_PALETTE = [
  "#4361ee",
  "#8b5cf6",
  "#ff6f4f",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#f43f5e",
  "#0ea5e9",
];

export function colorForIndex(i: number): string {
  return SOURCE_PALETTE[i % SOURCE_PALETTE.length];
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}