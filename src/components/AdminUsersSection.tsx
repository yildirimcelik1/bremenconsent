import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Search, Trash2, KeyRound } from 'lucide-react';
import type { Profile } from '@/types';

export function AdminUsersSection() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<string>('designer');
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [pwUserId, setPwUserId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPw !== newPwConfirm) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setChangingPw(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'update_password', user_id: pwUserId, new_password: newPw },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Password updated' });
      setPwUserId(null);
      setNewPw('');
      setNewPwConfirm('');
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
    setChangingPw(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data as unknown as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formName || !formPassword || !formRole) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    if (formPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (formPassword !== formPasswordConfirm) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: formEmail, password: formPassword, full_name: formName, role: formRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'User created', description: `${formEmail} has been added successfully.` });
      setCreateOpen(false);
      setFormEmail('');
      setFormName('');
      setFormPassword('');
      setFormPasswordConfirm('');
      setFormRole('designer');
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Creation failed', description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'delete', user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'User deleted' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Deletion failed', description: err.message, variant: 'destructive' });
    }
    setDeletingId(null);
  };

  const filtered = profiles.filter(p => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || p.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Staff List</CardTitle>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@studio.com" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" value={formPasswordConfirm} onChange={e => setFormPasswordConfirm(e.target.value)} placeholder="Re-enter password" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Rol" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No users yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>Full Name</TableHead>
                 <TableHead>Email</TableHead>
                 <TableHead>Role</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setPwUserId(u.id); setNewPw(''); setNewPwConfirm(''); }}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {u.id !== user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{u.full_name}</strong> ({u.email})? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(u.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === u.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    <Dialog open={!!pwUserId} onOpenChange={(open) => { if (!open) setPwUserId(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} placeholder="Re-enter password" />
          </div>
          <Button className="w-full" onClick={handleChangePassword} disabled={changingPw}>
            {changingPw && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
