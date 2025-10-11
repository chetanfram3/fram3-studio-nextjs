import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteScriptVersion } from '@/services/scriptService';
import type { DeleteVersionParams } from '@/types/scripts';

export function useVersionDelete() {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async (params: DeleteVersionParams) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteScriptVersion(params);
      
      if (response.success) {
        // Invalidate and refetch relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['scripts'] }),
          queryClient.invalidateQueries({ 
            queryKey: ['scriptDetails', params.scriptId] 
          })
        ]);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete version');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    handleDelete,
    isDeleting,
    error
  };
}