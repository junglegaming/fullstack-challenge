import { useToastStore } from "../stores/toast-store";

export function Toasts() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <button
          className={`toast toast-${toast.type}`}
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          type="button"
        >
          <strong>{toast.title}</strong>
          {toast.message ? <span>{toast.message}</span> : null}
        </button>
      ))}
    </div>
  );
}
