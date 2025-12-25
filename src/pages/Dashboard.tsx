import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Shield,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { api, subscribeToEvents } from '@/lib/api';
import type { DashboardStats, InspectionRecord } from '@/types';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, inspectionsData] = await Promise.all([
        api.getDashboardStats(),
        api.getInspections({
          plate: searchPlate || undefined,
          status: statusFilter !== 'all' ? (statusFilter as 'Safe' | 'Unsafe') : undefined,
          pageSize: 10,
        }),
      ]);
      setStats(statsData);
      setInspections(inspectionsData.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchPlate, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToEvents<InspectionRecord>('inspection.created', (inspection) => {
      setInspections((prev) => [inspection, ...prev.slice(0, 9)]);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalInspections: prev.totalInspections + 1,
              safeCount: inspection.status === 'Safe' ? prev.safeCount + 1 : prev.safeCount,
              unsafeCount: inspection.status === 'Unsafe' ? prev.unsafeCount + 1 : prev.unsafeCount,
              alertsPending:
                inspection.status === 'Unsafe' ? prev.alertsPending + 1 : prev.alertsPending,
            }
          : null
      );
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Real-time tire inspection monitoring</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Inspections"
              value={stats?.totalInspections || 0}
              subtitle="Today"
              icon={Activity}
              trend={{ value: 12, positive: true }}
              glowClass="stat-glow-primary"
            />
            <StatCard
              title="Safe Vehicles"
              value={stats?.safeCount || 0}
              subtitle={`${stats ? ((stats.safeCount / (stats.totalInspections || 1)) * 100).toFixed(1) : 0}% pass rate`}
              icon={Shield}
              iconClass="text-safe"
              glowClass="stat-glow-safe"
            />
            <StatCard
              title="Unsafe Detected"
              value={stats?.unsafeCount || 0}
              subtitle={`${stats?.alertsPending || 0} pending alerts`}
              icon={AlertTriangle}
              iconClass="text-unsafe"
              glowClass="stat-glow-unsafe"
              pulse={Boolean(stats?.alertsPending)}
            />
            <StatCard
              title="Avg. Processing"
              value={`${stats?.avgProcessingLatency || 0}ms`}
              subtitle="Response time"
              icon={Clock}
            />
          </>
        )}
      </div>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Inspections</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plate..."
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  className="pl-9 w-40"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Safe">Safe</SelectItem>
                  <SelectItem value="Unsafe">Unsafe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : inspections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inspections found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow
                    key={inspection.inspectionId}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/inspections/${inspection.inspectionId}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      <div>{formatTime(inspection.timestamp)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(inspection.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {inspection.licensePlate || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={inspection.location}>
                        {inspection.location}
                      </div>
                      <div className="text-xs text-muted-foreground">{inspection.cameraId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inspection.status === 'Safe' ? 'safe' : 'unsafe'}>
                        {inspection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'h-2 w-16 rounded-full bg-muted overflow-hidden'
                          )}
                        >
                          <div
                            className={cn(
                              'h-full rounded-full',
                              inspection.status === 'Safe' ? 'bg-safe' : 'bg-unsafe'
                            )}
                            style={{ width: `${inspection.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono">
                          {(inspection.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/inspections/${inspection.inspectionId}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  glowClass?: string;
  trend?: { value: number; positive: boolean };
  pulse?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  glowClass,
  trend,
  pulse,
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', glowClass)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold font-mono">{value}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              {trend && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-xs',
                    trend.positive ? 'text-safe' : 'text-unsafe'
                  )}
                >
                  {trend.positive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{trend.value}%</span>
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              'h-12 w-12 rounded-full bg-muted flex items-center justify-center',
              pulse && 'pulse-unsafe'
            )}
          >
            <Icon className={cn('h-6 w-6', iconClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
