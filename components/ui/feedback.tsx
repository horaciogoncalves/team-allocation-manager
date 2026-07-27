"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface FeedbackMessage {
  id: string;
  type: "success" | "error";
  message: string;
}

interface FeedbackContextValue {
  announce: (message: string, type?: "success" | "error") => void;
  messages: FeedbackMessage[];
  dismiss: (id: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const announce = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setMessages((prev) => [...prev, { id, type, message }]);
      const timeout = setTimeout(() => {
        dismiss(id);
      }, 5000);
      timeoutsRef.current.set(id, timeout);
    },
    [dismiss]
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  return (
    <FeedbackContext.Provider value={{ announce, messages, dismiss }}>
      {children}
      <FeedbackRegion messages={messages} onDismiss={dismiss} />
    </FeedbackContext.Provider>
  );
}

function FeedbackRegion({
  messages,
  onDismiss,
}: {
  messages: FeedbackMessage[];
  onDismiss: (id: string) => void;
}) {
  const latestMessage = messages[messages.length - 1];
  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {latestMessage ? latestMessage.message : ""}
      </div>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {messages.map((message) => (
          <div
            key={message.id}
            role="status"
            className={`pointer-events-auto p-4 rounded-lg shadow-lg border text-sm max-w-sm ${
              message.type === "error"
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300"
                : "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:border-green-900/50 dark:text-green-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {message.type === "error" ? (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span>{message.message}</span>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(message.id)}
                className="text-xs font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 rounded p-0.5 shrink-0"
                aria-label="Dismiss message"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
