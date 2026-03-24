import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const REFERRAL_OPTIONS = ['Instagram', 'Facebook', 'Google', 'Walk-by', 'Other'] as const;

interface ReferralSourceSectionProps {
  value: string | null;
  otherValue: string;
  onChange: (val: string | null) => void;
  onOtherChange: (val: string) => void;
  disabled?: boolean;
}

export function ReferralSourceSection({
  value,
  otherValue,
  onChange,
  onOtherChange,
  disabled,
}: ReferralSourceSectionProps) {
  return (
    <div className="space-y-3">
      <Label>Where did you find us?</Label>
      <div className="flex flex-wrap gap-2">
        {REFERRAL_OPTIONS.map(option => {
          const isSelected = value === option || (option === 'Other' && value !== null && !REFERRAL_OPTIONS.slice(0, -1).includes(value as any));
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                if (option === 'Other') {
                  onChange(otherValue || 'Other');
                } else {
                  onChange(option);
                  onOtherChange('');
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border/60 bg-background/50 text-foreground hover:border-primary/40 hover:bg-primary/5'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {value !== null && !['Instagram', 'Facebook', 'Google', 'Walk-by'].includes(value) && (
        <Input
          value={otherValue || (value === 'Other' ? '' : value)}
          onChange={e => {
            onOtherChange(e.target.value);
            onChange(e.target.value || 'Other');
          }}
          disabled={disabled}
          placeholder="Please specify..."
          className="mt-2"
        />
      )}
    </div>
  );
}
