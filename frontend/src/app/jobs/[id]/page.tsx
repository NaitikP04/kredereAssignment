'use client';

import { use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RefreshCw, XCircle, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Job } from '@/types';
import { format } from 'date-fns';
import { useState } from 'react';
import { PriorityUpdater } from "@/components/priority-updater";
// import { toast } from 'sonner'; // Uncomment if you installed sonner

// Fetch single job
async function fetchJob(id: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${id}`);
  if (!res.ok) throw new Error('Job not found');
  return res.json();
}

// Cancel job
async function cancelJob(id: string) {
  const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to cancel job');
}

// Retry job (Create a copy)
async function retryJob(job: Job) {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: job.type,
      priority: job.priority,
      payload: job.payload,
    }),
  });
  if (!res.ok) throw new Error('Failed to retry job');
  return res.json();
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);

  // 1. Fetch Data
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJob(id),
    refetchInterval: 2000, // Poll every 2s to see status updates live
  });

  // 2. Mutations (Actions)
  const cancelMutation = useMutation({
    mutationFn: cancelJob,
    onSuccess: () => {
      // toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      router.push('/jobs'); // Go back to list
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryJob,
    onSuccess: (newJob) => {
      // toast.success('Job retried');
      router.push(`/jobs/${newJob.id}`); // Go to the new job
    },
  });

  

  if (isLoading) return <div className="p-8">Loading job details...</div>;
  if (error || !job) return <div className="p-8 text-red-500">Job not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header / Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="flex gap-2">
            <PriorityUpdater 
            jobId={job.id} 
            currentPriority={job.priority}
            status={job.status}
            />

            {/* Context Sensitive Buttons */}
            {job.status === 'pending' && (
                <Button 
                    variant="destructive" 
                    onClick={() => cancelMutation.mutate(job.id)}
                    disabled={cancelMutation.isPending}
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Job
                </Button>
            )}
            
            {(job.status === 'failed' || job.status === 'completed') && (
                <Button 
                    onClick={() => retryMutation.mutate(job)}
                    disabled={retryMutation.isPending}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Job
                </Button>
            )}
        </div>
      </div>

      {/* Main Info Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                Job Details
                                <StatusBadge status={job.status} />
                            </CardTitle>
                            <p className="text-muted-foreground font-mono mt-2 text-sm">{job.id}</p>
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1 capitalize">
                            {job.type}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Collapsible JSON Viewers */}
                    <CollapsibleJson title="Payload" data={job.payload} defaultOpen={true} />

                    {job.result && (
                        <CollapsibleJson title="Result" data={job.result} variant="light" />
                    )}
                    
                    {job.error && (
                        <div className="p-4 bg-red-50 text-red-900 rounded-md border border-red-200">
                            <h3 className="font-bold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Error Details
                            </h3>
                            <p className="mt-1 text-sm font-mono">{job.error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                <CardContent>
                    <Timeline job={job} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Priority</span>
                        <span className="font-medium">{job.priority}/5</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Attempts</span>
                        <span className="font-medium">{job.attempts}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">
                             {format(new Date(job.created_at), 'MMM dd, HH:mm')}
                        </span>
                    </div>
                    {job.completed_at && (
                        <>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Completed</span>
                            <span className="font-medium">
                                {format(new Date(job.completed_at), 'HH:mm:ss')}
                            </span>
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-components for visual polish

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        processing: 'bg-blue-100 text-blue-800 border-blue-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        failed: 'bg-red-100 text-red-800 border-red-200',
    };
    const className = styles[status] || 'bg-gray-100';
    return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${className}`}>
            {status}
        </span>
    );
}

function Timeline({ job }: { job: Job }) {
    const steps = [
        { status: 'pending', label: 'Created', icon: Clock, done: true },
        { status: 'processing', label: 'Processing', icon: RefreshCw, done: job.status !== 'pending' },
        { 
            status: 'completed', 
            label: job.status === 'failed' ? 'Failed' : 'Completed', 
            icon: job.status === 'failed' ? XCircle : CheckCircle2, 
            done: job.status === 'completed' || job.status === 'failed' 
        },
    ];

    return (
        <div className="relative pl-2 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 my-2">
            {steps.map((step, i) => {
                const isActive = step.status === job.status;
                const isPast = step.done;
                
                return (
                    <div key={step.status} className="relative pl-6">
                        <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-background 
                            ${isPast ? 'border-primary bg-primary' : 'border-slate-300'}
                            ${isActive ? 'ring-4 ring-primary/20' : ''}
                        `} />
                        <div className="flex flex-col">
                            <span className={`text-sm font-medium ${isPast ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.label}
                            </span>
                            {isActive && (
                                <span className="text-xs text-primary animate-pulse">
                                    Current Stage
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Collapsible JSON Viewer Component
function CollapsibleJson({ 
    title, 
    data, 
    defaultOpen = false,
    variant = 'dark'
}: { 
    title: string; 
    data: unknown; 
    defaultOpen?: boolean;
    variant?: 'dark' | 'light';
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    const bgClass = variant === 'dark' 
        ? 'bg-slate-950 text-slate-50' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100';
    
    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 font-semibold mb-2 hover:text-primary transition-colors"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
                {title}
            </button>
            {isOpen && (
                <div className={`${bgClass} p-4 rounded-md font-mono text-sm overflow-auto max-h-[300px]`}>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}