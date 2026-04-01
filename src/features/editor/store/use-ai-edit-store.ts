import { create } from "zustand";

interface AiEditState {
  isProcessing: boolean;
  status: string;
  error: string | null;
  result: any | null;
  captionStyle: string;
  setProcessing: (isProcessing: boolean) => void;
  setStatus: (status: string) => void;
  setError: (error: string | null) => void;
  setResult: (result: any | null) => void;
  setCaptionStyle: (style: string) => void;
  reset: () => void;
}

const useAiEditStore = create<AiEditState>((set) => ({
  isProcessing: false,
  status: "",
  error: null,
  result: null,
  captionStyle: "bold-highlight",
  setProcessing: (isProcessing) => set({ isProcessing }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  setCaptionStyle: (captionStyle) => set({ captionStyle }),
  reset: () =>
    set({ isProcessing: false, status: "", error: null, result: null }),
}));

export default useAiEditStore;
