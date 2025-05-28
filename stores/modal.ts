import { create } from "zustand";

type Store = {
  isShowCreateCommunity: boolean;
  setIsShowCreateCommunity: (isShow: boolean) => void;
  isShowCreateThread: boolean;
  setIsShowCreateThread: (isShow: boolean) => void;
};

export const useModalStore = create<Store>()((set) => ({
  isShowCreateCommunity: false,
  setIsShowCreateCommunity: (isShow: boolean) =>
    set({ isShowCreateCommunity: isShow }),
  isShowCreateThread: false,
  setIsShowCreateThread: (isShow: boolean) =>
    set({ isShowCreateThread: isShow }),
}));
