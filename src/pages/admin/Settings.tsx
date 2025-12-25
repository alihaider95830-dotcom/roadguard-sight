import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useToast } from '@/hooks/use-toast';

export function AdminSettings() {
  const { alertAcknowledgmentTimeout, audioAlarmEnabled, apiBaseUrl, wsUrl, setAlertTimeout, setAudioAlarmEnabled, setApiBaseUrl, setWsUrl } = useSettingsStore();
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Your settings have been updated.' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold">System Settings</h1><p className="text-muted-foreground">Configure system behavior</p></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" />Alert Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Acknowledgment Timeout (seconds)</Label>
              <Input type="number" value={alertAcknowledgmentTimeout} onChange={(e) => setAlertTimeout(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Alerts escalate after this period</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div><Label>Audio Alarm</Label><p className="text-sm text-muted-foreground">Play sound on new alerts</p></div>
              <Switch checked={audioAlarmEnabled} onCheckedChange={setAudioAlarmEnabled} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>API Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>API Base URL</Label><Input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} /></div>
          <div className="space-y-2"><Label>WebSocket URL</Label><Input value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} /></div>
        </CardContent>
      </Card>
      <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
    </div>
  );
}
export default AdminSettings;
