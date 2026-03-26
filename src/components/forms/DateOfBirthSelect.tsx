import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from "lucide-react";
import { MONTHS, generateYears, generateDays } from './formConstants';
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);

  const years = useMemo(() => generateYears(), []);

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
              disabled={disabled}
            >
              {year || "Jahr"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Jahr suchen..." />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>Kein Jahr gefunden.</CommandEmpty>
                <CommandGroup>
                  {years.map((y) => (
                    <CommandItem
                      key={y}
                      value={String(y)}
                      onSelect={(currentValue) => {
                        handleChange(currentValue, month, day);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          year === String(y) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {y}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
