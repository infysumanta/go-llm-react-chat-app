import { useQuery } from "@tanstack/react-query";

import { fetchModels } from "@/api";

export function useModels() {
  return useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
  });
}
