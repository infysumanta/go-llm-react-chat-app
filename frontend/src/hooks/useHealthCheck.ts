import { useQuery } from "@tanstack/react-query";

import { checkHealth } from "@/api";

export function useHealthCheck(): boolean | null {
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    refetchInterval: 30000,
  });
  return data ?? null;
}
