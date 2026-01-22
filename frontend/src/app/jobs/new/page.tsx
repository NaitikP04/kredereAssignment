'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; 
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// --- ZOD SCHEMAS ---

// Base Schema
const jobFormSchema = z.object({
  type: z.enum(['email', 'report', 'notification']),
  priority: z.enum(['1', '2', '3', '4', '5']), // Radio group returns strings usually
  scheduled_for: z.date().optional(),
  // Dynamic Payloads
  payload: z.record(z.string(), z.any()), // Validate this manually or strictly in the types below
});

// Specific Payload Schemas (for validation logic)
const emailSchema = z.object({
  to: z.email({ message: "Invalid email address" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  body: z.string().min(1, { message: "Body is required" }),
});

const reportSchema = z.object({
  report_type: z.string().min(1, "Report type is required"),
  format: z.enum(['pdf', 'csv']),
  date_range: z.object({
    start: z.string(), // We'll handle dates as ISO strings in payload
    end: z.string()
  }).optional() 
});

const notificationSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  channel: z.enum(['push', 'sms', 'email']),
  message: z.string().min(1, "Message is required"),
});

export default function CreateJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Define Form
  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      type: 'email',
      priority: '3',
      payload: {}, // Initial empty payload
    },
  });

  // Watch the type to render dynamic fields
  const jobType = form.watch('type');

  // 2. Submit Handler
  async function onSubmit(values: z.infer<typeof jobFormSchema>) {
    setIsSubmitting(true);
    
    try {
        // Manual Payload Validation based on Type
        let payloadData = {};
        const rawPayload = values.payload; // This will come from the dynamic inputs

        if (values.type === 'email') {
            payloadData = emailSchema.parse(rawPayload);
        } else if (values.type === 'report') {
            // For report, we might hardcode values if inputs aren't perfect yet
            payloadData = { ...rawPayload, format: rawPayload.format || 'pdf' };
        } else if (values.type === 'notification') {
            payloadData = notificationSchema.parse(rawPayload);
        }

        const body = {
            type: values.type,
            priority: parseInt(values.priority),
            scheduled_for: values.scheduled_for?.toISOString(),
            payload: payloadData
        };

        const res = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Failed to create job");

        const newJob = await res.json();
        // toast.success("Job created successfully");
        router.push(`/jobs/${newJob.id}`);

    } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Failed to create job";
        alert(message);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create New Job</h2>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Job Configuration</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    {/* JOB TYPE */}
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Job Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a job type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="report">Report</SelectItem>
                                        <SelectItem value="notification">Notification</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Different types require different payload parameters.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* PRIORITY (1-5) */}
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Priority</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex space-x-4"
                                    >
                                        {[1, 2, 3, 4, 5].map((p) => (
                                            <FormItem key={p} className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={p.toString()} />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    {p}
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* SCHEDULING */}
                    <FormField
                        control={form.control}
                        name="scheduled_for"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Schedule For (Optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date()
                                            }
                                            autoFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-medium mb-4">Payload Details</h3>
                        
                        {/* DYNAMIC FIELDS BASED ON TYPE */}
                        {jobType === 'email' && (
                            <div className="space-y-4">
                                <FormItem>
                                    <FormLabel>Recipient Email</FormLabel>
                                    <FormControl>
                                        <Input {...form.register('payload.to')} placeholder="user@example.com" />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <Input {...form.register('payload.subject')} placeholder="Welcome!" />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Body</FormLabel>
                                    <FormControl>
                                        <Textarea {...form.register('payload.body')} placeholder="Hello world..." />
                                    </FormControl>
                                </FormItem>
                            </div>
                        )}

                        {jobType === 'report' && (
                            <div className="space-y-4">
                                <FormItem>
                                    <FormLabel>Report Type</FormLabel>
                                    <FormControl>
                                        <Input {...form.register('payload.report_type')} placeholder="Monthly Sales" />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Format</FormLabel>
                                    <Select onValueChange={(val) => form.setValue('payload.format', val)}>
                                        <SelectTrigger><SelectValue placeholder="PDF" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="csv">CSV</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            </div>
                        )}

                        {jobType === 'notification' && (
                            <div className="space-y-4">
                                <FormItem>
                                    <FormLabel>User ID</FormLabel>
                                    <FormControl>
                                        <Input {...form.register('payload.user_id')} placeholder="U-12345" />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Channel</FormLabel>
                                    <Select onValueChange={(val) => form.setValue('payload.channel', val)}>
                                        <SelectTrigger><SelectValue placeholder="Select Channel" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="sms">SMS</SelectItem>
                                            <SelectItem value="push">Push</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Input {...form.register('payload.message')} placeholder="You have a new alert" />
                                    </FormControl>
                                </FormItem>
                            </div>
                        )}
                    </div>

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Job
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}