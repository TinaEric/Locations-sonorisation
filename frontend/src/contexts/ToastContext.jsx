// src/contexts/ToastContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const POSITIONS = {
  top: "toast-top toast-center",
  bottom: "toast-bottom toast-center",
  "top-start": "toast-top toast-start",
  "top-end": "toast-top toast-end",
  "bottom-start": "toast-bottom toast-start",
  "bottom-end": "toast-bottom toast-end",
};

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16),
  );
}

const NOOP_HANDLE = {
  at: () => NOOP_HANDLE,
  top: () => NOOP_HANDLE,
  bottom: () => NOOP_HANDLE,
  topStart: () => NOOP_HANDLE,
  topEnd: () => NOOP_HANDLE,
  bottomStart: () => NOOP_HANDLE,
  bottomEnd: () => NOOP_HANDLE,
  show: () => NOOP_HANDLE,
  id: "noop",
};

function makeFallbackToast() {
  const make =
    (type) =>
    (message, opts) => {
      if (type === "error") console.error("[toast error]", message, opts ?? "");
      else if (type === "warning")
        console.warn("[toast warning]", message, opts ?? "");
      else console.info(`[toast ${type}]`, message, opts ?? "");
      return NOOP_HANDLE;
    };
  return {
    success: make("success"),
    error: make("error"),
    info: make("info"),
    warning: make("warning"),
  };
}

export function ToastProvider({ children, position = "top" }) {
  const [toasts, setToasts] = useState([]);

  const commit = useCallback((toastData) => {
    setToasts((t) => [...t, toastData]);
    const duration = toastData.duration ?? 4000;
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== toastData.id)),
      duration,
    );
  }, []);

  const createHandle = useCallback(
    (type, message, opts = {}) => {
      const id = generateId();
      const duration = opts.duration ?? 4000;

      const state = {
        id,
        type,
        message,
        duration,
        position: opts.position || position,
        committed: false,
      };

      queueMicrotask(() => {
        if (state.committed) return;
        state.committed = true;
        commit({
          id: state.id,
          type: state.type,
          message: state.message,
          position: state.position,
          duration: state.duration,
        });
      });

      const applyAt = (pos) => {
        state.position = pos;
        if (state.committed) return state;
        state.committed = true;
        commit({
          id: state.id,
          type: state.type,
          message: state.message,
          position: pos,
          duration: state.duration,
        });
        return state;
      };

      return {
        at: (pos) => applyAt(pos),
        top: () => applyAt("top"),
        bottom: () => applyAt("bottom"),
        topStart: () => applyAt("top-start"),
        topEnd: () => applyAt("top-end"),
        bottomStart: () => applyAt("bottom-start"),
        bottomEnd: () => applyAt("bottom-end"),
        show: () => applyAt(state.position),
        id: state.id,
      };
    },
    [commit, position],
  );

  const toast = useMemo(
    () => ({
      success: (m, opts) => createHandle("success", m, opts),
      error: (m, opts) => createHandle("error", m, opts),
      info: (m, opts) => createHandle("info", m, opts),
      warning: (m, opts) => createHandle("warning", m, opts),
    }),
    [createHandle],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.map((t) => {
        const Icon = ICONS[t.type] ?? Info;
        const posClass = POSITIONS[t.position] || POSITIONS.top;
        return (
          <div key={t.id} className={`toast ${posClass} z-[9999]`}>
            <div className={`alert alert-${t.type} shadow-lg`}>
              <Icon size={18} />
              <span>{t.message}</span>
            </div>
          </div>
        );
      })}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  console.warn(
    "[useToast] Aucun ToastProvider détecté. Fallback console activé.",
  );
  return makeFallbackToast();
};