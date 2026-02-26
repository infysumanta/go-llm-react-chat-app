import * as React from "react";
import { cn } from "@/lib/utils";

interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex w-full flex-col rounded-xl border border-gray-700 bg-gray-800 transition-colors focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500/50",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSubmit?: () => void;
}

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(({ className, onSubmit, onChange, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const autoResize = React.useCallback(() => {
    const el = internalRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      autoResize();
      onChange?.(e);
    },
    [autoResize, onChange],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
      }
    },
    [onSubmit],
  );

  return (
    <textarea
      ref={setRefs}
      rows={1}
      className={cn(
        "w-full resize-none bg-transparent px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none",
        className,
      )}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PromptInputActions = React.forwardRef<
  HTMLDivElement,
  PromptInputActionsProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-end gap-2 px-3 pb-2", className)}
    {...props}
  >
    {children}
  </div>
));
PromptInputActions.displayName = "PromptInputActions";

export { PromptInput, PromptInputTextarea, PromptInputActions };
