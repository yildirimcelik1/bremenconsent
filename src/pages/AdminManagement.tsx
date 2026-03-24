import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { Users, FileText, FilePlus, FileCheck, Loader2, UserPlus, Search, Trash2, Palette, Plus, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Profile, ConsentForm, Artist } from '@/types';

export default function AdminDashboard() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [artistOpen, setArtistOpen] = useState(false);
  const [newArtistName, setNewArtistName] = useState('');
  const [addingArtist, setAddingArtist] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('designer');
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [deletingArtistId, setDeletingArtistId] = useState<string | null>(null);
  const [searchForms, setSearchForms] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = async () => {
    setLoadingStats(true);
    const [profilesRes, formsRes, artistsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('consent_forms').select('*').order('created_at', { ascending: false }),
      supabase.from('artists').select('*').order('created_at', { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as unknown as Profile[]);
    if (formsRes.data) setForms(formsRes.data as unknown as ConsentForm[]);
    if (artistsRes.data) setArtists(artistsRes.data as unknown as Artist[]);
    setLoadingStats(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !invitePassword || !inviteRole) {
      toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    if (invitePassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (invitePassword !== invitePasswordConfirm) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, password: invitePassword, full_name: inviteName, role: inviteRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'User created', description: `${inviteEmail} has been added successfully.` });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      setInvitePasswordConfirm('');
      setInviteRole('designer');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Creation failed', description: err.message, variant: 'destructive' });
    }
    setInviting(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'delete', user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'User deleted' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Deletion failed', description: err.message, variant: 'destructive' });
    }
    setDeletingId(null);
  };

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtistName.trim()) {
      toast({ title: 'Error', description: 'Artist name is required.', variant: 'destructive' });
      return;
    }
    setAddingArtist(true);
    const { error } = await supabase.from('artists').insert({ name: newArtistName.trim() } as any);
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Artist added', description: `${newArtistName} has been added.` });
      setNewArtistName('');
      setArtistOpen(false);
      fetchData();
    }
    setAddingArtist(false);
  };

  const handleDeleteArtist = async (artistId: string) => {
    setDeletingArtistId(artistId);
    const { error } = await supabase.from('artists').delete().eq('id', artistId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Artist deleted' });
      fetchData();
    }
    setDeletingArtistId(null);
  };

  const handleDeleteForm = async (formId: string) => {
    setDeletingFormId(formId);
    const form = forms.find(f => f.id === formId);
    if (form?.pdf_url) {
      const pdfFileName = form.pdf_url.split('/').pop();
      if (pdfFileName) await supabase.storage.from('consent-pdfs').remove([pdfFileName]);
    }
    const { error } = await supabase.from('consent_forms').delete().eq('id', formId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Form deleted' });
      fetchData();
    }
    setDeletingFormId(null);
  };

  const totalUsers = profiles.length;
  const totalForms = forms.length;
  const draftForms = forms.filter(f => f.status === 'draft').length;
  const approvedForms = forms.filter(f => f.status === 'approved').length;

  const filteredUsers = profiles.filter(p => {
    const matchSearch = p.full_name.toLowerCase().includes(searchUsers.toLowerCase()) ||
      p.email.toLowerCase().includes(searchUsers.toLowerCase());
    const matchRole = filterRole === 'all' || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const filteredForms = forms.filter(f => {
    const matchSearch = f.first_name.toLowerCase().includes(searchForms.toLowerCase()) ||
      f.last_name.toLowerCase().includes(searchForms.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">System overview and management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loadingStats ? '—' : totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loadingStats ? '—' : totalForms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft Forms</CardTitle>
              <FilePlus className="h-4 w-4 text-status-draft" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loadingStats ? '—' : draftForms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Forms</CardTitle>
              <FileCheck className="h-4 w-4 text-status-approved" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loadingStats ? '—' : approvedForms}</p>
            </CardContent>
          </Card>
        </div>

        {/* Artists */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" /> Artists
            </CardTitle>
            <Dialog open={artistOpen} onOpenChange={setArtistOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Artist</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Artist</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddArtist} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Artist Name</Label>
                    <Input value={newArtistName} onChange={e => setNewArtistName(e.target.value)} placeholder="Artist name" />
                  </div>
                  <Button type="submit" className="w-full" disabled={addingArtist}>
                    {addingArtist && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Add Artist
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {artists.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No artists added yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {artists.map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-4 py-3">
                    <span className="font-medium text-sm">{a.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Artist</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{a.name}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteArtist(a.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Users</CardTitle>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@studio.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="At least 6 characters" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" value={invitePasswordConfirm} onChange={e => setInvitePasswordConfirm(e.target.value)} placeholder="Re-enter password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={inviting}>
                    {inviting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
                <Input className="pl-9" placeholder="Search users..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No users found.</p>
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
                  {filteredUsers.map(u => (
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
                      <TableCell>
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
                                  onClick={() => handleDeleteUser(u.id)}
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

        {/* Forms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consent Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search by client name..." value={searchForms} onChange={e => setSearchForms(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredForms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No forms found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.first_name} {f.last_name}</TableCell>
                      <TableCell className="capitalize">{f.consent_type}</TableCell>
                      <TableCell><StatusBadge status={f.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(f.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/forms/${f.id}`)}>
                            View
                          </Button>
                          {f.pdf_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={f.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Form</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the form for <strong>{f.first_name} {f.last_name}</strong>? This will also delete the PDF. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteForm(f.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingFormId === f.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
