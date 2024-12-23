'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils/url';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BarChart3,
  Globe2,
  MousePointerClick,
  Calendar,
  Link as LinkIcon,
  ArrowLeft,
  ExternalLink,
  Monitor,
  Smartphone,
  Bot,
  Globe,
  Clock,
  Share2,
  TrendingUp,
  QrCode,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Analytics {
  device: string;
  userAgent: {
    browser: string;
    version: string;
    os: string;
    platform: string;
  };
  referrer: string;
  referrerDomain?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  language?: string;
  isBot: boolean;
  protocol: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  timestamp: string;
  ipAddress: string;
}

interface UrlData {
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
  analytics: Analytics[];
}

function getDeviceIcon(device: string) {
  switch (device) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Smartphone className="h-4 w-4" />;
    case 'desktop':
      return <Monitor className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

function calculateDeviceStats(analytics: Analytics[]) {
  const devices = analytics.reduce((acc, curr) => {
    if (!curr.isBot) {
      acc[curr.device] = (acc[curr.device] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(devices).reduce((a, b) => a + b, 0);
  return Object.entries(devices).map(([device, count]) => ({
    device,
    count,
    percentage: total ? Math.round((count / total) * 100) : 0,
  }));
}

function calculateTopReferrers(analytics: Analytics[]) {
  const referrers = analytics.reduce((acc, curr) => {
    if (curr.referrerDomain && !curr.isBot) {
      acc[curr.referrerDomain] = (acc[curr.referrerDomain] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(referrers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
}

function calculateClicksByDay(analytics: Analytics[]) {
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const dailyClicks = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: format(day, 'MMM d'),
      total: analytics.filter(a =>
        format(new Date(a.timestamp), 'yyyy-MM-dd') === dayStr
      ).length,
      human: analytics.filter(a =>
        format(new Date(a.timestamp), 'yyyy-MM-dd') === dayStr && !a.isBot
      ).length,
      bot: analytics.filter(a =>
        format(new Date(a.timestamp), 'yyyy-MM-dd') === dayStr && a.isBot
      ).length,
    };
  });

  return dailyClicks;
}

function calculateHourlyDistribution(analytics: Analytics[]) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,
  }));

  analytics.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours();
    hours[hour].count++;
  });

  return hours;
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8 space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        </div>

        <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* URL Info Card */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full max-w-md bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full max-w-md bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-[250px] sm:h-[300px] bg-muted rounded animate-pulse" />
                </div>
              </Card>
            ))}
          </div>

          {/* Device and Referrer Stats */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-muted rounded animate-pulse" />
                        <div className="h-2 w-full bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Click History */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 w-full bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const params = useParams();
  const shortCode = params?.shortCode as string;
  const [data, setData] = useState<UrlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!shortCode) return;

      try {
        const response = await fetch(`/api/analytics/${shortCode}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [shortCode]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <Card className="max-w-md p-6 space-y-6">
          <div className="space-y-2 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              No Analytics Data
            </h2>
            <p className="text-muted-foreground">
              {error || "We couldn't find any analytics data for this URL. The URL might not exist or hasn't been clicked yet."}
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const deviceStats = calculateDeviceStats(data.analytics);
  const topReferrers = calculateTopReferrers(data.analytics);
  const humanClicks = data.analytics.filter(a => !a.isBot).length;
  const botClicks = data.analytics.filter(a => a.isBot).length;
  const dailyClicks = calculateClicksByDay(data.analytics);
  const hourlyDistribution = calculateHourlyDistribution(data.analytics);

  const clickTrendsData: ChartData<'line'> = {
    labels: dailyClicks.map(d => d.date),
    datasets: [
      {
        label: 'Total Clicks',
        data: dailyClicks.map(d => d.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Human Clicks',
        data: dailyClicks.map(d => d.human),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Bot Clicks',
        data: dailyClicks.map(d => d.bot),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const hourlyData: ChartData<'bar'> = {
    labels: hourlyDistribution.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: 'Clicks by Hour',
        data: hourlyDistribution.map(h => h.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-6 sm:mb-8 space-y-2">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-blue-600 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">URL Analytics</h1>
        </div>

        <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    Original URL
                  </h2>
                  <a
                    href={data.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 transition-colors flex items-center gap-2 break-all"
                  >
                    {data.originalUrl}
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </a>
                </div>

                <div className="flex items-center justify-center h-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/a/${data.shortCode}`);
                      toast({
                        title: "Copied!",
                        description: "Analytics URL copied to clipboard",
                      });
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share Analytics
                  </Button>
                </div>

                <div className="space-y-1 flex flex-col items-end">
                  <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    Short URL
                  </h2>
                  <a
                    href={data.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-muted-foreground hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    {data.shortUrl}
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MousePointerClick className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Human Clicks</p>
                  <p className="text-lg sm:text-2xl font-bold">{humanClicks}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Bot className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Bot Clicks</p>
                  <p className="text-lg sm:text-2xl font-bold">{botClicks}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Created At</p>
                  <p className="text-xs sm:text-sm font-medium">{formatDate(new Date(data.createdAt))}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <QrCode className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">QR Code</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs sm:text-sm font-medium"
                    onClick={() => {
                      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.shortUrl)}`, '_blank');
                    }}
                  >
                    View QR Code
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                Click Trends (Last 7 Days)
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                <Line data={clickTrendsData} options={chartOptions} />
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                Clicks by Hour
              </h3>
              <div className="h-[250px] sm:h-[300px]">
                <Bar data={hourlyData} options={barChartOptions} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                Device Distribution
              </h3>
              <div className="space-y-4">
                {deviceStats.map(({ device, count, percentage }) => (
                  <div key={device} className="flex items-center gap-3 sm:gap-4">
                    <div className="w-6 sm:w-8">{getDeviceIcon(device)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs sm:text-sm font-medium capitalize">{device}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                Top Referrers
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {topReferrers.length > 0 ? (
                  topReferrers.map(([domain, count]) => (
                    <div key={domain} className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium">{domain}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{count} clicks</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">No referrer data available</p>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <Globe2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              Click History
            </h2>
            {data.analytics.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-[640px] px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Device</TableHead>
                        <TableHead className="text-xs sm:text-sm">Browser</TableHead>
                        <TableHead className="text-xs sm:text-sm">OS</TableHead>
                        <TableHead className="text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.analytics.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs sm:text-sm">{formatDate(new Date(entry.timestamp))}</TableCell>
                          <TableCell className="text-xs sm:text-sm capitalize">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(entry.device)}
                              {entry.device}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {entry.userAgent.browser} {entry.userAgent.version}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {entry.userAgent.os} {entry.userAgent.platform}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              {entry.isBot ? (
                                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                              ) : (
                                <MousePointerClick className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                              )}
                              {entry.isBot ? 'Bot' : 'Human'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-xs">
                            {entry.utm?.source || entry.referrerDomain || 'Direct'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-sm text-muted-foreground">
                No clicks recorded yet. Share your URL to start tracking!
              </div>
            )}
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
} 