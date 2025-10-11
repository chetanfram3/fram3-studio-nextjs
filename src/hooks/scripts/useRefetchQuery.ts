import { useQueryClient } from "@tanstack/react-query";

export const useRefetchQuery = () => {
  const queryClient = useQueryClient();

  const invalidateAndRefetch = async (queryKey: unknown[]) => {
    if (!queryKey || !Array.isArray(queryKey)) {
      console.error("Invalid queryKey provided to invalidateAndRefetch.");
      return;
    }

    try {
      queryClient.invalidateQueries({ queryKey }); // Invalidate the cache for the specific query
      await queryClient.refetchQueries({ queryKey }); // Force an immediate refetch
    } catch (error) {
      console.error(`Error refetching query ${queryKey}:`, error);
    }
  };

  return { invalidateAndRefetch };
};
