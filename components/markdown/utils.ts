export const cleanContent = (content: string) => {
  return content
    .replace(/&#x20;/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/<u>|<\/u>/g, "")
    .replace(/\*\*\*\*/g, "")
    .trim();
};
