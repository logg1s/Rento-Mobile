import { create } from "zustand";

type ChatState = {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
};

const useChatStore = create<ChatState>()((set) => ({
  currentChatId: null,
  setCurrentChatId: (id) => set({ currentChatId: id }),
}));

export default useChatStore;
