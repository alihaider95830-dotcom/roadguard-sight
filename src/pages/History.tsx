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
  X,
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

  const hasFilters = searchPlate || statusFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Inspection History</h1>
          <p className="text-sm text-muted-foreground">
            Browse and search past inspections
          </p>
        </div>
        <Button variant="outline" size="sm" className="self-start sm:self-auto">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="space-y-3">
            {/* First row: Search and Status */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
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
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Safe">Safe</SelectItem>
                  <SelectItem value="Unsafe">Unsafe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Second row: Date filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-40 justify-start">
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-40 justify-start">
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

              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HistoryIcon className="h-5 w-5" />
              Results
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {total.toLocaleString()} found
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={8} columns={4} />
          ) : inspections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No inspections match your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-[500px] sm:min-w-0 px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Plate</TableHead>
                        <TableHead className="hidden md:table-cell">Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Defects</TableHead>
                        <TableHead className="hidden sm:table-cell">Confidence</TableHead>
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
                            <TableCell>
                              <div className="font-mono text-xs sm:text-sm">{time}</div>
                              <div className="text-xs text-muted-foreground">{date}</div>
                            </TableCell>
                            <TableCell className="font-mono font-medium text-xs sm:text-sm">
                              {inspection.licensePlate || '—'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="max-w-[150px] truncate text-sm" title={inspection.location}>
                                {inspection.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={inspection.status === 'Safe' ? 'safe' : 'unsafe'} className="text-xs">
                                {inspection.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {inspection.defectTypes?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {inspection.defectTypes.slice(0, 2).map((d) => (
                                    <Badge key={d} variant="outline" className="text-[10px]">
                                      {d}
                                    </Badge>
                                  ))}
                                  {inspection.defectTypes.length > 2 && (
                                    <Badge variant="outline" className="text-[10px]">
                                      +{inspection.defectTypes.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell font-mono text-xs">
                              {(inspection.confidence * 100).toFixed(0)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground order-2 sm:order-1">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
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
