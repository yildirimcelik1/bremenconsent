import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MONTHS, generateYears, generateDays } from './formConstants';

interface DateOfBirthSelectProps {
  value: string | null; // "YYYY-MM-DD"
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function DateOfBirthSelect({ value, onChange, disabled }: DateOfBirthSelectProps) {
  const parsed = value ? value.split('-') : ['', '', ''];

  const [year, setYear] = useState(parsed[0] || '');
  const [month, setMonth] = useState(parsed[1] ? String(parseInt(parsed[1])) : '');
  const [day, setDay] = useState(parsed[2] ? String(parseInt(parsed[2])) : '');

  useEffect(() => {
    if (value) {
      const p = value.split('-');
      setYear(p[0] || '');
      setMonth(p[1] ? String(parseInt(p[1])) : '');
      setDay(p[2] ? String(parseInt(p[2])) : '');
    }
  }, [value]);

  const handleChange = (y: string, m: string, d: string) => {
    setYear(y);
    setMonth(m);
    setDay(d);
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Select value={year} onValueChange={v => handleChange(v, month, day)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Jahr" /></SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto">
            {generateYears().map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={v => handleChange(year, v, day)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Monat" /></SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto">
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={day} onValueChange={v => handleChange(year, month, v)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto">
            {generateDays().map(d => (
              <SelectItem key={d} value={String(d)}>{String(d).padStart(2, '0')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
