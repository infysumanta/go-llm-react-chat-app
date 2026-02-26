import { useState, useEffect, useRef } from "react";

export function useHealthCheck(intervalMs = 30000) {
  const [isOnline, setIsOnline] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setIsOnline(data.status === "ok");
      } catch {
        setIsOnline(false);
      }
    };

    check();
    intervalRef.current = setInterval(check, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [intervalMs]);

  return isOnline;
}
