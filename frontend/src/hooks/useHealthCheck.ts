import { useEffect, useRef, useState } from "react";

export function useHealthCheck(intervalMs = 30000): boolean | null {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health");
        const data: { status: string } = await res.json();
        setIsOnline(data.status === "ok");
      } catch {
        setIsOnline(false);
      }
    };

    check();
    intervalRef.current = setInterval(check, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs]);

  return isOnline;
}
