import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Check, Clock, Eye, MapPin, Camera, Loader2 } from 'lucide-react';
import { api, subscribeToEvents } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Alert } from '@/types';
import { cn } from '@/lib/utils';

type TabValue = 'Pending' | 'Acknowledged' | 'Resolved' | 'all';

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('Pending');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const { user } = useAuthStore();

  const fetchAlerts = async (status?: Alert['status']) => {
    setIsLoading(true);
    try {
      const data = await api.getAlerts(status);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(activeTab === 'all' ? undefined : activeTab as Alert['status']);
  }, [activeTab]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubNew = subscribeToEvents<Alert>('alert.created', (alert) => {
      if (activeTab === 'all' || activeTab === 'Pending') {
        setAlerts((prev) => [alert, ...prev]);
      }
    });

    const unsubUpdate = subscribeToEvents<Alert>('alert.updated', (alert) => {
      setAlerts((prev) =>
        prev.map((a) => (a.alertId === alert.alertId ? alert : a))
      );
    });

    return () => {
      unsubNew();
      unsubUpdate();
    };
  }, [activeTab]);

  const handleAcknowledge = async () => {
    if (!selectedAlert || !user) return;
    
    setIsAcknowledging(true);
    try {
      await api.acknowledgeAlert(selectedAlert.alertId, user.operatorId);
      setSelectedAlert(null);
      // Refresh to get updated data
      fetchAlerts(activeTab === 'all' ? undefined : activeTab as Alert['status']);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return '—';
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const getStatusBadge = (alert: Alert) => {
    if (alert.escalated) {
      return <Badge variant="escalated">Escalated</Badge>;
    }
    switch (alert.status) {
      case 'Pending':
        return <Badge variant="pending">Pending</Badge>;
      case 'Acknowledged':
        return <Badge variant="acknowledged">Acknowledged</Badge>;
      case 'Resolved':
        return <Badge variant="safe">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{alert.status}</Badge>;
    }
  };

  const pendingCount = alerts.filter((a) => a.status === 'Pending').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'Acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Monitor and respond to unsafe tire detections</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-unsafe/10 border border-unsafe/20">
            <AlertTriangle className="h-5 w-5 text-unsafe" />
            <span className="text-unsafe font-medium">
              {pendingCount} alert{pendingCount !== 1 ? 's' : ''} pending
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="Pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge variant="unsafe" className="ml-2 h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="Acknowledged">
            Acknowledged
            {acknowledgedCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {acknowledgedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="Resolved">
            Resolved
            {resolvedCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {resolvedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Alerts' : `${activeTab} Alerts`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={5} columns={7} />
              ) : alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {activeTab === 'all' ? '' : activeTab.toLowerCase()} alerts</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Plate</TableHead>
                      <TableHead>Defects</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => {
                      const { time, date } = formatTime(alert.alertDate);
                      return (
                        <TableRow
                          key={alert.alertId}
                          className={cn(
                            'table-row-hover',
                            alert.status === 'Pending' && 'bg-unsafe/5'
                          )}
                        >
                          <TableCell className="font-mono">
                            <div>{time}</div>
                            <div className="text-xs text-muted-foreground">{date}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="max-w-[150px] truncate">{alert.location}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Camera className="h-3 w-3" />
                              {alert.cameraId}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {alert.licensePlate || '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {alert.defectTypes.slice(0, 2).map((defect) => (
                                <Badge key={defect} variant="outline" className="text-xs">
                                  {defect}
                                </Badge>
                              ))}
                              {alert.defectTypes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{alert.defectTypes.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">
                              {(alert.confidence * 100).toFixed(0)}%
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(alert)}</TableCell>
                          <TableCell>
                            {alert.responseTimeMs ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {formatResponseTime(alert.responseTimeMs)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedAlert(alert)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {alert.status === 'Pending' && (
                                <Button
                                  variant="safe"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAlert(alert);
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Ack
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-unsafe" />
              Alert Details
            </DialogTitle>
            <DialogDescription>
              {selectedAlert?.summary}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Status and Timing */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedAlert)}
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedAlert.alertDate).toLocaleString()}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedAlert.location}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Camera</p>
                  <p className="font-mono">{selectedAlert.cameraId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">License Plate</p>
                  <p className="font-mono font-medium">
                    {selectedAlert.licensePlate || 'Not captured'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="font-mono">{(selectedAlert.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Defects */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Detected Defects</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAlert.defectTypes.map((defect) => (
                    <Badge key={defect} variant="unsafe">
                      {defect}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Captured Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAlert.imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="aspect-video rounded-lg bg-muted overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Capture ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
              Close
            </Button>
            {selectedAlert?.status === 'Pending' && (
              <Button variant="safe" onClick={handleAcknowledge} disabled={isAcknowledging}>
                {isAcknowledging && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Alerts;
