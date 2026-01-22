'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Job } from '@/types';
import { formatDistanceToNow } from 'date-fns';

async function fetchRecentJobs(): Promise<Job[]> {
  // Fetch the last 10 jobs for the dashboard
  const res = await fetch('/api/jobs?limit=10');
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export function RecentJobs() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: fetchRecentJobs,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <RecentJobsSkeleton />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs?.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {job.id.slice(0, 8)}...
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {job.type}
                </Badge>
              </TableCell>
              <TableCell>
                <StatusBadge status={job.status} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {[...Array(job.priority)].map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
          {jobs?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No jobs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
  };
  
  // Safe fallback for unknown statuses
  const className = styles[status as keyof typeof styles] || 'bg-gray-100';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {status}
    </span>
  );
}

function RecentJobsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}