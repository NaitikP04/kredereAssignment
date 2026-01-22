import { DashboardStats } from '@/components/dashboard-stats';
import { RecentJobs } from '@/components/recent-jobs';
import { JobTrendChart } from '@/components/job-trend-chart';

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your distributed job queue system.
        </p>
      </div>
      
      <DashboardStats />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
            <h3 className="mb-4 text-xl font-semibold">Recent Jobs</h3>
            <RecentJobs />
        </div>
        
        <JobTrendChart />
      </div>
    </div>
  );
}