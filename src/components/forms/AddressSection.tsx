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
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function AddressSection({
  country, city, postalCode,
  onCountryChange, onCityChange, onPostalCodeChange,
  errors = {},
  disabled,
}: AddressSectionProps) {
  const selectedCountry = country || 'Deutschland';
  const cities = COUNTRY_CITIES[selectedCountry];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Land <span className="text-rose-500 font-bold">*</span></Label>
        <Select value={selectedCountry} onValueChange={v => { onCountryChange(v); onCityChange(null); }} disabled={disabled}>
          <SelectTrigger className={errors.country ? 'border-destructive' : ''}><SelectValue /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
      </div>
      <div className="space-y-2">
        <Label>Stadt <span className="text-rose-500 font-bold">*</span></Label>
        {cities ? (
          <Select value={city || ''} onValueChange={v => onCityChange(v)} disabled={disabled}>
            <SelectTrigger className={errors.city ? 'border-destructive' : ''}><SelectValue placeholder="Bremen" /></SelectTrigger>
            <SelectContent>
              {cities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input 
            value={city || ''} 
            onChange={e => onCityChange(e.target.value || null)} 
            disabled={disabled} 
            placeholder="Stadt eingeben" 
            className={errors.city ? 'border-destructive' : ''} 
          />
        )}
        {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
      </div>
      <div className="space-y-2">
        <Label>Postleitzahl <span className="text-rose-500 font-bold">*</span></Label>
        <Input 
          value={postalCode || ''} 
          onChange={e => onPostalCodeChange(e.target.value || null)} 
          disabled={disabled} 
          placeholder="e.g. 28195" 
          className={errors.postal_code ? 'border-destructive' : ''} 
        />
        {errors.postal_code && <p className="text-xs text-destructive mt-1">{errors.postal_code}</p>}
      </div>
    </div>
  );
}
