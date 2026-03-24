import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  value: string | null;
  onChange: (data: string | null) => void;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, disabled }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (value && sigRef.current && sigRef.current.isEmpty()) {
      sigRef.current.fromDataURL(value);
    }
  }, [value]);

  const handleEnd = () => {
    if (sigRef.current) {
      onChange(sigRef.current.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Client Signature</Label>
        {!disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <Eraser className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>
      <div className="rounded-xl border border-border/40 bg-background/30 backdrop-blur-sm overflow-hidden">
        {disabled && value ? (
          <img src={value} alt="Client signature" className="w-full h-[150px] object-contain" />
        ) : (
          <SignatureCanvas
            ref={sigRef}
            penColor="hsl(222, 24%, 12%)"
            canvasProps={{
              className: 'w-full',
              style: { width: '100%', height: '150px' },
            }}
            onEnd={handleEnd}
          />
        )}
      </div>
    </div>
  );
}
