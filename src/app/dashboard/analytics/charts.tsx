"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Area, AreaChart, CartesianGrid } from "recharts";

interface AnalyticsChartsProps {
    choresByMember: { name: string; completed: number; image: string | null }[];
    activityTrend: { name: string; count: number }[];
}

export function AnalyticsCharts({ choresByMember, activityTrend }: AnalyticsChartsProps) {
    // Custom colors for the bars
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

    return (
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
            {/* Leaderboard Chart */}
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle>🏆 Choreo Champions</CardTitle>
                    <CardDescription>Total chores completed by each member</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={choresByMember} layout="vertical" margin={{ left: 0, right: 12 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={88}
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(name: string) => name.length > 14 ? `${name.slice(0, 13)}…` : name}
                                    interval={0}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="completed" radius={[0, 4, 4, 0]}>
                                    {choresByMember.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Trend Chart */}
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle>📈 Weekly Hustle</CardTitle>
                    <CardDescription>Chores completed over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityTrend}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
