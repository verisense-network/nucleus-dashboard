import { ethers } from "ethers";
import bs58 from "bs58";
import { CHAIN } from "./chain";
import { isBase58Encoded } from "./tools";

export function extractMarkdownImages(markdownText: string): string[] {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  const imageUrls: string[] = [];
  let match;

  while ((match = imageRegex.exec(markdownText)) !== null) {
    imageUrls.push(match[2]);
  }

  return imageUrls;
}

export function extractMentions(markdownText: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;

  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(markdownText)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

export function mentionsToAccountId(mentions: string[]): Uint8Array[] {
  const accounts: Uint8Array[] = [];

  mentions.forEach((mention) => {
    if (CHAIN === "SOL" && isBase58Encoded(mention)) {
      accounts.push(bs58.decode(mention));
    } else if (CHAIN === "BSC" && ethers.isAddress(mention)) {
      accounts.push(ethers.toBeArray(mention));
    }
  });

  return accounts;
}
