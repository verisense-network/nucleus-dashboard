import { createContext, useContext } from "react";
import { Mention } from "./AddMention";

const context = createContext<{
  accounts: Mention[];
  setAccounts: (accounts: Mention[]) => void;
}>({
  accounts: [],
  setAccounts: () => {},
});

export const MentionProvider = context.Provider;

export const useMentions = () => useContext(context);
