"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ShoppingItem {
    id: string;
    householdId: string;
    name: string;
    checked: boolean;
    addedById: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    addedBy?: {
        name: string | null;
        image: string | null;
    };
}

interface ShoppingListContextType {
    items: ShoppingItem[];
    addItem: (name: string) => Promise<void>;
    toggleItem: (id: string, checked: boolean) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    clearChecked: () => Promise<void>;
    loading: boolean;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export function ShoppingListProvider({
    children,
    initialItems,
    householdId,
}: {
    children: ReactNode;
    initialItems: ShoppingItem[];
    householdId: string;
}) {
    const { data: items = [], mutate } = useSWR<ShoppingItem[]>(
        `/api/shopping?householdId=${householdId}`,
        fetcher,
        {
            fallbackData: initialItems,
            revalidateOnFocus: false,
        }
    );
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel(`shopping-list-${householdId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ShoppingItem',
                    filter: `householdId=eq.${householdId}`,
                },
                (payload) => {
                    // Realtime update received
                    mutate((currentItems: ShoppingItem[] | undefined) => {
                        const prev = currentItems || [];
                        if (payload.eventType === 'INSERT') {
                            const newItem = payload.new as ShoppingItem;
                            // Deduplication
                            if (prev.some(i => i.id === newItem.id)) return prev;

                            // Check for matching optimistic item to replace
                            const optimisticMatch = prev.find(i =>
                                i.id.startsWith('optimistic-') &&
                                i.name === newItem.name
                            );

                            if (optimisticMatch) {
                                // Preserve addedBy from optimistic item since realtime payload lacks it
                                const mergedItem = { ...newItem, addedBy: optimisticMatch.addedBy };
                                return prev.map(i => i.id === optimisticMatch.id ? mergedItem : i);
                            }
                            return [newItem, ...prev];
                        } else if (payload.eventType === 'UPDATE') {
                            const updatedItem = payload.new as ShoppingItem;
                            return prev.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
                        } else if (payload.eventType === 'DELETE') {
                            return prev.filter((item) => item.id !== payload.old.id);
                        }
                        return prev;
                    }, false); // false = do not revalidate immediately
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [householdId, mutate]);

    const addItem = async (name: string) => {
        const tempId = `optimistic-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticItem: ShoppingItem = {
            id: tempId,
            householdId,
            name,
            checked: false,
            addedById: "me",
            createdAt: new Date(),
            updatedAt: new Date(),
            addedBy: {
                name: "Me", // Optimistic name
                image: null
            }
        };

        mutate((prev: ShoppingItem[] | undefined) => [optimisticItem, ...(prev || [])], false);

        try {
            const res = await fetch("/api/shopping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ householdId, name }),
            });

            if (!res.ok) throw new Error("Failed to add item");

            const newItem = await res.json();
            mutate((prev: ShoppingItem[] | undefined) => {
                const list = prev || [];
                // Check if we still have the optimistic item (tempId)
                const hasOptimistic = list.some(i => i.id === tempId);

                if (hasOptimistic) {
                    return list.map((item) => (item.id === tempId ? newItem : item));
                }

                // If not, maybe realtime already replaced it with the real ID?
                // In that case, update it to ensure we have the full data (like addedBy)
                return list.map((item) => (item.id === newItem.id ? newItem : item));
            }, false);
        } catch (error) {
            toast.error("Failed to add item");
            mutate((prev: ShoppingItem[] | undefined) => (prev || []).filter((item) => item.id !== tempId), false);
        }
    };

    const toggleItem = async (id: string, checked: boolean) => {
        mutate((prev: ShoppingItem[] | undefined) => (prev || []).map((item) => (item.id === id ? { ...item, checked } : item)), false);

        try {
            await fetch(`/api/shopping/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ checked }),
            });
        } catch (error) {
            toast.error("Failed to update item");
            mutate((prev: ShoppingItem[] | undefined) => (prev || []).map((item) => (item.id === id ? { ...item, checked: !checked } : item)), false);
        }
    };

    const deleteItem = async (id: string) => {
        const originalItems = items;
        mutate((prev: ShoppingItem[] | undefined) => (prev || []).filter((item) => item.id !== id), false);

        try {
            await fetch(`/api/shopping/${id}`, {
                method: "DELETE",
            });
        } catch (error) {
            toast.error("Failed to delete item");
            mutate(originalItems, false);
        }
    };

    const clearChecked = async () => {
        const checkedIds = items.filter(i => i.checked).map(i => i.id);
        const originalItems = items;
        mutate((prev: ShoppingItem[] | undefined) => (prev || []).filter(i => !i.checked), false);

        try {
            await Promise.all(checkedIds.map(id => fetch(`/api/shopping/${id}`, { method: "DELETE" })));
            toast.success("Cleared checked items");
        } catch (error) {
            toast.error("Failed to clear items");
            mutate(originalItems, false);
        }
    }

    return (
        <ShoppingListContext.Provider value={{ items, addItem, toggleItem, deleteItem, clearChecked, loading }}>
            {children}
        </ShoppingListContext.Provider>
    );
}

export function useShoppingList() {
    const context = useContext(ShoppingListContext);
    if (context === undefined) {
        throw new Error("useShoppingList must be used within a ShoppingListProvider");
    }
    return context;
}
