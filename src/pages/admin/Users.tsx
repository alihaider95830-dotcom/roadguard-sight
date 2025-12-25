import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Operator } from '@/types';

export function AdminUsers() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    api.getOperators().then(setOperators).finally(() => setIsLoading(false));
  }, []);

  const toggleStatus = async (id: number) => {
    setTogglingId(id);
    try {
      const updated = await api.toggleOperatorStatus(id);
      setOperators((prev) => prev.map((o) => (o.operatorId === id ? updated : o)));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage operators and administrators</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Operators</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton rows={5} columns={5} /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.map((op) => (
                  <TableRow key={op.operatorId}>
                    <TableCell className="font-medium">{op.name}</TableCell>
                    <TableCell className="font-mono text-sm">{op.email}</TableCell>
                    <TableCell><Badge variant={op.role === 'Admin' ? 'default' : 'secondary'}>{op.role}</Badge></TableCell>
                    <TableCell><Badge variant={op.enabled ? 'safe' : 'destructive'}>{op.enabled ? 'Active' : 'Disabled'}</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(op.operatorId)} disabled={togglingId === op.operatorId}>
                        {togglingId === op.operatorId ? <Loader2 className="h-4 w-4 animate-spin" /> : op.enabled ? <UserX className="h-4 w-4 mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
                        {op.enabled ? 'Disable' : 'Enable'}
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
export default AdminUsers;
