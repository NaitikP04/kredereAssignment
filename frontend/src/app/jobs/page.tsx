'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { DateRange } from 'react-day-picker';
import { RowSelectionState } from "@tanstack/react-table";
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    RefreshCw, 
    Mail, 
    FileText, 
    Bell, 
    X,
    Trash2 
} from 'lucide-react';

import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';

import { Job } from '@/types';
import { useDebounce } from '@/hooks/use-debounce';

// --- FETCHER ---
async function fetchJobs(params: URLSearchParams) {
  const res = await fetch(`/api/jobs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export default function JobsPage() {
  const queryClient = useQueryClient();

  // --- STATE ---
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  // Filters
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); 

  // Selection
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // --- QUERY PARAMS ---
  const queryParams = new URLSearchParams();
  queryParams.set('limit', pageSize.toString());
  queryParams.set('offset', ((page - 1) * pageSize).toString());

  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (dateRange?.from) queryParams.set('start_date', dateRange.from.toISOString());
  if (dateRange?.to) queryParams.set('end_date', dateRange.to.toISOString());
  
  statusFilters.forEach(s => queryParams.append('status', s));
  typeFilters.forEach(t => queryParams.append('type', t));

  // --- FETCH ---
  const { data: jobs = [], isLoading, isError } = useQuery<Job[]>({
    queryKey: ['jobs', debouncedSearch, Array.from(statusFilters), Array.from(typeFilters), page, pageSize, dateRange], 
    queryFn: () => fetchJobs(queryParams),
  });

  // --- BULK ACTION LOGIC ---
  const selectedIds = Object.keys(rowSelection);

  const handleBulkCancel = async () => {
    if (!confirm(`Are you sure you want to cancel ${selectedIds.length} jobs?`)) return;
    
    // Delete all selected jobs in parallel
    await Promise.all(selectedIds.map(id => fetch(`/api/jobs/${id}`, { method: 'DELETE' })));
    
    setRowSelection({}); // Clear selection
    queryClient.invalidateQueries({ queryKey: ['jobs'] }); // Refresh table
  };

  const handleBulkRetry = async () => {
    // Find the actual job objects from the data
    const selectedJobs = jobs.filter(job => rowSelection[job.id]);
    
    // Only retry failed/completed jobs
    const retryableJobs = selectedJobs.filter(job => job.status === 'failed' || job.status === 'completed');
    
    if (retryableJobs.length === 0) {
        alert("No retryable jobs selected (only failed or completed jobs can be retried).");
        return;
    }

    if (!confirm(`Retry ${retryableJobs.length} jobs?`)) return;

    // Retry (clone) jobs in parallel
    await Promise.all(retryableJobs.map(job => 
        fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: job.type,
                priority: job.priority,
                payload: job.payload
            }),
        })
    ));

    setRowSelection({});
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  // --- CONSTANTS ---
  const statuses = [
    { value: "pending", label: "Pending", icon: Clock },
    { value: "processing", label: "Processing", icon: RefreshCw },
    { value: "completed", label: "Completed", icon: CheckCircle2 },
    { value: "failed", label: "Failed", icon: XCircle },
  ];
  
  const types = [
    { value: "email", label: "Email", icon: Mail },
    { value: "report", label: "Report", icon: FileText },
    { value: "notification", label: "Notification", icon: Bell },
  ];

  const isFiltered = statusFilters.size > 0 || typeFilters.size > 0 || search.length > 0 || !!dateRange?.from;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
        <p className="text-muted-foreground">
          Manage and monitor all background tasks.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2 overflow-auto pb-2 sm:pb-0">
            <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 w-[150px] lg:w-[250px]"
            />
            
            <DataTableFacetedFilter
                title="Status"
                options={statuses}
                selectedValues={statusFilters}
                onSelect={(vals) => { setStatusFilters(vals); setPage(1); }}
            />
            
            <DataTableFacetedFilter
                title="Type"
                options={types}
                selectedValues={typeFilters}
                onSelect={(vals) => { setTypeFilters(vals); setPage(1); }}
            />

            <DatePickerWithRange date={dateRange} setDate={setDateRange} />

            {isFiltered && (
                <Button
                    variant="ghost"
                    onClick={() => {
                        setStatusFilters(new Set());
                        setTypeFilters(new Set());
                        setSearch("");
                        setDateRange(undefined);
                        setPage(1);
                    }}
                    className="h-8 px-2 lg:px-3"
                >
                    Reset
                    <X className="ml-2 h-4 w-4" />
                </Button>
            )}
        </div>

        <Select 
            value={pageSize.toString()} 
            onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}
        >
            <SelectTrigger className="w-[70px] h-8">
                <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* --- BULK ACTION BAR (NEW) --- */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-slate-50 px-4 py-2 rounded-md flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <span className="text-sm font-medium">
                {selectedIds.length} job(s) selected
            </span>
            <div className="flex gap-2">
                <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={handleBulkRetry}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Selected
                </Button>
                <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={handleBulkCancel}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel Selected
                </Button>
            </div>
        </div>
      )}

      {/* Table Area */}
      {isLoading ? (
        <div className="h-24 flex items-center justify-center text-muted-foreground">
          Loading jobs...
        </div>
      ) : isError ? (
        <div className="text-red-500">Failed to load jobs.</div>
      ) : (
        <DataTable 
            columns={columns} 
            data={jobs} 
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
        />
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
            Page {page}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={jobs.length < pageSize} 
        >
          Next
        </Button>
      </div>
    </div>
  );
}