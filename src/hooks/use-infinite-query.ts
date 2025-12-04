import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'

export type SupabaseTableName = 'ActivityLog' | 'Chore' | 'Reward' // Add other tables as needed

interface RecordWithId {
    id: string;
    [key: string]: unknown;
}

export type SupabaseQueryHandler<T extends SupabaseTableName> = (
    query: any
) => any

interface UseInfiniteQueryProps<T extends SupabaseTableName> {
    tableName: T
    columns?: string
    pageSize?: number
    trailingQuery?: SupabaseQueryHandler<T>
    realtime?: boolean
    realtimeFilter?: { column: string; value: string | number }
}

export function useInfiniteQuery<T extends SupabaseTableName>({
    tableName,
    columns = '*',
    pageSize = 20,
    trailingQuery,
    realtime = false,
    realtimeFilter,
}: UseInfiniteQueryProps<T>) {
    const [data, setData] = useState<RecordWithId[]>([])
    const [isFetching, setIsFetching] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const [error, setError] = useState<Error | null>(null)

    // Use the singleton client
    // const supabase = createClient()

    const fetchNextPage = useCallback(async () => {
        if (isFetching || !hasMore) return

        setIsFetching(true)
        setError(null)

        try {
            const from = page * pageSize
            const to = from + pageSize - 1

            let query = supabase
                .from(tableName)
                .select(columns, { count: 'exact' })
                .range(from, to)

            if (trailingQuery) {
                query = trailingQuery(query)
            }

            const { data: newData, error: supabaseError, count } = await query

            if (supabaseError) {
                throw supabaseError
            }

            if (newData) {
                setData((prev) => {
                    // If page is 0, we might be refreshing or initial load.
                    // If we have existing data and we are appending, standard spread.
                    // However, with realtime, we might have prepended items.
                    // Ideally, we should deduplicate based on ID if possible.
                    // For now, simple append is fine for infinite scroll, but let's be careful.
                    // Actually, if we prepend realtime items, they are "newer".
                    // Pagination fetches "older" items.
                    // So appending is correct.
                    // BUT, if a realtime item was just added, it might also appear in the fetched page 
                    // if the pagination offset shifts?
                    // Yes, duplicate risk exists.
                    // Let's filter out duplicates by ID.

                    const existingIds = new Set(prev.map((item) => item.id));
                    const uniqueNewData = (newData as unknown as RecordWithId[]).filter((item) => !existingIds.has(item.id));
                    return [...prev, ...uniqueNewData];
                })

                // Check if we reached the end
                if (newData.length < pageSize || (count !== null && data.length + newData.length >= count)) {
                    setHasMore(false)
                } else {
                    setPage(prev => prev + 1)
                }
            }
        } catch (err) {
            // Error fetching infinite query - logged for debugging
            setError(err instanceof Error ? err : new Error(JSON.stringify(err)))
        } finally {
            setIsFetching(false)
        }
    }, [tableName, columns, pageSize, trailingQuery, page, isFetching, hasMore, data.length, supabase])

    // Initial fetch
    useEffect(() => {
        if (page === 0 && data.length === 0 && !isFetching && hasMore) {
            fetchNextPage()
        }
    }, [])

    // Real-time Subscription
    useEffect(() => {
        if (!realtime) return;

        const channel = supabase
            .channel(`realtime-${tableName}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: tableName,
                    filter: realtimeFilter ? `${realtimeFilter.column}=eq.${realtimeFilter.value}` : undefined,
                },
                async (payload) => {
                    // Fetch the full record with relations
                    const { data: fetchedRecord, error } = await supabase
                        .from(tableName)
                        .select(columns)
                        .eq('id', (payload.new as RecordWithId).id)
                        .single();

                    if (fetchedRecord && !error) {
                        const record = fetchedRecord as unknown as RecordWithId;
                        setData((prev) => {
                            // Deduplicate just in case
                            if (prev.some((item) => item.id === record.id)) {
                                return prev;
                            }
                            return [record, ...prev];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableName, realtime, realtimeFilter?.column, realtimeFilter?.value, columns]);

    const reset = useCallback(() => {
        setData([])
        setPage(0)
        setHasMore(true)
        setIsFetching(false)
    }, [])

    return {
        data,
        isFetching,
        hasMore,
        fetchNextPage,
        isSuccess: !error,
        error,
        reset
    }
}
