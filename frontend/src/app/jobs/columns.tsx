'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Job } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

// This defines the shape of our data for the table
export const columns: ColumnDef<Job>[] = [
    {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: 'Job ID',
    cell: ({ row }) => (
      <div className="w-[80px] truncate font-mono text-xs">
        {row.getValue('id')}
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('type')}</Badge>,
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const priority = parseInt(row.getValue('priority'));
        return (
            <div className="flex pl-4">
                {[...Array(priority)].map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary mx-0.5" />
                ))}
            </div>
        )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: string = row.getValue('status');
      const colors: Record<string, string> = {
        pending: 'text-yellow-600 bg-yellow-100',
        processing: 'text-blue-600 bg-blue-100',
        completed: 'text-green-600 bg-green-100',
        failed: 'text-red-600 bg-red-100',
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(row.getValue('created_at')), { addSuffix: true })}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const job = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(job.id)}>
              Copy ID
            </DropdownMenuItem>
            
            {/* 3. Add the Link Wrapper here */}
            <Link href={`/jobs/${job.id}`}>
                <DropdownMenuItem>
                    View Details
                </DropdownMenuItem>
            </Link>
            
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];