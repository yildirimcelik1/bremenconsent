import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES, COUNTRY_CITIES } from './formConstants';

interface AddressSectionProps {
  country: string | null;
  city: string | null;
  postalCode: string | null;
  onCountryChange: (v: string | null) => void;
  onCityChange: (v: string | null) => void;
  onPostalCodeChange: (v: string | null) => void;
  disabled?: boolean;
}

export function AddressSection({
  country, city, postalCode,
  onCountryChange, onCityChange, onPostalCodeChange,
  disabled,
}: AddressSectionProps) {
  const selectedCountry = country || 'Germany';
  const cities = COUNTRY_CITIES[selectedCountry];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Land <span className="text-rose-500 font-bold">*</span></Label>
        <Select value={selectedCountry} onValueChange={v => { onCountryChange(v); onCityChange(null); }} disabled={disabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Stadt <span className="text-rose-500 font-bold">*</span></Label>
        {cities ? (
          <Select value={city || ''} onValueChange={v => onCityChange(v)} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Stadt auswählen" /></SelectTrigger>
            <SelectContent>
              {cities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input value={city || ''} onChange={e => onCityChange(e.target.value || null)} disabled={disabled} placeholder="Stadt eingeben" />
        )}
      </div>
      <div className="space-y-2">
        <Label>Postleitzahl <span className="text-rose-500 font-bold">*</span></Label>
        <Input value={postalCode || ''} onChange={e => onPostalCodeChange(e.target.value || null)} disabled={disabled} placeholder="e.g. 28195" />
      </div>
    </div>
  );
}
