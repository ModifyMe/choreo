"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    const [items, setItems] = useState<ShoppingItem[]>(initialItems);
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
                    console.log('Realtime update:', payload);
                    if (payload.eventType === 'INSERT') {
                        const newItem = payload.new as ShoppingItem;
                        setItems((prev) => {
                            // 1. Check if already exists (deduplication)
                            if (prev.some(i => i.id === newItem.id)) return prev;

                            // 2. Check for matching optimistic item to replace
                            const optimisticMatch = prev.find(i =>
                                i.id.startsWith('optimistic-') &&
                                i.name === newItem.name
                            );

                            if (optimisticMatch) {
                                return prev.map(i => i.id === optimisticMatch.id ? newItem : i);
                            }

                            // 3. Otherwise add new
                            return [newItem, ...prev];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedItem = payload.new as ShoppingItem;
                        setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item)));
                    } else if (payload.eventType === 'DELETE') {
                        setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [householdId]);

    const addItem = async (name: string) => {
        const tempId = `optimistic-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticItem: ShoppingItem = {
            id: tempId,
            householdId,
            name,
            checked: false,
            addedById: "me", // Placeholder
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setItems((prev) => [optimisticItem, ...prev]);

        try {
            const res = await fetch("/api/shopping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ householdId, name }),
            });

            if (!res.ok) throw new Error("Failed to add item");

            const newItem = await res.json();
            // Replace optimistic item with real one (if it still exists)
            setItems((prev) => prev.map((item) => (item.id === tempId ? newItem : item)));
        } catch (error) {
            toast.error("Failed to add item");
            setItems((prev) => prev.filter((item) => item.id !== tempId));
        }
    };

    const toggleItem = async (id: string, checked: boolean) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked } : item)));

        try {
            await fetch(`/api/shopping/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ checked }),
            });
        } catch (error) {
            toast.error("Failed to update item");
            setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !checked } : item)));
        }
    };

    const deleteItem = async (id: string) => {
        const originalItems = [...items];
        setItems((prev) => prev.filter((item) => item.id !== id));

        try {
            await fetch(`/api/shopping/${id}`, {
                method: "DELETE",
            });
        } catch (error) {
            toast.error("Failed to delete item");
            setItems(originalItems);
        }
    };

    const clearChecked = async () => {
        // This is a bit complex for optimistic updates if we delete many.
        // Let's just do it server side and let realtime handle it, or simple optimistic.
        const checkedIds = items.filter(i => i.checked).map(i => i.id);
        const originalItems = [...items];
        setItems(prev => prev.filter(i => !i.checked));

        try {
            // We need a bulk delete endpoint or loop. Loop is easier for now.
            await Promise.all(checkedIds.map(id => fetch(`/api/shopping/${id}`, { method: "DELETE" })));
            toast.success("Cleared checked items");
        } catch (error) {
            toast.error("Failed to clear items");
            setItems(originalItems);
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
