import { QueryClient } from '@tanstack/react-query';

const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute
const DEFAULT_CACHE_TIME = 5 * DEFAULT_STALE_TIME;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: DEFAULT_STALE_TIME,
            gcTime: DEFAULT_CACHE_TIME,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

export default queryClient;

