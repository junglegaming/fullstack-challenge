import { create } from "zustand";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "info";
};

type ToastState = {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }].slice(-5),
    }));
    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((item) => item.id !== id),
      }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
