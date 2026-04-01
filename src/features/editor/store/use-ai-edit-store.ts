import { create } from "zustand";

interface AiEditState {
  isProcessing: boolean;
  status: string;
  error: string | null;
  result: any | null;
  setProcessing: (isProcessing: boolean) => void;
  setStatus: (status: string) => void;
  setError: (error: string | null) => void;
  setResult: (result: any | null) => void;
  reset: () => void;
}

const useAiEditStore = create<AiEditState>((set) => ({
  isProcessing: false,
  status: "",
  error: null,
  result: null,
  setProcessing: (isProcessing) => set({ isProcessing }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  reset: () =>
    set({ isProcessing: false, status: "", error: null, result: null }),
}));

export default useAiEditStore;
