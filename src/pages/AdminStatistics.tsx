import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { CalendarIcon, Euro, Scissors, PenTool, Loader2, Download, Users } from 'lucide-react';
import logo from '@/assets/logo.svg';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts';
import { jsPDF } from 'jspdf';
import type { ConsentForm, Artist } from '@/types';

const PRESET_RANGES = [
  { label: 'Last 1 Mo', months: 1 },
  { label: 'Last 2 Mo', months: 2 },
  { label: 'Last 3 Mo', months: 3 },
  { label: 'Last 6 Mo', months: 6 },
  { label: 'Last 12 Mo', months: 12 },
];

const CHART_COLORS = [
  'hsl(40, 78%, 48%)',
  'hsl(25, 63%, 48%)',
  'hsl(152, 60%, 40%)',
  'hsl(18, 14%, 58%)',
  'hsl(220, 60%, 55%)',
  'hsl(340, 55%, 50%)',
  'hsl(280, 50%, 55%)',
  'hsl(180, 50%, 45%)',
];

const tooltipStyle = {
  background: 'hsl(60, 4%, 98%)',
  border: '1px solid hsl(30, 6%, 85%)',
  borderRadius: '8px',
  fontSize: '12px',
};

export default function AdminStatistics() {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeType, setRangeType] = useState<string>('3');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [formsRes, artistsRes] = await Promise.all([
        supabase.from('consent_forms').select('*').order('created_at', { ascending: true }),
        supabase.from('artists').select('*'),
      ]);
      if (formsRes.data) setForms(formsRes.data as unknown as ConsentForm[]);
      if (artistsRes.data) setArtists(artistsRes.data as unknown as Artist[]);
      setLoading(false);
    })();
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (rangeType === 'custom' && customFrom && customTo) {
      return { from: startOfDay(customFrom), to: endOfMonth(customTo) };
    }
    const months = parseInt(rangeType) || 3;
    return { from: startOfMonth(subMonths(now, months - 1)), to: now };
  }, [rangeType, customFrom, customTo]);

  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      if (!f.created_at) return false;
      const d = parseISO(f.created_at);
      return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
    });
  }, [forms, dateRange]);

  const artistMap = useMemo(() => {
    const map: Record<string, string> = {};
    artists.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [artists]);

  // === Summary stats ===
  const totalForms = filteredForms.length;
  const tattooForms = filteredForms.filter(f => f.consent_type === 'tattoo');
  const piercingForms = filteredForms.filter(f => f.consent_type === 'piercing');
  const approvedForms = filteredForms.filter(f => f.status === 'approved');

  const getRevenue = (list: ConsentForm[]) =>
    list.reduce((sum, f) => {
      const p = parseFloat(f.price || '0');
      return sum + (isNaN(p) ? 0 : p);
    }, 0);

  const totalRevenue = getRevenue(filteredForms);
  const tattooRevenue = getRevenue(tattooForms);
  const piercingRevenue = getRevenue(piercingForms);

  // === Per-customer stats (unique by first_name + last_name + email) ===
  const customerStats = useMemo(() => {
    const customerMap: Record<string, { count: number; totalSpent: number }> = {};
    filteredForms.forEach(f => {
      const key = `${f.first_name.toLowerCase()}_${f.last_name.toLowerCase()}_${(f.email || '').toLowerCase()}`;
      if (!customerMap[key]) customerMap[key] = { count: 0, totalSpent: 0 };
      customerMap[key].count++;
      const price = parseFloat(f.price || '0');
      if (!isNaN(price)) customerMap[key].totalSpent += price;
    });
    const customers = Object.values(customerMap);
    const uniqueCount = customers.length;
    const avgSpentPerCustomer = uniqueCount > 0 ? totalRevenue / uniqueCount : 0;
    const avgFormsPerCustomer = uniqueCount > 0 ? totalForms / uniqueCount : 0;
    return { uniqueCount, avgSpentPerCustomer, avgFormsPerCustomer };
  }, [filteredForms, totalRevenue, totalForms]);

  // Tattoo-specific customer stats
  const tattooCustomerStats = useMemo(() => {
    const customerMap: Record<string, { count: number; totalSpent: number }> = {};
    tattooForms.forEach(f => {
      const key = `${f.first_name.toLowerCase()}_${f.last_name.toLowerCase()}_${(f.email || '').toLowerCase()}`;
      if (!customerMap[key]) customerMap[key] = { count: 0, totalSpent: 0 };
      customerMap[key].count++;
      const price = parseFloat(f.price || '0');
      if (!isNaN(price)) customerMap[key].totalSpent += price;
    });
    const customers = Object.values(customerMap);
    const uniqueCount = customers.length;
    const avgSpent = uniqueCount > 0 ? tattooRevenue / uniqueCount : 0;
    const avgTattoosPerCustomer = uniqueCount > 0 ? tattooForms.length / uniqueCount : 0;
    return { uniqueCount, avgSpent, avgTattoosPerCustomer };
  }, [tattooForms, tattooRevenue]);

  // === Monthly revenue ===
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; tattoo: number; piercing: number }> = {};
    const current = new Date(dateRange.from);
    while (current <= dateRange.to) {
      const key = format(current, 'yyyy-MM');
      months[key] = { month: format(current, 'MMM yyyy'), revenue: 0, tattoo: 0, piercing: 0 };
      current.setMonth(current.getMonth() + 1);
    }
    filteredForms.forEach(f => {
      const key = f.created_at ? format(parseISO(f.created_at), 'yyyy-MM') : null;
      if (key && months[key]) {
        const price = parseFloat(f.price || '0');
        if (!isNaN(price)) months[key].revenue += price;
        if (f.consent_type === 'tattoo') months[key].tattoo++;
        else months[key].piercing++;
      }
    });
    return Object.values(months);
  }, [filteredForms, dateRange]);

  // === Referral source ===
  const referralData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredForms.forEach(f => {
      const source = f.reference_notes || 'Not specified';
      counts[source] = (counts[source] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [filteredForms]);

  // === Artist revenue ===
  const artistRevenueData = useMemo(() => {
    const revMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    filteredForms.forEach(f => {
      if (!f.assigned_artist_id) return;
      const name = artistMap[f.assigned_artist_id] || 'Unknown';
      const price = parseFloat(f.price || '0');
      if (!isNaN(price)) revMap[name] = (revMap[name] || 0) + price;
      countMap[name] = (countMap[name] || 0) + 1;
    });
    return Object.entries(revMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, revenue], i) => ({
        name,
        revenue,
        count: countMap[name] || 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [filteredForms, artistMap]);

  // === Artist percentage distribution ===
  const artistDistData = useMemo(() => {
    const countMap: Record<string, number> = {};
    filteredForms.forEach(f => {
      if (!f.assigned_artist_id) return;
      const name = artistMap[f.assigned_artist_id] || 'Unknown';
      countMap[name] = (countMap[name] || 0) + 1;
    });
    const total = Object.values(countMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        percent: ((value / total) * 100).toFixed(1),
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [filteredForms, artistMap]);

  // === Type & Status distribution ===
  const typeData = [
    { name: 'Tattoo', value: tattooForms.length, color: CHART_COLORS[0] },
    { name: 'Piercing', value: piercingForms.length, color: CHART_COLORS[1] },
  ];
  const statusData = [
    { name: 'Draft', value: filteredForms.filter(f => f.status === 'draft').length, color: CHART_COLORS[3] },
    { name: 'Approved', value: approvedForms.length, color: CHART_COLORS[2] },
  ];

  // === Export CSV ===
  const exportCSV = useCallback(() => {
    const headers = ['Date', 'First Name', 'Last Name', 'Type', 'Status', 'Price (€)', 'Body Area', 'Artist', 'Source'];
    const rows = filteredForms.map(f => [
      f.created_at ? format(parseISO(f.created_at), 'yyyy-MM-dd') : '',
      f.first_name,
      f.last_name,
      f.consent_type,
      f.status,
      f.price || '',
      f.body_area || '',
      f.assigned_artist_id ? (artistMap[f.assigned_artist_id] || '') : '',
      f.reference_notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredForms, artistMap]);

  // === Export PDF ===
  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const rangeLabel = `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`;
    
    doc.setFontSize(18);
    doc.text('Statistics Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Date Range: ${rangeLabel}`, 14, 28);
    
    let y = 40;
    const addLine = (label: string, value: string) => {
      doc.setFontSize(10);
      doc.text(`${label}: ${value}`, 14, y);
      y += 7;
    };

    addLine('Total Forms', String(totalForms));
    addLine('Total Revenue', `€${totalRevenue.toLocaleString('de-DE')}`);
    addLine('Tattoo Revenue', `€${tattooRevenue.toLocaleString('de-DE')}`);
    addLine('Piercing Revenue', `€${piercingRevenue.toLocaleString('de-DE')}`);
    addLine('Tattoo Count', `${tattooForms.length} (${totalForms > 0 ? ((tattooForms.length / totalForms) * 100).toFixed(0) : 0}%)`);
    addLine('Piercing Count', `${piercingForms.length} (${totalForms > 0 ? ((piercingForms.length / totalForms) * 100).toFixed(0) : 0}%)`);
    y += 3;
    addLine('Total Customers', String(customerStats.uniqueCount));
    addLine('Avg. Spend / Customer', `€${customerStats.avgSpentPerCustomer.toFixed(0)}`);
    addLine('Tattoo Customers', String(tattooCustomerStats.uniqueCount));
    addLine('Avg. Tattoo Spend / Customer', `€${tattooCustomerStats.avgSpent.toFixed(0)}`);
    addLine('Tattoos Per Customer', tattooCustomerStats.avgTattoosPerCustomer.toFixed(1));

    y += 5;
    doc.setFontSize(12);
    doc.text('Artist Revenue', 14, y);
    y += 7;
    artistRevenueData.forEach(a => {
      addLine(`  ${a.name}`, `€${a.revenue.toLocaleString('de-DE')} (${a.count} jobs)`);
    });

    y += 5;
    doc.setFontSize(12);
    doc.text('Customer Sources', 14, y);
    y += 7;
    const totalRef = referralData.reduce((s, r) => s + r.value, 0) || 1;
    referralData.forEach(r => {
      addLine(`  ${r.name}`, `${r.value} (${((r.value / totalRef) * 100).toFixed(0)}%)`);
    });

    doc.save(`statistics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }, [dateRange, totalForms, totalRevenue, tattooRevenue, piercingRevenue, tattooForms, piercingForms, customerStats, tattooCustomerStats, artistRevenueData, referralData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 min-h-screen -m-6 p-6 rounded-xl bg-background">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Statistics</h1>
              <p className="text-white/60 text-sm mt-1">Detailed business analytics & reports</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_RANGES.map(r => (
              <Button
                key={r.months}
                size="sm"
                variant={rangeType === String(r.months) ? 'default' : 'outline'}
                onClick={() => setRangeType(String(r.months))}
                className={`text-xs ${rangeType === String(r.months) ? 'bg-gradient-to-r from-[hsl(40,78%,48%)] to-[hsl(25,63%,48%)] border-0 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow' : ''}`}
              >
                {r.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant={rangeType === 'custom' ? 'default' : 'outline'} className={`text-xs ${rangeType === 'custom' ? 'bg-gradient-to-r from-[hsl(40,78%,48%)] to-[hsl(25,63%,48%)] border-0 shadow-lg shadow-primary/25' : ''}`}>
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  Custom Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 space-y-3" align="end">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Start</p>
                  <Calendar
                    mode="single"
                    selected={customFrom}
                    onSelect={(d) => { setCustomFrom(d); setRangeType('custom'); }}
                    className={cn("p-2 pointer-events-auto")}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">End</p>
                  <Calendar
                    mode="single"
                    selected={customTo}
                    onSelect={(d) => { setCustomTo(d); setRangeType('custom'); }}
                    className={cn("p-2 pointer-events-auto")}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={exportCSV} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportPDF} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards Row 1 - Revenue */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Revenue</CardTitle>
              <Euro className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">€{totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })}</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Tattoo Revenue</CardTitle>
              <PenTool className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">€{tattooRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? ((tattooRevenue / totalRevenue) * 100).toFixed(0) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Piercing Revenue</CardTitle>
              <Scissors className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">€{piercingRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRevenue > 0 ? ((piercingRevenue / totalRevenue) * 100).toFixed(0) : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards Row 2 - Customer & Per-person stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{customerStats.uniqueCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg. {customerStats.avgFormsPerCustomer.toFixed(1)} sessions/customer
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Avg. Spend / Customer</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">€{customerStats.avgSpentPerCustomer.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Tattoo Customers</CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{tattooCustomerStats.uniqueCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {tattooCustomerStats.avgTattoosPerCustomer.toFixed(1)} tattoos/customer
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Avg. Tattoo Price</CardTitle>
              <Euro className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">€{tattooCustomerStats.avgSpent.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">per customer</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Dövme / Piercing</CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{tattooForms.length} / {piercingForms.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalForms > 0 ? ((tattooForms.length / totalForms) * 100).toFixed(0) : 0}% / {totalForms > 0 ? ((piercingForms.length / totalForms) * 100).toFixed(0) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-white">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(40, 78%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(40, 78%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 6%, 85%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(0, 0%, 54%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(0, 0%, 54%)" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`€${value.toLocaleString('de-DE')}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(40, 78%, 48%)" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>


        {/* Referral: Bar Chart + Pie Chart */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-white">Customer Source (Bar)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {referralData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={referralData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 6%, 85%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 54%)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(0, 0%, 54%)" allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, 'Count']} />
                      <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                        {referralData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No data</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-white">Customer Source Distribution (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {referralData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={referralData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {referralData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Artist Revenue Bar Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-white">Artist Revenue (€)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {artistRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={artistRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 6%, 85%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 54%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(0, 0%, 54%)" />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`€${value.toLocaleString('de-DE')}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {artistRevenueData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-16">No assigned artist data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Artist Distribution Pie + Type/Status Pies */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-white">Artist Distribution (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {artistDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={artistDistData}
                        cx="50%"
                        cy="45%"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {artistDistData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend
                        verticalAlign="bottom"
                        formatter={(value: string, entry: any) => {
                          const item = artistDistData.find(d => d.name === value);
                          return `${value} ${item ? item.percent : ''}%`;
                        }}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-16">No data</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-white">Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="45%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {typeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value: string) => {
                        const item = typeData.find(d => d.name === value);
                        const total = typeData.reduce((s, d) => s + d.value, 0) || 1;
                        return `${value} ${item ? ((item.value / total) * 100).toFixed(0) : 0}%`;
                      }}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg text-white">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value: string) => {
                        const item = statusData.find(d => d.name === value);
                        const total = statusData.reduce((s, d) => s + d.value, 0) || 1;
                        return `${value} ${item ? ((item.value / total) * 100).toFixed(0) : 0}%`;
                      }}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
