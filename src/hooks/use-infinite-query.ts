import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'

export type SupabaseTableName = 'ActivityLog' | 'Chore' | 'Reward' // Add other tables as needed
export type SupabaseTableData<T extends SupabaseTableName> = any // We can refine this with generated types later

export type SupabaseQueryHandler<T extends SupabaseTableName> = (
    query: any
) => any

interface UseInfiniteQueryProps<T extends SupabaseTableName> {
    tableName: T
    columns?: string
    pageSize?: number
    trailingQuery?: SupabaseQueryHandler<T>
}

export function useInfiniteQuery<T extends SupabaseTableName>({
    tableName,
    columns = '*',
    pageSize = 20,
    trailingQuery,
}: UseInfiniteQueryProps<T>) {
    const [data, setData] = useState<SupabaseTableData<T>[]>([])
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
                setData((prev) => [...prev, ...newData])

                // Check if we reached the end
                if (newData.length < pageSize || (count !== null && data.length + newData.length >= count)) {
                    setHasMore(false)
                } else {
                    setPage(prev => prev + 1)
                }
            }
        } catch (err) {
            console.error('Error fetching infinite query:', err)
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsFetching(false)
        }
    }, [tableName, columns, pageSize, trailingQuery, page, isFetching, hasMore, data.length, supabase])

    // Initial fetch
    useEffect(() => {
        // Only fetch if we have no data and haven't fetched yet (page 0)
        // Or we can just rely on the component calling fetchNextPage initially via intersection observer?
        // Usually infinite scroll hooks fetch the first page automatically.
        if (page === 0 && data.length === 0 && !isFetching && hasMore) {
            fetchNextPage()
        }
    }, []) // Empty dependency array to run once on mount? 
    // Actually, fetchNextPage depends on state, so we can't easily put it in useEffect without infinite loops if not careful.
    // Let's rely on the IntersectionObserver in the UI component to trigger the first load if the list is empty/sentinel is visible.
    // BUT, if the list is empty, the sentinel IS visible.

    // Let's add a reset function if needed, e.g. if filters change
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
