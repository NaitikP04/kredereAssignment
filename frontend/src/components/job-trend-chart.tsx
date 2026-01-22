'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/types';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

async function fetchJobHistory(): Promise<Job[]> {
  // Fetch a larger batch to calculate trends (e.g., last 100 jobs)
  const res = await fetch('/api/jobs?limit=100');
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export function JobTrendChart() {
  const { data: jobs } = useQuery({
    queryKey: ['job-history'],
    queryFn: fetchJobHistory,
  });

  // Data Processing: Group jobs by date for the last 7 days
  const data = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i); // Go back 6 days up to today
    
    // Count how many jobs match this specific date
    const count = jobs?.filter((job) => 
      isSameDay(parseISO(job.created_at), date)
    ).length || 0;

    return {
      date: format(date, 'MMM dd'), // e.g., "Oct 24"
      count: count,
    };
  });

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Weekly Volume</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                padding={{ left: 10, right: 10 }} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                activeDot={{ r: 6 }}  
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}