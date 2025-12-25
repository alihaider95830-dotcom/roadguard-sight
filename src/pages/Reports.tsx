import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  BarChart3,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  PieChart,
  TrendingUp,
  MapPin,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { api } from '@/lib/api';
import type { ChartDataPoint, ReportConfig } from '@/types';
import { format, subDays } from 'date-fns';

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(0, 84%, 60%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 84%, 60%)',
];

type ReportType = ReportConfig['type'];

const reportTypes: { value: ReportType; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'trend', label: 'Safety Trend', shortLabel: 'Trend', icon: TrendingUp },
  { value: 'defects', label: 'Defect Distribution', shortLabel: 'Defects', icon: PieChart },
  { value: 'locations', label: 'Location Analysis', shortLabel: 'Locations', icon: MapPin },
  { value: 'daily', label: 'Daily Overview', shortLabel: 'Daily', icon: BarChart3 },
];

export function Reports() {
  const [reportType, setReportType] = useState<ReportType>('trend');
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    safe: number;
    unsafe: number;
    avgConfidence: number;
  } | null>(null);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const result = await api.generateReport({
        type: reportType,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      });
      setChartData(result.chartsData);
      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select report parameters and generate</p>
          </div>
        </div>
      );
    }

    switch (reportType) {
      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="safe"
                name="Safe"
                stackId="1"
                stroke={CHART_COLORS[1]}
                fill={CHART_COLORS[1]}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="unsafe"
                name="Unsafe"
                stackId="1"
                stroke={CHART_COLORS[2]}
                fill={CHART_COLORS[2]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'defects':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'locations':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="safe" name="Safe" fill={CHART_COLORS[1]} stackId="a" />
              <Bar dataKey="unsafe" name="Unsafe" fill={CHART_COLORS[2]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'daily':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="value"
                name="Total"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[0], r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="safe"
                name="Safe"
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[1], r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="unsafe"
                name="Unsafe"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[2], r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export inspection statistics</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg">Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{type.label}</span>
                        <span className="sm:hidden">{type.shortLabel}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="space-y-2 flex-1 sm:flex-none">
                <label className="text-sm font-medium">From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-40 justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateFrom, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(d) => d && setDateFrom(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 flex-1 sm:flex-none">
                <label className="text-sm font-medium">To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-40 justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateTo, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(d) => d && setDateTo(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Generate Button */}
            <Button onClick={generateReport} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-xl sm:text-3xl font-bold font-mono">{summary.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="stat-glow-safe">
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Safe</p>
              <p className="text-xl sm:text-3xl font-bold font-mono text-safe">{summary.safe.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="stat-glow-unsafe">
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Unsafe</p>
              <p className="text-xl sm:text-3xl font-bold font-mono text-unsafe">{summary.unsafe.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-xl sm:text-3xl font-bold font-mono">
                {((summary.safe / (summary.total || 1)) * 100).toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">
              {reportTypes.find((t) => t.value === reportType)?.label || 'Chart'}
            </CardTitle>
            {chartData.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export </span>PDF
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export </span>Excel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 sm:h-80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            renderChart()
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Reports;
