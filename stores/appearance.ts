import { debounce } from "@/utils/tools";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Store = {
  isMobile: boolean;
  sideBarIsOpen: boolean;
  welcomeModalIsOpen: boolean;
  welcomeModalIsReabled: boolean;
  setSideBarIsOpen: (isOpen: boolean) => void;
  setWelcomeModalIsOpen: (isOpen: boolean) => void;
  setWelcomeModalIsReabled: (isReabled: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
};

export const checkIsMobile = (): boolean => {
  if (typeof window !== "undefined") {
    const ua = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const screenWidth = window.innerWidth <= 767;
    const touchSupport =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    return ua || (screenWidth && touchSupport);
  }
  return false;
};

export const useAppearanceStore = create<Store>()(
  persist(
    (set) => ({
      isMobile: checkIsMobile(),
      sideBarIsOpen: false,
      welcomeModalIsOpen: false,
      welcomeModalIsReabled: false,
      setSideBarIsOpen: (isOpen: boolean) => set({ sideBarIsOpen: isOpen }),
      setWelcomeModalIsOpen: (isOpen: boolean) =>
        set({ welcomeModalIsOpen: isOpen }),
      setWelcomeModalIsReabled: (isReabled: boolean) =>
        set({ welcomeModalIsReabled: isReabled }),
      setIsMobile: (isMobile: boolean) => set({ isMobile }),
    }),
    { name: "appearance", storage: createJSONStorage(() => localStorage) }
  )
);

if (typeof window !== "undefined") {
  let resizeListenerAdded = false;

  const addResizeListener = () => {
    if (!resizeListenerAdded) {
      window.addEventListener(
        "resize",
        debounce(() => {
          const isMobile = checkIsMobile();
          useAppearanceStore.getState().setIsMobile(isMobile);

          useAppearanceStore.getState().setSideBarIsOpen(!isMobile);
        }, 500)
      );
      resizeListenerAdded = true;
    }
  };

  addResizeListener();
}
