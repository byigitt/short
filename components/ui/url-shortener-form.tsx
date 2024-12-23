'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { urlSchema, type UrlInput } from '@/lib/validations/url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils/url';
import { CopyIcon, LinkIcon, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export function UrlShortenerForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null); 2
  const [analyticsUrl, setAnalyticsUrl] = useState<string | null>(null);
  const [date, setDate] = useState<Date>();

  const form = useForm<UrlInput>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: '',
      customAlias: '',
    },
  });

  async function onSubmit(data: UrlInput) {
    try {
      setIsLoading(true);
      const payload = {
        ...data,
        customAlias: data.customAlias?.trim() || undefined,
        expiresAt: date?.toISOString(),
      };

      const response = await fetch('/api/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log(result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to shorten URL');
      }

      setShortUrl(result.shortUrl);
      setAnalyticsUrl(result.analyticsUrl);
      toast({
        title: 'Success!',
        description: 'Your URL has been shortened.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Copied!',
        description: 'URL copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl p-6 space-y-6 bg-white/50 dark:bg-black/50 backdrop-blur-lg border-neutral-200/50 dark:border-neutral-800/50">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Enter your long URL"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customAlias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Alias (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter custom alias" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Shortening...' : 'Shorten URL'}
          </Button>
        </form>
      </Form>

      {shortUrl && (
        <div className="pt-4 space-y-4 divide-y divide-border">
          <div className="space-y-2">
            <Label>Your URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={shortUrl}
                className="bg-muted/50 dark:bg-muted/20 font-medium"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(shortUrl)}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Label>Analytics URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={`${analyticsUrl}`}
                className="bg-muted/50 dark:bg-muted/20 font-medium"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const analyticsUrl = `${window.location.origin}/a/${shortUrl.split('/').pop()}`;
                  copyToClipboard(analyticsUrl);
                }}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this URL to let others view the analytics for your shortened link.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
} 