import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SignaturePad } from '@/components/SignaturePad';
import { Card, CardContent } from '@/components/ui/card';

interface ParentConsentSectionProps {
  parentName: string;
  parentSignature: string | null;
  onParentNameChange: (val: string) => void;
  onParentSignatureChange: (val: string | null) => void;
  disabled?: boolean;
}

export function ParentConsentSection({
  parentName,
  parentSignature,
  onParentNameChange,
  onParentSignatureChange,
  disabled,
}: ParentConsentSectionProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary">Parent / Guardian Consent Required</h3>
        <p className="text-sm text-muted-foreground">
          Since the client is under 18 years old, parent/guardian information and signature are required.
        </p>
        <div className="space-y-2">
          <Label>Parent/Guardian Full Name <span className="text-destructive">*</span></Label>
          <Input
            value={parentName}
            onChange={e => onParentNameChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter parent/guardian full name"
          />
        </div>
        <div className="space-y-2">
          <Label>Parent/Guardian Signature <span className="text-destructive">*</span></Label>
          <SignaturePad
            value={parentSignature}
            onChange={onParentSignatureChange}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
