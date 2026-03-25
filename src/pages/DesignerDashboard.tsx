import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { FileText, FilePlus, FileCheck, Search, Stamp, Droplets, Clock, Loader2, Trash2, CheckCircle, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateAndUploadPdf } from '@/lib/generateConsentPdf';
import { SuccessNotification } from '@/components/SuccessNotification';
import type { ConsentForm, Artist } from '@/types';

export default function DesignerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [assignedArtists, setAssignedArtists] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [formsRes, artistsRes] = await Promise.all([
      supabase.from('consent_forms').select('*').eq('created_by', user.id).order('created_at', { ascending: false }),
      supabase.from('artists').select('*').eq('is_active', true).order('name', { ascending: true }),
    ]);
    if (formsRes.data) {
      const data = formsRes.data as unknown as ConsentForm[];
      setForms(data);
      const artMap: Record<string, string> = {};
      const priceMap: Record<string, string> = {};
      data.forEach(f => {
        if (f.assigned_artist_id) artMap[f.id] = f.assigned_artist_id;
        if (f.price) priceMap[f.id] = f.price;
      });
      setAssignedArtists(artMap);
      setPrices(priceMap);
    }
    if (artistsRes.data) setArtists(artistsRes.data as unknown as Artist[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleApprove = async (formId: string) => {
    const form = forms.find(f => f.id === formId);
    const artistId = assignedArtists[formId];
    const price = prices[formId];
    
    // Tattoo forms require an artist, piercing forms do not
    if (form?.consent_type === 'tattoo' && !artistId) {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie einen Artist aus, bevor Sie genehmigen.', variant: 'destructive' });
      return;
    }
    setApprovingId(formId);
    const { error } = await supabase.from('consent_forms').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      assigned_artist_id: artistId,
      price: price || null,
    }).eq('id', formId);
    if (error) {
      toast({ title: 'Genehmigung fehlgeschlagen', description: error.message, variant: 'destructive' });
    } else {
      // Generate PDF
      const updatedForm = forms.find(f => f.id === formId);
      if (updatedForm) {
        const artistObj = artists.find(a => a.id === artistId);
        const formWithUpdates = { ...updatedForm, status: 'approved' as const, assigned_artist_id: artistId, price: price || null };
        await generateAndUploadPdf(formWithUpdates, artistObj?.name);
      }
      setShowSuccess(true);
      fetchData();
    }
    setApprovingId(null);
  };

  const handleDelete = async (formId: string) => {
    setDeletingId(formId);
    const { error } = await supabase.from('consent_forms').delete().eq('id', formId);
    if (error) {
      toast({ title: 'Löschen fehlgeschlagen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Formular gelöscht' });
      fetchData();
    }
    setDeletingId(null);
  };

  const totalForms = forms.length;
  const draftForms = forms.filter(f => f.status === 'draft').length;
  const approvedForms = forms.filter(f => f.status === 'approved').length;

  const filtered = forms.filter(f => {
    const matchSearch = f.first_name.toLowerCase().includes(search.toLowerCase()) ||
      f.last_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const draftList = filtered.filter(f => f.status === 'draft');
  const approvedList = filtered.filter(f => f.status === 'approved');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Einverständnisbögen</h1>
            <p className="text-muted-foreground text-sm mt-1">Kunden-Einverständnisbögen erstellen und verwalten</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/forms/new?type=tattoo')}>
              Tattoo
            </Button>
            <Button onClick={() => navigate('/forms/new?type=piercing')} variant="outline">
              Piercing
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtanzahl</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{loading ? '—' : totalForms}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entwurf</CardTitle>
              <Clock className="h-4 w-4 text-status-draft" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{loading ? '—' : draftForms}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Genehmigt</CardTitle>
              <FileCheck className="h-4 w-4 text-status-approved" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{loading ? '—' : approvedForms}</p></CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Nach Kundenname suchen..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="approved">Genehmigt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Draft Forms */}
        {(filterStatus === 'all' || filterStatus === 'draft') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-status-draft" />
                Entwurfsformulare ({draftList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {draftList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Keine Entwürfe vorhanden.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kundenname</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead>Zuweisung Artist</TableHead>
                      <TableHead>Preis</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftList.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.first_name} {f.last_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          {f.consent_type === 'tattoo' ? (
                            <Select
                              value={assignedArtists[f.id] || ''}
                              onValueChange={v => setAssignedArtists(prev => ({ ...prev, [f.id]: v }))}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Artist wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                {artists.map(a => (
                                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">— Not Required</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-[100px]"
                            placeholder="€ 0.00"
                            value={prices[f.id] || ''}
                            onChange={e => setPrices(prev => ({ ...prev, [f.id]: e.target.value }))}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/forms/${f.id}`)}>
                              <Pencil className="h-4 w-4 mr-1" /> Bearbeiten
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(f.id)}
                              disabled={approvingId === f.id}
                            >
                              {approvingId === f.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                              Genehmigen
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Formular löschen</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sind Sie sicher, dass Sie das Formular für <strong>{f.first_name} {f.last_name}</strong> löschen möchten? Dies kann nicht rückgängig gemacht werden.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(f.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
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
        )}

        {/* Approved Forms */}
        {(filterStatus === 'all' || filterStatus === 'approved') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-status-approved" />
                Genehmigte Formulare ({approvedList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Keine genehmigten Formulare.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kundenname</TableHead>
                      <TableHead>Art</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Preis</TableHead>
                      <TableHead>Genehmigt</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedList.map(f => {
                      const artist = artists.find(a => a.id === f.assigned_artist_id);
                      return (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.first_name} {f.last_name}</TableCell>
                          <TableCell className="capitalize">{f.consent_type}</TableCell>
                          <TableCell>{artist?.name || '—'}</TableCell>
                          <TableCell>{f.price ? `€${f.price}` : '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {f.approved_at ? new Date(f.approved_at).toLocaleDateString('de-DE', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/forms/${f.id}`)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <SuccessNotification
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </DashboardLayout>
  );
}
