'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { JobStats } from '@/types';

async function fetchStats(): Promise<JobStats[]> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['job-stats'],
    queryFn: fetchStats,
    // Refresh every 5 seconds for that "Real-Time Dashboard" feel
    refetchInterval: 5000, 
  });

  if (isLoading) {
    return <StatsSkeleton />;
  }

  // Helper to safely get counts (Postgres sometimes returns counts as strings)
  const getCount = (status: string) => {
    const item = stats?.find((s) => s.status === status);
    return item ? parseInt(item.count.toString()) : 0;
  };

  const completed = getCount('completed');
  const failed = getCount('failed');
  const pending = getCount('pending');
  const processing = getCount('processing');
  
  const totalJobs = completed + failed + pending + processing;
  
    const finishedJobs = completed + failed;
    const successRate = finishedJobs > 0 
        ? Math.round((completed / finishedJobs) * 100) 
        : 100; // Default to 100% (or 0%) if nothing has finished yet
        
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Jobs Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalJobs}</div>
          <p className="text-xs text-muted-foreground">
            {processing} currently active
          </p>
        </CardContent>
      </Card>

      {/* Success Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate}%</div>
          <p className="text-xs text-muted-foreground">
            {completed} completed jobs
          </p>
        </CardContent>
      </Card>

      {/* Pending Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pending}</div>
          <p className="text-xs text-muted-foreground">
            Waiting in queue
          </p>
        </CardContent>
      </Card>

      {/* Failed Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{failed}</div>
          <p className="text-xs text-muted-foreground">
            Needs attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// A loading skeleton to show while fetching data
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}