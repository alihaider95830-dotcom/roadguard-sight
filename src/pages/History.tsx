import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  History as HistoryIcon,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { InspectionRecord } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PAGE_SIZE = 15;

export function History() {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchPlate, setSearchPlate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const navigate = useNavigate();

  const fetchInspections = async () => {
    setIsLoading(true);
    try {
      const result = await api.getInspections({
        plate: searchPlate || undefined,
        status: statusFilter !== 'all' ? (statusFilter as 'Safe' | 'Unsafe') : undefined,
        from: dateFrom?.toISOString(),
        to: dateTo?.toISOString(),
        page,
        pageSize: PAGE_SIZE,
      });
      setInspections(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [page, searchPlate, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  const clearFilters = () => {
    setSearchPlate('');
    setStatusFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inspection History</h1>
          <p className="text-muted-foreground">
            Browse and search past inspections
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search license plate..."
                value={searchPlate}
                onChange={(e) => {
                  setSearchPlate(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Safe">Safe</SelectItem>
                <SelectItem value="Unsafe">Unsafe</SelectItem>
              </SelectContent>
            </Select>

            {/* Date from */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    setPage(1);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date to */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    setPage(1);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear filters */}
            {(searchPlate || statusFilter !== 'all' || dateFrom || dateTo) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Results
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {total.toLocaleString()} inspection{total !== 1 ? 's' : ''} found
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={10} columns={8} />
          ) : inspections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inspections match your filters</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Defects</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Processing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((inspection) => {
                    const { date, time } = formatDateTime(inspection.timestamp);
                    return (
                      <TableRow
                        key={inspection.inspectionId}
                        className="table-row-hover cursor-pointer"
                        onClick={() => navigate(`/inspections/${inspection.inspectionId}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          {inspection.inspectionId.slice(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{time}</div>
                          <div className="text-xs text-muted-foreground">{date}</div>
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {inspection.licensePlate || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[180px] truncate" title={inspection.location}>
                            {inspection.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={inspection.status === 'Safe' ? 'safe' : 'unsafe'}>
                            {inspection.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inspection.defectTypes?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {inspection.defectTypes.slice(0, 2).map((d) => (
                                <Badge key={d} variant="outline" className="text-xs">
                                  {d}
                                </Badge>
                              ))}
                              {inspection.defectTypes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{inspection.defectTypes.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">
                          {(inspection.confidence * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {inspection.processingDurationMs}ms
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default History;
