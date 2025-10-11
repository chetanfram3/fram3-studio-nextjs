// hooks/useGenScriptsList.ts
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { GridSortModel, GridFilterModel, GridCallbackDetails } from '@mui/x-data-grid';
import {
    fetchAllGeneratedScripts,
    fetchGeneratedScriptsFilterOptions,
    fetchGeneratedScriptsSummary,
    updateGeneratedScript,
    analyzeGeneratedScript,
    FetchGeneratedScriptsParams,
    GeneratedScriptsListResponse,
    GeneratedScriptsFilterOptionsResponse,
    GeneratedScriptsSummaryResponse,
    PaginationModel,
    SortModel,
    FilterModel,
    UpdateGeneratedScriptParams,
    AnalyzeGeneratedScriptParams,
} from '@/services/scriptService';

interface UseGenScriptsListOptions {
    initialPageSize?: number;
    initialPage?: number; // Added this
    initialSortField?: string;
    initialSortOrder?: 'asc' | 'desc';
    includeVersions?: boolean;
    includeAnalysisDetails?: boolean;
    initialFilter?: FilterModel;
}

/**
 * Hook to manage generated scripts list with MUI Data Grid v8 compatibility
 */
export function useGenScriptsList(options: UseGenScriptsListOptions = {}) {
    const queryClient = useQueryClient();

    // MUI Data Grid state - now using initialPage
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({
        page: options.initialPage || 0, // Added initialPage support
        pageSize: options.initialPageSize || 10,
    });

    const [sortModel, setSortModel] = useState<GridSortModel>([
        {
            field: options.initialSortField || 'createdAt',
            sort: options.initialSortOrder || 'desc',
        },
    ]);

    const [filterModel, setFilterModel] = useState<GridFilterModel>(
        options.initialFilter || { items: [] }
    );

    // Build query params - convert MUI types to our API types
    const queryParams: FetchGeneratedScriptsParams = useMemo(() => ({
        paginationModel,
        sortModel: sortModel as SortModel[], // Safe cast since structure is compatible
        filterModel: filterModel as FilterModel, // Safe cast since structure is compatible
        includeVersions: options.includeVersions || false,
        includeAnalysisDetails: options.includeAnalysisDetails || false,
    }), [paginationModel, sortModel, filterModel, options.includeVersions, options.includeAnalysisDetails]);

    // Main query for scripts list
    const scriptsQuery = useQuery<GeneratedScriptsListResponse>({
        queryKey: ['generatedScriptsList', queryParams],
        queryFn: () => fetchAllGeneratedScripts(queryParams),
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });

    // Query for filter options
    const filterOptionsQuery = useQuery<GeneratedScriptsFilterOptionsResponse>({
        queryKey: ['generatedScriptsFilterOptions'],
        queryFn: fetchGeneratedScriptsFilterOptions,
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });

    // Query for summary statistics
    const summaryQuery = useQuery<GeneratedScriptsSummaryResponse>({
        queryKey: ['generatedScriptsSummary'],
        queryFn: fetchGeneratedScriptsSummary,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 15, // 15 minutes
    });

    // Update script mutation
    const updateScriptMutation = useMutation({
        mutationFn: (params: UpdateGeneratedScriptParams) => updateGeneratedScript(params),
        onSuccess: (data, variables) => {
            // Invalidate list and specific script queries
            queryClient.invalidateQueries({ queryKey: ['generatedScriptsList'] });
            queryClient.invalidateQueries({ queryKey: ['generatedScript', variables.genScriptId] });
            queryClient.invalidateQueries({ queryKey: ['generatedScriptsSummary'] });
        },
    });

    // Analyze script mutation
    const analyzeScriptMutation = useMutation({
        mutationFn: (params: AnalyzeGeneratedScriptParams) => analyzeGeneratedScript(params),
        onSuccess: (data, variables) => {
            // Invalidate list and specific script queries
            queryClient.invalidateQueries({ queryKey: ['generatedScriptsList'] });
            queryClient.invalidateQueries({ queryKey: ['generatedScript', variables.genScriptId] });
            queryClient.invalidateQueries({ queryKey: ['generatedScriptsSummary'] });
        },
    });

    // Handlers for MUI Data Grid
    const handlePaginationModelChange = useCallback((newModel: PaginationModel) => {
        setPaginationModel(newModel);
    }, []);

    const handleSortModelChange = useCallback((newModel: GridSortModel) => {
        setSortModel(newModel);
    }, []);

    const handleFilterModelChange = useCallback((newModel: GridFilterModel) => {
        setFilterModel(newModel);
    }, []);

    // Refresh functions
    const refreshScripts = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['generatedScriptsList'] });
    }, [queryClient]);

    const refreshFilterOptions = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['generatedScriptsFilterOptions'] });
    }, [queryClient]);

    const refreshSummary = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['generatedScriptsSummary'] });
    }, [queryClient]);

    const refreshAll = useCallback(() => {
        refreshScripts();
        refreshFilterOptions();
        refreshSummary();
    }, [refreshScripts, refreshFilterOptions, refreshSummary]);

    // Computed values
    const rows = scriptsQuery.data?.data.rows || [];
    const rowCount = scriptsQuery.data?.data.rowCount || 0;
    const loading = scriptsQuery.isLoading || scriptsQuery.isFetching;
    const error = scriptsQuery.error;

    const filterOptions = filterOptionsQuery.data?.data || {
        projects: [],
        brands: [],
        statuses: [],
        modes: [],
    };

    const summary = summaryQuery.data?.data || null;

    return {
        // Data
        rows,
        rowCount,
        loading,
        error,
        filterOptions,
        summary,

        // MUI Data Grid state
        paginationModel,
        sortModel,
        filterModel,

        // MUI Data Grid handlers
        onPaginationModelChange: handlePaginationModelChange,
        onSortModelChange: handleSortModelChange,
        onFilterModelChange: handleFilterModelChange,

        // Mutations
        updateScript: updateScriptMutation.mutate,
        updateScriptAsync: updateScriptMutation.mutateAsync,
        isUpdatingScript: updateScriptMutation.isPending,
        updateScriptError: updateScriptMutation.error,

        analyzeScript: analyzeScriptMutation.mutate,
        analyzeScriptAsync: analyzeScriptMutation.mutateAsync,
        isAnalyzingScript: analyzeScriptMutation.isPending,
        analyzeScriptError: analyzeScriptMutation.error,

        // Refresh functions
        refreshScripts,
        refreshFilterOptions,
        refreshSummary,
        refreshAll,

        // Query states
        isLoadingFilterOptions: filterOptionsQuery.isLoading,
        isLoadingSummary: summaryQuery.isLoading,
        filterOptionsError: filterOptionsQuery.error,
        summaryError: summaryQuery.error,

        // Helper functions
        getScriptById: useCallback((id: string) => {
            return rows.find((row) => row.id === id);
        }, [rows]),

        getAnalyzedScripts: useCallback(() => {
            return rows.filter((row) => row.analysisGenerated);
        }, [rows]),

        getPendingScripts: useCallback(() => {
            return rows.filter((row) => row.status === 'pending');
        }, [rows]),
    };
}

/**
 * Hook specifically for MUI Data Grid integration
 */
export function useGenScriptsDataGrid(options: UseGenScriptsListOptions = {}) {
    const {
        rows,
        rowCount,
        loading,
        error,
        paginationModel,
        sortModel,
        filterModel,
        onPaginationModelChange,
        onSortModelChange,
        onFilterModelChange,
        ...rest
    } = useGenScriptsList(options);

    // Return props that can be directly spread to MUI DataGrid
    return {
        // Data Grid props
        rows,
        rowCount,
        loading,
        error: error?.message,

        // Pagination
        paginationMode: 'server' as const,
        paginationModel,
        onPaginationModelChange,
        pageSizeOptions: [5, 10, 25, 50],

        // Sorting
        sortingMode: 'server' as const,
        sortModel,
        onSortModelChange: (model: GridSortModel, details: GridCallbackDetails) => {
            onSortModelChange(model);
        },

        // Filtering
        filterMode: 'server' as const,
        filterModel,
        onFilterModelChange: (model: GridFilterModel, details: GridCallbackDetails) => {
            onFilterModelChange(model);
        },

        // Other Data Grid props
        disableRowSelectionOnClick: true,
        autoHeight: false,
        density: 'comfortable' as const,

        // Additional data and methods
        ...rest,
    };
}