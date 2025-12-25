import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Download,
  Printer,
  ZoomIn,
  MapPin,
  Camera,
  Clock,
  Car,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import type { InspectionRecord } from '@/types';
import { cn } from '@/lib/utils';

export function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspection = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.getInspection(id);
        setInspection(data);
      } catch (error) {
        console.error('Failed to fetch inspection:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInspection();
  }, [id]);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Inspection Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The requested inspection could not be found.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const { date, time } = formatDateTime(inspection.timestamp);
  const isSafe = inspection.status === 'Safe';

  return (
    <div className="space-y-6 animate-fade-in print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Inspection Report</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {inspection.inspectionId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">ATIS Inspection Report</h1>
        <p className="text-sm text-muted-foreground">ID: {inspection.inspectionId}</p>
      </div>

      {/* Status Banner */}
      <Card
        className={cn(
          'overflow-hidden',
          isSafe ? 'stat-glow-safe' : 'stat-glow-unsafe'
        )}
      >
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-16 w-16 rounded-full flex items-center justify-center',
                  isSafe ? 'bg-safe/20' : 'bg-unsafe/20'
                )}
              >
                {isSafe ? (
                  <Shield className="h-8 w-8 text-safe" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-unsafe" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Badge variant={isSafe ? 'safe' : 'unsafe'} className="text-lg px-4 py-1">
                    {inspection.status}
                  </Badge>
                  <span className="text-lg font-mono">
                    {(inspection.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {isSafe
                    ? 'No tire defects detected'
                    : `${inspection.defectTypes?.length || 0} defect(s) identified`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle & Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">License Plate</p>
                <p className="font-mono text-lg font-semibold">
                  {inspection.licensePlate || 'Not captured'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Processing Time</p>
                <p className="font-mono text-lg">
                  {inspection.processingDurationMs}ms
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <p className="font-medium">{inspection.location}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Camera className="h-4 w-4" />
                Camera
              </div>
              <p className="font-mono">{inspection.cameraId}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Timestamp
              </div>
              <p>{date}</p>
              <p className="font-mono text-sm text-muted-foreground">{time}</p>
            </div>
          </CardContent>
        </Card>

        {/* Defects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Defect Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!inspection.defectTypes?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 text-safe opacity-50" />
                <p>No defects detected</p>
                <p className="text-sm mt-1">All tire conditions meet safety standards</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {inspection.defectTypes.length} defect type(s) identified:
                </p>
                <div className="space-y-2">
                  {inspection.defectTypes.map((defect, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-unsafe/10 border border-unsafe/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-unsafe" />
                        <span className="font-medium">{defect}</span>
                      </div>
                      <Badge variant="unsafe">Critical</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Captured Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspection.imageUrls.map((url, i) => (
              <div
                key={i}
                className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer"
                onClick={() => setZoomedImage(url)}
              >
                <img
                  src={url}
                  alt={`Tire inspection ${i + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-8 w-8" />
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary">Image {i + 1}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Zoomed inspection image</DialogTitle>
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt="Zoomed view"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InspectionDetail;
