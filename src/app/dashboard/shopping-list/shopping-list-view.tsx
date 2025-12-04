"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShoppingList } from "./shopping-list-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ShoppingCart, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function ShoppingListView() {
    const { items, addItem, toggleItem, deleteItem, clearChecked } = useShoppingList();
    const [newItemName, setNewItemName] = useState("");
    const router = useRouter();

    useEffect(() => {
        router.prefetch("/dashboard");
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        addItem(newItemName);
        setNewItemName("");
    };

    const checkedCount = items.filter(i => i.checked).length;

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <ShoppingCart className="w-5 h-5" />
                    Shopping List
                </CardTitle>
                {checkedCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearChecked} className="text-muted-foreground hover:text-destructive">
                        Clear {checkedCount} checked
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        placeholder="Add item (e.g. Milk, Eggs)..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={!newItemName.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                    </Button>
                </form>

                <div className="space-y-2">
                    <AnimatePresence initial={false}>
                        {items.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-muted-foreground border border-dashed rounded-lg"
                            >
                                Your shopping list is empty.
                            </motion.div>
                        ) : (
                            items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className={`flex items-center justify-between p-3 rounded-lg border group ${item.checked ? "bg-muted/50" : "bg-card"}`}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <Checkbox
                                            checked={item.checked}
                                            onCheckedChange={(checked) => toggleItem(item.id, checked as boolean)}
                                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                        />
                                        <div className="flex flex-col">
                                            <span className={`font-medium transition-all ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                                                {item.name}
                                            </span>
                                            {item.addedBy?.name && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    Added by {item.addedBy.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteItem(item.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
