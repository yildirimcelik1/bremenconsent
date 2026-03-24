import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import {
  CalendarIcon, Euro, Scissors, PenTool, Loader2, Download,
  TrendingUp, TrendingDown, Minus, BarChart2, MapPin,
} from 'lucide-react';
import logo from '@/assets/logo.svg';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Area, AreaChart,
  PieChart, Pie,
} from 'recharts';
import { jsPDF } from 'jspdf';
import type { ConsentForm, Artist } from '@/types';
import { TATTOO_PLACEMENTS, PIERCING_TYPES } from '@/components/forms/formConstants';
import { REFERRAL_OPTIONS } from '@/components/forms/ReferralSourceSection';

const PRESET_RANGES = [
  { label: '1 Mo', months: 1 },
  { label: '2 Mo', months: 2 },
  { label: '3 Mo', months: 3 },
  { label: '6 Mo', months: 6 },
  { label: '12 Mo', months: 12 },
];

const CHART_COLORS = [
  'hsl(40, 78%, 48%)',
  'hsl(25, 63%, 48%)',
  'hsl(152, 60%, 40%)',
  'hsl(220, 60%, 55%)',
  'hsl(340, 55%, 50%)',
  'hsl(280, 50%, 55%)',
  'hsl(180, 50%, 45%)',
  'hsl(18, 14%, 58%)',
];

const tooltipStyle = {
  background: '#1a1a1a',
  border: '1px solid hsl(30, 6%, 25%)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#fff',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getRevenue = (list: ConsentForm[]) =>
  list.reduce((sum, f) => {
    const p = parseFloat(f.price || '0');
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

// ─── Trend badge ─────────────────────────────────────────────────────────────
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = pct === 0 ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyChart({ message = 'Bu dönemde yeterli veri yok' }: { message?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <BarChart2 className="h-10 w-10 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Age Group Helper ──────────────────────────────────────────────────────────
const getAgeGroup = (dob: string | null) => {
  if (!dob) return 'Not Specified';
  try {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (age < 18) return 'Under 18';
    if (age <= 21) return '18-21';
    if (age <= 25) return '22-25';
    if (age <= 30) return '26-30';
    if (age <= 35) return '31-35';
    if (age <= 40) return '36-40';
    return '41+';
  } catch (e) {
    return 'Not Specified';
  }
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, sub, icon: Icon, trend,
}: {
  title: string;
  value: string;
  sub?: string;
  icon?: React.ElementType;
  trend?: React.ReactNode;
}) {
  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-primary/70" />}
      </CardHeader>
      <CardContent className="pt-1">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {trend}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Body Area Statistics (Vertical Bar Chart) ──────────────────────────────
function BodyAreaStats({ data, color, gradientId }: { data: { name: string; value: number; pct: string }[]; color: string; gradientId: string }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">Veri yok</p>;
  }
  return (
    <div className="h-64 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'currentColor', fontWeight: 500 }}
            interval={0}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            contentStyle={{ 
              background: 'rgba(255,255,255,0.9)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }} 
            formatter={(val: number) => [val, 'Count']}
          />
          <Bar 
            dataKey="value" 
            fill={`url(#${gradientId})`} 
            radius={[6, 6, 0, 0]} 
            barSize={32}
            label={{ position: 'top', fontSize: 10, fill: 'currentColor', offset: 8 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
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

  const artistMap = useMemo(() => {
    const map: Record<string, string> = {};
    artists.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [artists]);

  // Current range
  const dateRange = useMemo(() => {
    const now = new Date();
    if (rangeType === 'custom' && customFrom && customTo) {
      return { from: startOfDay(customFrom), to: endOfMonth(customTo) };
    }
    const months = parseInt(rangeType) || 3;
    return { from: startOfMonth(subMonths(now, months - 1)), to: now };
  }, [rangeType, customFrom, customTo]);

  // Previous range for trend
  const prevDateRange = useMemo(() => {
    if (rangeType === 'custom') return null;
    const months = parseInt(rangeType) || 3;
    const from = startOfMonth(subMonths(dateRange.from, months));
    const to = startOfMonth(dateRange.from);
    return { from, to };
  }, [rangeType, dateRange]);

  const filterForms = useCallback((range: { from: Date; to: Date }) =>
    forms.filter(f => {
      if (!f.created_at) return false;
      const d = parseISO(f.created_at);
      return isWithinInterval(d, { start: range.from, end: range.to });
    }), [forms]);

  const filteredForms = useMemo(() => filterForms(dateRange), [filterForms, dateRange]);
  const prevForms = useMemo(() => prevDateRange ? filterForms(prevDateRange) : [], [filterForms, prevDateRange]);

  // ── Core metrics ──
  const tattooForms = filteredForms.filter(f => f.consent_type === 'tattoo');
  const piercingForms = filteredForms.filter(f => f.consent_type === 'piercing');

  const totalRevenue = getRevenue(filteredForms);
  const tattooRevenue = getRevenue(tattooForms);
  const piercingRevenue = getRevenue(piercingForms);

  const prevRevenue = getRevenue(prevForms);

  // Avg spend
  const avgSpend = useMemo(() => {
    const priced = filteredForms.filter(f => parseFloat(f.price || '') > 0);
    return priced.length > 0 ? getRevenue(priced) / priced.length : 0;
  }, [filteredForms]);

  // ── Monthly data ──
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; tattoo: number; piercing: number; total: number }> = {};
    const current = new Date(dateRange.from);
    while (current <= dateRange.to) {
      const key = format(current, 'yyyy-MM');
      months[key] = { month: format(current, 'MMM yy'), revenue: 0, tattoo: 0, piercing: 0, total: 0 };
      current.setMonth(current.getMonth() + 1);
    }
    filteredForms.forEach(f => {
      const key = f.created_at ? format(parseISO(f.created_at), 'yyyy-MM') : null;
      if (key && months[key]) {
        const price = parseFloat(f.price || '0');
        if (!isNaN(price)) months[key].revenue += price;
        if (f.consent_type === 'tattoo') months[key].tattoo++;
        else months[key].piercing++;
        months[key].total++;
      }
    });
    return Object.values(months);
  }, [filteredForms, dateRange]);

  // ── Referral ──
  const referralData = useMemo(() => {
    const counts: Record<string, number> = {};
    // Seed all known options with 0 first
    REFERRAL_OPTIONS.forEach(opt => { counts[opt] = 0; });
    filteredForms.forEach(f => {
      const source = f.reference_notes || 'Not specified';
      const key = (REFERRAL_OPTIONS as readonly string[]).includes(source) ? source : 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = filteredForms.length || 1;

    const getAbbr = (full: string) => {
      if (full === 'Instagram') return 'Insta';
      if (full === 'Facebook') return 'FB';
      if (full === 'Google') return 'Google';
      if (full === 'Walk-by' || full === 'Walk-in') return 'Walk';
      if (full.length > 10) return full.substring(0, 8) + '..';
      return full;
    };

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        abbr: getAbbr(name),
        value,
        pct: ((value / total) * 100).toFixed(0),
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [filteredForms]);

  // ── Tattoo revenue by source ──
  const tattooRevenueBySource = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    // Seed all known options with 0
    REFERRAL_OPTIONS.forEach(opt => { revenueMap[opt] = 0; countMap[opt] = 0; });
    tattooForms.forEach(f => {
      const source = f.reference_notes || 'Not specified';
      const key = (REFERRAL_OPTIONS as readonly string[]).includes(source) ? source : 'Other';
      const price = parseFloat(f.price || '0');
      if (!isNaN(price)) revenueMap[key] = (revenueMap[key] || 0) + price;
      countMap[key] = (countMap[key] || 0) + 1;
    });

    const getAbbr = (full: string) => {
      if (full === 'Instagram') return 'Insta';
      if (full === 'Facebook') return 'FB';
      if (full === 'Google') return 'Google';
      if (full === 'Walk-by' || full === 'Walk-in') return 'Walk';
      if (full.length > 10) return full.substring(0, 8) + '..';
      return full;
    };

    return REFERRAL_OPTIONS.map((name, i) => ({
      name,
      abbr: getAbbr(name),
      revenue: Math.round(revenueMap[name] || 0),
      count: countMap[name] || 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [tattooForms]);

  // ── Piercing revenue by source ──
  const piercingRevenueBySource = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    REFERRAL_OPTIONS.forEach(opt => { revenueMap[opt] = 0; countMap[opt] = 0; });
    piercingForms.forEach(f => {
      const source = f.reference_notes || 'Not specified';
      const key = (REFERRAL_OPTIONS as readonly string[]).includes(source) ? source : 'Other';
      const price = parseFloat(f.price || '0');
      if (!isNaN(price)) revenueMap[key] = (revenueMap[key] || 0) + price;
      countMap[key] = (countMap[key] || 0) + 1;
    });
    const getAbbr = (full: string) => {
      if (full === 'Instagram') return 'Insta';
      if (full === 'Facebook') return 'FB';
      if (full === 'Google') return 'Google';
      if (full === 'Walk-by' || full === 'Walk-in') return 'Walk';
      if (full.length > 10) return full.substring(0, 8) + '..';
      return full;
    };
    return REFERRAL_OPTIONS.map((name, i) => ({
      name,
      abbr: getAbbr(name),
      revenue: Math.round(revenueMap[name] || 0),
      count: countMap[name] || 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [piercingForms]);

  // ── Combined revenue by source (all forms) ──
  const revenueBySource = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    REFERRAL_OPTIONS.forEach(opt => { revenueMap[opt] = 0; });
    filteredForms.forEach(f => {
      const source = f.reference_notes || 'Not specified';
      const key = (REFERRAL_OPTIONS as readonly string[]).includes(source) ? source : 'Other';
      const price = parseFloat(f.price || '0');
      if (!isNaN(price)) revenueMap[key] = (revenueMap[key] || 0) + price;
    });
    const total = Object.values(revenueMap).reduce((a, b) => a + b, 0) || 1;
    const colors = ['#f59e0b', '#7c3aed', '#10b981', '#ef4444', '#3b82f6'];
    return REFERRAL_OPTIONS.map((name, i) => ({
      name,
      revenue: Math.round(revenueMap[name] || 0),
      pct: (((revenueMap[name] || 0) / total) * 100).toFixed(0),
      color: colors[i % colors.length],
    })).filter(d => d.revenue > 0);
  }, [filteredForms]);

  // ── Gender Distribution ──
  const genderDistribution = useMemo(() => {
    const counts: Record<string, number> = { Male: 0, Female: 0, Other: 0, 'Not Specified': 0 };
    filteredForms.forEach(f => {
      const g = f.gender || 'Not Specified';
      counts[g] = (counts[g] || 0) + 1;
    });
    const total = filteredForms.length || 1;
    const colors = {
      Male: '#3b82f6',
      Female: '#ec4899',
      Other: '#8b5cf6',
      'Not Specified': '#94a3b8'
    };
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100).toString(),
        color: colors[name as keyof typeof colors] || '#94a3b8'
      }))
      .sort((a, b) => parseInt(b.pct) - parseInt(a.pct));
  }, [filteredForms]);

  // ── Piercing Gender Distribution ──
  const piercingGenderDistribution = useMemo(() => {
    const counts: Record<string, number> = { Male: 0, Female: 0, Other: 0, 'Not Specified': 0 };
    piercingForms.forEach(f => {
      const g = f.gender || 'Not Specified';
      counts[g] = (counts[g] || 0) + 1;
    });
    const total = piercingForms.length || 1;
    const colors = {
      Male: '#3b82f6',
      Female: '#ec4899',
      Other: '#8b5cf6',
      'Not Specified': '#94a3b8'
    };
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100).toString(),
        color: colors[name as keyof typeof colors] || '#94a3b8'
      }))
      .sort((a, b) => parseInt(b.pct) - parseInt(a.pct));
  }, [piercingForms]);

  // ── Tattoo Gender Distribution ──
  const tattooGenderDistribution = useMemo(() => {
    const counts: Record<string, number> = { Male: 0, Female: 0, Other: 0, 'Not Specified': 0 };
    tattooForms.forEach(f => {
      const g = f.gender || 'Not Specified';
      counts[g] = (counts[g] || 0) + 1;
    });
    const total = tattooForms.length || 1;
    const colors = {
      Male: '#3b82f6',
      Female: '#ec4899',
      Other: '#8b5cf6',
      'Not Specified': '#94a3b8'
    };
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100).toString(),
        color: colors[name as keyof typeof colors] || '#94a3b8'
      }))
      .sort((a, b) => parseInt(b.pct) - parseInt(a.pct));
  }, [piercingForms]);

  // ── Tattoo Age Distribution ──
  const tattooAgeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const buckets = ['Under 18', '18-21', '22-25', '26-30', '31-35', '36-40', '41+', 'Not Specified'];
    buckets.forEach(b => counts[b] = 0);
    tattooForms.forEach(f => {
      const g = getAgeGroup(f.date_of_birth);
      counts[g] = (counts[g] || 0) + 1;
    });
    const total = tattooForms.length || 1;
    return buckets
      .filter(b => counts[b] > 0)
      .map((name, i) => ({
        name,
        count: counts[name],
        pct: Math.round((counts[name] / total) * 100).toString(),
        color: CHART_COLORS[i % CHART_COLORS.length]
      }));
  }, [tattooForms]);

  // ── Piercing Age Distribution ──
  const piercingAgeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const buckets = ['Under 18', '18-21', '22-25', '26-30', '31-35', '36-40', '41+', 'Not Specified'];
    buckets.forEach(b => counts[b] = 0);
    piercingForms.forEach(f => {
      const g = getAgeGroup(f.date_of_birth);
      counts[g] = (counts[g] || 0) + 1;
    });
    const total = piercingForms.length || 1;
    return buckets
      .filter(b => counts[b] > 0)
      .map((name, i) => ({
        name,
        count: counts[name],
        pct: Math.round((counts[name] / total) * 100).toString(),
        color: CHART_COLORS[(i + 3) % CHART_COLORS.length]
      }));
  }, [piercingForms]);

  // ── Artist revenue ──
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
        avg: countMap[name] ? Math.round(revenue / countMap[name]) : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [filteredForms, artistMap]);

  // ── Body area — split tattoo / piercing ──
  const buildBodyArea = (list: ConsentForm[], allOptions: readonly string[]) => {
    const counts: Record<string, number> = {};
    // Seed ALL known options with 0 first
    allOptions.forEach(opt => { if (opt !== 'Other') counts[opt] = 0; });
    list.forEach(f => {
      if (!f.body_area) return;
      const key = f.body_area in counts ? f.body_area : 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = list.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        pct: ((value / total) * 100).toFixed(0),
      }));
  };
  const tattooBodyArea = useMemo(() => buildBodyArea(tattooForms, TATTOO_PLACEMENTS), [tattooForms]);
  const piercingBodyArea = useMemo(() => buildBodyArea(piercingForms, PIERCING_TYPES), [piercingForms]);


  // ── Export CSV ──
  const exportCSV = useCallback(() => {
    const headers = ['Date', 'First Name', 'Last Name', 'Type', 'Status', 'Price (€)', 'Body Area', 'Artist', 'Source'];
    const rows = filteredForms.map(f => [
      f.created_at ? format(parseISO(f.created_at), 'yyyy-MM-dd') : '',
      f.first_name, f.last_name, f.consent_type, f.status,
      f.price || '', f.body_area || '',
      f.assigned_artist_id ? (artistMap[f.assigned_artist_id] || '') : '',
      f.reference_notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `statistics_${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [filteredForms, artistMap]);

  // ── Export PDF ──
  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const rangeLabel = `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`;
    doc.setFontSize(18); doc.text('Statistics Report', 14, 20);
    doc.setFontSize(10); doc.text(`Date Range: ${rangeLabel}`, 14, 28);
    let y = 40;
    const addLine = (label: string, value: string) => { doc.setFontSize(10); doc.text(`${label}: ${value}`, 14, y); y += 7; };
    addLine('Total Revenue', `€${totalRevenue.toLocaleString('de-DE')}`);
    addLine('Tattoo Revenue', `€${tattooRevenue.toLocaleString('de-DE')}`);
    addLine('Piercing Revenue', `€${piercingRevenue.toLocaleString('de-DE')}`);
    addLine('Avg Session Price', `€${avgSpend.toFixed(0)}`);
    y += 5;
    doc.setFontSize(12); doc.text('Artist Revenue', 14, y); y += 7;
    artistRevenueData.forEach(a => { addLine(`  ${a.name}`, `€${a.revenue.toLocaleString('de-DE')} (${a.count} jobs, Avg €${a.avg})`); });
    doc.save(`statistics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }, [dateRange, totalRevenue, tattooRevenue, piercingRevenue, avgSpend, artistRevenueData]);

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

        {/* ── Header ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Statistics</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Detailed business analytics &amp; reports</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_RANGES.map(r => (
              <Button
                key={r.months}
                size="sm"
                variant={rangeType === String(r.months) ? 'default' : 'outline'}
                onClick={() => setRangeType(String(r.months))}
                className={`text-xs ${rangeType === String(r.months) ? 'bg-gradient-to-r from-[hsl(40,78%,48%)] to-[hsl(25,63%,48%)] border-0 shadow-lg shadow-primary/25' : ''}`}
              >
                {r.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant={rangeType === 'custom' ? 'default' : 'outline'}
                  className={`text-xs ${rangeType === 'custom' ? 'bg-gradient-to-r from-[hsl(40,78%,48%)] to-[hsl(25,63%,48%)] border-0 shadow-lg shadow-primary/25' : ''}`}
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 space-y-3" align="end">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Start</p>
                  <Calendar mode="single" selected={customFrom} onSelect={(d) => { setCustomFrom(d); setRangeType('custom'); }} className={cn('p-2 pointer-events-auto')} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">End</p>
                  <Calendar mode="single" selected={customTo} onSelect={(d) => { setCustomTo(d); setRangeType('custom'); }} className={cn('p-2 pointer-events-auto')} />
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex gap-1 ml-auto">
              <Button size="sm" variant="outline" onClick={exportCSV} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportPDF} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </div>

        {/* ── KPI Cards — 4 kart ── */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <KpiCard
            title="Total Revenue"
            value={`€${totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })}`}
            sub={prevRevenue > 0 ? `Prev: €${prevRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })}` : undefined}
            trend={<TrendBadge current={totalRevenue} previous={prevRevenue} />}
          />
          <KpiCard
            title="Tattoo Revenue"
            value={`€${tattooRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })}`}
            sub={`${totalRevenue > 0 ? ((tattooRevenue / totalRevenue) * 100).toFixed(0) : 0}% of total`}
          />
          <KpiCard
            title="Piercing Revenue"
            value={`€${piercingRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 })}`}
            sub={`${totalRevenue > 0 ? ((piercingRevenue / totalRevenue) * 100).toFixed(0) : 0}% of total`}
          />
          <KpiCard
            title="Avg Per Person Price"
            value={`€${avgSpend.toFixed(0)}`}
            sub="Average per customer"
          />
        </div>

        {/* ── Monthly Revenue + Volume ── */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-end justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">Monthly Revenue &amp; Volume</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {filteredForms.length} forms &nbsp;·&nbsp; {tattooForms.length} tattoo &nbsp;·&nbsp; {piercingForms.length} piercing
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyData.some(m => m.revenue > 0 || m.total > 0) ? (
              <div className="h-64">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 ml-1">Revenue</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="elegantRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(40, 78%, 48%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(40, 78%, 48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} width={48} tickFormatter={(v) => `€${v}`} />
                    <Tooltip
                      cursor={{ stroke: 'hsl(40,78%,48%)', strokeWidth: 1, strokeDasharray: '4 2' }}
                      contentStyle={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(v: number) => [`€${v.toLocaleString('de-DE')}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(40, 78%, 48%)" strokeWidth={2.5} fill="url(#elegantRev)" dot={{ r: 3, fill: 'hsl(40,78%,48%)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'hsl(40,78%,48%)', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="h-80"><EmptyChart /></div>}
          </CardContent>
        </Card>


        {/* ── Referral Sources ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Customer Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {referralData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={referralData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sourceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="abbr" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 500 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      contentStyle={{ 
                        background: 'rgba(255,255,255,0.92)', 
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                      }} 
                      formatter={(v: number, name: string, props: any) => [
                        `${v} (${props.payload.pct}%)`, 
                        props.payload.name
                      ]}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#sourceGrad)" 
                      radius={[6, 6, 0, 0]} 
                      barSize={40}
                      label={{ position: 'top', fontSize: 11, fill: 'currentColor', offset: 8 }}
                    >
                      {referralData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="Bu dönemde kaynak verisi bulunamadı" />}
            </div>
          </CardContent>
        </Card>

        {/* ── Tattoo Revenue by Source ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Tattoo Revenue by Source
              <span className="ml-auto text-sm font-normal text-muted-foreground float-right">{tattooForms.length} tattoo forms</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Hangi kanaldan gelen müşteriler ne kadar harcadı</p>
          </CardHeader>
          <CardContent>
            {tattooRevenueBySource.filter(d => d.revenue > 0).length > 0 ? (
              <div className="space-y-5">
                {tattooRevenueBySource.filter(d => d.revenue > 0).map((item, i) => {
                  const max = tattooRevenueBySource[0]?.revenue || 1;
                  const pct = Math.round((item.revenue / max) * 100);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-6 shrink-0 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Forms</p>
                            <p className="text-sm font-semibold text-foreground">{item.count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-sm font-bold" style={{ color: item.color }}>€{item.revenue.toLocaleString('de-DE')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyChart message="Bu dönemde tattoo geliri bulunamadı" />}
          </CardContent>
        </Card>

        {/* ── Piercing Revenue by Source ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Piercing Revenue by Source
              <span className="ml-auto text-sm font-normal text-muted-foreground float-right">{piercingForms.length} piercing forms</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Hangi kanaldan gelen müşteriler ne kadar harcadı</p>
          </CardHeader>
          <CardContent>
            {piercingRevenueBySource.filter(d => d.revenue > 0).length > 0 ? (
              <div className="space-y-5">
                {piercingRevenueBySource.filter(d => d.revenue > 0).map((item, i) => {
                  const max = piercingRevenueBySource.filter(d => d.revenue > 0)[0]?.revenue || 1;
                  const pct = Math.round((item.revenue / max) * 100);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-6 shrink-0 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Forms</p>
                            <p className="text-sm font-semibold text-foreground">{item.count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-sm font-bold" style={{ color: item.color }}>€{item.revenue.toLocaleString('de-DE')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyChart message="Bu dönemde piercing geliri bulunamadı" />}
          </CardContent>
        </Card>

        {/* ── Revenue Share by Source ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Revenue Share by Source</CardTitle>
            <p className="text-xs text-muted-foreground">Tüm gelirlerin kanal bazlı dağılımı</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Donut */}
              <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={revenueBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="revenue"
                      stroke="none"
                    >
                      {revenueBySource.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(v: number, _: string, props: any) => [`€${v.toLocaleString('de-DE')} (${props.payload.pct}%)`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</span>
                  <span className="text-xl font-bold text-foreground">€{revenueBySource.reduce((s, r) => s + r.revenue, 0).toLocaleString('de-DE')}</span>
                </div>
              </div>

              {/* Channel list */}
              <div className="flex-1 w-full space-y-3">
                {revenueBySource.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-sm text-foreground font-medium flex-1">{item.name}</span>
                    <span className="text-sm font-semibold text-foreground">€{item.revenue.toLocaleString('de-DE')}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: item.color + '22', color: item.color }}
                    >{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Gender Distribution ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Gender Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Müşteri cinsiyet dağılımı (toplam {filteredForms.length} form)</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Donut */}
              <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={genderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="count"
                      stroke="none"
                    >
                      {genderDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(v: number, _: string, props: any) => [`${v} person (${props.payload.pct}%)`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Clients</span>
                  <span className="text-xl font-bold text-foreground">{filteredForms.length}</span>
                </div>
              </div>
              {/* List */}
              <div className="flex-1 w-full space-y-4">
                {genderDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-foreground font-semibold flex-1">{item.name}</span>
                      <span className="text-sm font-bold text-foreground">{item.count}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: item.color + '22', color: item.color }}>{item.pct}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tattoo Gender Distribution ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Tattoo Clients — Gender Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">Sadece tattoo hizmeti alanların cinsiyet dağılımı (toplam {tattooForms.length} tattoo)</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Donut */}
              <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={tattooGenderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="count"
                      stroke="none"
                    >
                      {tattooGenderDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(v: number, _: string, props: any) => [`${v} person (${props.payload.pct}%)`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tattoo</span>
                  <span className="text-xl font-bold text-foreground">{tattooForms.length}</span>
                </div>
              </div>
              {/* List */}
              <div className="flex-1 w-full space-y-4">
                {tattooGenderDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-foreground font-semibold flex-1">{item.name}</span>
                      <span className="text-sm font-bold text-foreground">{item.count}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: item.color + '22', color: item.color }}>{item.pct}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Piercing Gender Distribution ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Piercing Clients — Gender Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">Sadece piercing hizmeti alanların cinsiyet dağılımı (toplam {piercingForms.length} piercing)</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Donut */}
              <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie
                      data={piercingGenderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="count"
                      stroke="none"
                    >
                      {piercingGenderDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(v: number, _: string, props: any) => [`${v} person (${props.payload.pct}%)`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Piercing</span>
                  <span className="text-xl font-bold text-foreground">{piercingForms.length}</span>
                </div>
              </div>
              {/* List */}
              <div className="flex-1 w-full space-y-4">
                {piercingGenderDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-foreground font-semibold flex-1">{item.name}</span>
                      <span className="text-sm font-bold text-foreground">{item.count}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: item.color + '22', color: item.color }}>{item.pct}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tattoo Age Distribution ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Tattoo Clients — Age Groups
            </CardTitle>
            <p className="text-xs text-muted-foreground">Tattoo yaptıranların yaş gruplarına göre dağılımı</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie data={tattooAgeDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="count" stroke="none">
                      {tattooAgeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.9} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(v: number, _: string, props: any) => [`${v} person (${props.payload.pct}%)`, props.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Age</span>
                  <span className="text-xl font-bold text-foreground">
                    {tattooForms.length > 0 ? Math.round(tattooForms.reduce((acc, f) => {
                      if (!f.date_of_birth) return acc;
                      const age = new Date().getFullYear() - new Date(f.date_of_birth).getFullYear();
                      return acc + age;
                    }, 0) / tattooForms.filter(f => f.date_of_birth).length || 25) : 0}
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-3">
                {tattooAgeDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-foreground font-semibold flex-1 font-mono">{item.name}</span>
                      <span className="text-sm font-bold text-foreground">{item.count}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: item.color + '22', color: item.color }}>{item.pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-black/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Piercing Age Distribution ── */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Piercing Clients — Age Groups
            </CardTitle>
            <p className="text-xs text-muted-foreground">Piercing yaptıranların yaş gruplarına göre dağılımı</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie data={piercingAgeDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="count" stroke="none">
                      {piercingAgeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.9} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(v: number, _: string, props: any) => [`${v} person (${props.payload.pct}%)`, props.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Age</span>
                  <span className="text-xl font-bold text-foreground">
                    {piercingForms.length > 0 ? Math.round(piercingForms.reduce((acc, f) => {
                      if (!f.date_of_birth) return acc;
                      const age = new Date().getFullYear() - new Date(f.date_of_birth).getFullYear();
                      return acc + age;
                    }, 0) / piercingForms.filter(f => f.date_of_birth).length || 22) : 0}
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-3">
                {piercingAgeDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-foreground font-semibold flex-1 font-mono">{item.name}</span>
                      <span className="text-sm font-bold text-foreground">{item.count}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: item.color + '22', color: item.color }}>{item.pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-black/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tattoo vs Piercing Revenue Split ── */}
        {(() => {
          const splitData = [
            { name: 'Tattoo', revenue: tattooRevenue, pct: totalRevenue > 0 ? ((tattooRevenue / totalRevenue) * 100).toFixed(0) : '0', color: 'hsl(40, 78%, 48%)' },
            { name: 'Piercing', revenue: piercingRevenue, pct: totalRevenue > 0 ? ((piercingRevenue / totalRevenue) * 100).toFixed(0) : '0', color: 'hsl(25, 63%, 48%)' },
          ].filter(d => d.revenue > 0);
          return (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Tattoo vs Piercing — Revenue Split</CardTitle>
                <p className="text-xs text-muted-foreground">Toplam gelirin hizmet türüne göre dağılımı</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Donut */}
                  <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie
                          data={splitData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="revenue"
                          stroke="none"
                        >
                          {splitData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} opacity={0.9} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                          formatter={(v: number, _: string, props: any) => [`€${v.toLocaleString('de-DE')} (${props.payload.pct}%)`, props.payload.name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</span>
                      <span className="text-xl font-bold text-foreground">€{totalRevenue.toLocaleString('de-DE')}</span>
                    </div>
                  </div>
                  {/* List */}
                  <div className="flex-1 w-full space-y-4">
                    {splitData.map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-sm text-foreground font-semibold flex-1">{item.name}</span>
                          <span className="text-sm font-bold text-foreground">€{item.revenue.toLocaleString('de-DE')}</span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: item.color + '22', color: item.color }}>{item.pct}%</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
        );
        })()}

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Artist Performance</CardTitle>
            <p className="text-xs text-muted-foreground">{artistRevenueData.length} artist · {filteredForms.filter(f => f.assigned_artist_id).length} sessions</p>
          </CardHeader>
          <CardContent>
            {artistRevenueData.length > 0 ? (
              <div className="space-y-5">
                {artistRevenueData.map((a, i) => {
                  const maxRevenue = artistRevenueData[0]?.revenue || 1;
                  const pct = Math.round((a.revenue / maxRevenue) * 100);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                          <span className="text-sm font-semibold text-foreground truncate">{a.name}</span>
                        </div>
                        <div className="flex items-center gap-6 shrink-0 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Sessions</p>
                            <p className="text-sm font-semibold text-foreground">{a.count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg / session</p>
                            <p className="text-sm font-semibold text-foreground">€{a.avg.toLocaleString('de-DE')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-sm font-bold" style={{ color: a.color }}>€{a.revenue.toLocaleString('de-DE')}</p>
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: a.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyChart message="Artist atanmış form bulunamadı" />
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
