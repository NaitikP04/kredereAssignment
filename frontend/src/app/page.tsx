import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/dashboard-stats';
import { RecentJobs } from '@/components/recent-jobs';
import { JobTrendChart } from '@/components/job-trend-chart';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your distributed job queue system.
          </p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </Link>
      </div>
      
      <DashboardStats />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Recent Jobs</h3>
              <Link href="/jobs">
                <Button variant="ghost" size="sm">
                  View All Jobs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <RecentJobs />
        </div>
        
        <JobTrendChart />
      </div>
    </div>
  );
}