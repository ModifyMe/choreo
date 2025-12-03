'use client'

import { cn } from '@/lib/utils'
import {
    SupabaseQueryHandler,
    SupabaseTableData,
    SupabaseTableName,
    useInfiniteQuery,
} from '@/hooks/use-infinite-query'
import * as React from 'react'

interface InfiniteListProps<TableName extends SupabaseTableName> {
    tableName: TableName
    columns?: string
    pageSize?: number
    trailingQuery?: SupabaseQueryHandler<TableName>
    renderItem: (item: SupabaseTableData<TableName>, index: number) => React.ReactNode
    className?: string
    renderNoResults?: () => React.ReactNode
    renderEndMessage?: () => React.ReactNode
    renderSkeleton?: (count: number) => React.ReactNode
    realtime?: boolean
    realtimeFilter?: { column: string; value: string | number }
}

const DefaultNoResults = () => (
    <div className="text-center text-muted-foreground py-10">No results.</div>
)

const DefaultEndMessage = () => (
    <div className="text-center text-muted-foreground py-4 text-sm">You&apos;ve reached the end.</div>
)

const defaultSkeleton = (count: number) => (
    <div className="flex flex-col gap-2 px-4">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="h-4 w-full bg-muted animate-pulse rounded" />
        ))}
    </div>
)

export function InfiniteList<TableName extends SupabaseTableName>({
    tableName,
    columns = '*',
    pageSize = 20,
    trailingQuery,
    renderItem,
    className,
    renderNoResults = DefaultNoResults,
    renderEndMessage = DefaultEndMessage,
    renderSkeleton = defaultSkeleton,
    realtime = false,
    realtimeFilter,
}: InfiniteListProps<TableName>) {
    const { data, isFetching, hasMore, fetchNextPage, isSuccess, error } = useInfiniteQuery({
        tableName,
        columns,
        pageSize,
        trailingQuery,
        realtime,
        realtimeFilter,
    })

    // Ref for the scrolling container
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)

    // Intersection observer logic - target the last rendered *item* or a dedicated sentinel
    const loadMoreSentinelRef = React.useRef<HTMLDivElement>(null)
    const observer = React.useRef<IntersectionObserver | null>(null)

    React.useEffect(() => {
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetching) {
                    fetchNextPage()
                }
            },
            {
                root: scrollContainerRef.current,
                threshold: 0.1,
                rootMargin: '0px 0px 100px 0px',
            }
        )

        if (loadMoreSentinelRef.current) {
            observer.current.observe(loadMoreSentinelRef.current)
        }

        return () => {
            if (observer.current) observer.current.disconnect()
        }
    }, [isFetching, hasMore, fetchNextPage])

    return (
        <div ref={scrollContainerRef} className={cn('relative h-full overflow-auto max-h-[500px]', className)}>
            <div className="space-y-4">
                {isSuccess && data.length === 0 && !isFetching && renderNoResults()}

                {data.map((item, index) => renderItem(item, index))}

                {isFetching && renderSkeleton && renderSkeleton(pageSize)}

                {error ? (
                    <div className="text-center text-red-500 py-4 text-sm">
                        Error: {error.message}
                    </div>
                ) : (
                    <div ref={loadMoreSentinelRef} style={{ height: '1px' }} />
                )}

                {!hasMore && !error && data.length > 0 && renderEndMessage()}
            </div>
        </div>
    )
}
