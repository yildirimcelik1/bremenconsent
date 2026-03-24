import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/SignaturePad';
import { DateOfBirthSelect } from './DateOfBirthSelect';
import { AddressSection } from './AddressSection';
import { ReferralSourceSection } from './ReferralSourceSection';
import { ParentConsentSection } from './ParentConsentSection';
import { TATTOO_PLACEMENTS } from './formConstants';
import { Loader2, Save, CheckCircle } from 'lucide-react';

export interface TattooFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  postal_code: string | null;
  date_of_birth: string | null;
  procedure_description: string | null;
  body_area: string | null;
  body_area_other: string;
  referral_source: string | null;
  referral_source_other: string;
  parent_name: string;
  parent_signature: string | null;
  accepted_terms: boolean;
  gdpr_email_consent: boolean;
  client_signature: string | null;
}

interface TattooConsentFormProps {
  initialData?: Partial<TattooFormData>;
  onSave: (data: TattooFormData) => Promise<void>;
  saving: boolean;
  isReadOnly?: boolean;
}

function calculateAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const CONSENT_TEXT = `I hereby consent to the tattoo procedure described above. I confirm that I have provided truthful information. I understand the risks involved including, but not limited to, infection, allergic reaction, scarring, and dissatisfaction with the result. I acknowledge that tattoos are permanent and that removal is difficult, expensive, and may not fully restore the skin. I confirm that I am not under the influence of alcohol or drugs. I have been informed about proper aftercare and agree to follow the instructions provided.`;

const GDPR_TEXT = `In accordance with GDPR (General Data Protection Regulation), your personal data will be processed solely for the purpose of this consent form and studio records. Your data will be stored securely and will not be shared with third parties without your explicit consent.`;

export function TattooConsentForm({
  initialData,
  onSave,
  saving,
  isReadOnly = false,
}: TattooConsentFormProps) {
  const [form, setForm] = useState<TattooFormData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || null,
    country: initialData?.country || 'Germany',
    city: initialData?.city || 'Bremen',
    postal_code: initialData?.postal_code || null,
    date_of_birth: initialData?.date_of_birth || null,
    procedure_description: initialData?.procedure_description || null,
    body_area: initialData?.body_area || null,
    body_area_other: '',
    referral_source: initialData?.referral_source || null,
    referral_source_other: initialData?.referral_source_other || '',
    parent_name: initialData?.parent_name || '',
    parent_signature: initialData?.parent_signature || null,
    accepted_terms: initialData?.accepted_terms ?? true,
    gdpr_email_consent: initialData?.gdpr_email_consent ?? false,
    client_signature: initialData?.client_signature || null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof TattooFormData>(key: K, val: TattooFormData[K]) => {
    if (isReadOnly) return;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const age = useMemo(() => form.date_of_birth ? calculateAge(form.date_of_birth) : null, [form.date_of_birth]);
  const isMinor = age !== null && age < 18;

  const placement = TATTOO_PLACEMENTS.includes(form.body_area as any)
    ? form.body_area
    : form.body_area && form.body_area !== ''
      ? 'Other'
      : null;

  return (
    <div className="space-y-6">
      {/* Client Info */}
      <Card>
        <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={`${form.first_name}${form.last_name ? ' ' + form.last_name : ''}`}
                onChange={e => {
                  const parts = e.target.value.split(' ');
                  update('first_name', parts[0] || '');
                  update('last_name', parts.slice(1).join(' '));
                }}
                disabled={isReadOnly}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => { update('email', e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                disabled={isReadOnly}
                placeholder="john@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={form.phone || ''}
                onChange={e => update('phone', e.target.value || null)}
                disabled={isReadOnly}
                placeholder="+49 xxx xxxxxxx"
              />
            </div>
          </div>
          <AddressSection
            country={form.country}
            city={form.city}
            postalCode={form.postal_code}
            onCountryChange={v => update('country', v)}
            onCityChange={v => update('city', v)}
            onPostalCodeChange={v => update('postal_code', v)}
            disabled={isReadOnly}
          />
          <DateOfBirthSelect
            value={form.date_of_birth}
            onChange={v => update('date_of_birth', v)}
            disabled={isReadOnly}
          />
          {age !== null && (
            <p className="text-sm text-muted-foreground">
              Age: {age} years old
              {isMinor && <span className="text-primary font-medium ml-2">(Parent/guardian consent required)</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Parent Consent */}
      {isMinor && (
        <ParentConsentSection
          parentName={form.parent_name}
          parentSignature={form.parent_signature}
          onParentNameChange={v => update('parent_name', v)}
          onParentSignatureChange={v => update('parent_signature', v)}
          disabled={isReadOnly}
        />
      )}

      {/* Tattoo Details */}
      <Card>
        <CardHeader><CardTitle>Tattoo Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tattoo Description</Label>
            <Textarea
              value={form.procedure_description || ''}
              onChange={e => update('procedure_description', e.target.value || null)}
              disabled={isReadOnly}
              placeholder="e.g. bird, butterfly, rose with geometric patterns..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Placement</Label>
            <Select
              value={placement || ''}
              onValueChange={v => {
                if (v === 'Other') {
                  update('body_area', form.body_area_other || '');
                } else {
                  update('body_area', v);
                  update('body_area_other', '');
                }
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger><SelectValue placeholder="Select placement area" /></SelectTrigger>
              <SelectContent>
                {TATTOO_PLACEMENTS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {placement === 'Other' && (
              <Input
                className="mt-2"
                value={form.body_area_other || (form.body_area && !TATTOO_PLACEMENTS.includes(form.body_area as any) ? form.body_area : '')}
                onChange={e => {
                  update('body_area_other', e.target.value);
                  update('body_area', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Please specify placement area..."
              />
            )}
          </div>

          {/* Where did you find us */}
          <ReferralSourceSection
            value={form.referral_source}
            otherValue={form.referral_source_other}
            onChange={v => update('referral_source', v)}
            onOtherChange={v => update('referral_source_other', v)}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      {/* Consent */}
      <Card>
        <CardHeader><CardTitle>Consent</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/40 bg-background/30 backdrop-blur-sm p-4 text-sm leading-relaxed text-foreground/80">
            {CONSENT_TEXT}
          </div>
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                form.accepted_terms
                  ? 'border-accent bg-accent'
                  : 'border-input bg-background'
              }`}
              onClick={() => !isReadOnly && update('accepted_terms', !form.accepted_terms)}
            >
              {form.accepted_terms && (
                <div className="h-2 w-2 rounded-full bg-accent-foreground" />
              )}
            </div>
            <Label className="cursor-pointer" onClick={() => !isReadOnly && update('accepted_terms', !form.accepted_terms)}>
              I have read and understood the consent form
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* GDPR */}
      <Card>
        <CardHeader><CardTitle>GDPR Data Protection</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/40 bg-background/30 backdrop-blur-sm p-4 text-sm leading-relaxed text-foreground/80">
            {GDPR_TEXT}
          </div>
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                form.gdpr_email_consent
                  ? 'border-accent bg-accent'
                  : 'border-input bg-background'
              }`}
              onClick={() => !isReadOnly && update('gdpr_email_consent', !form.gdpr_email_consent)}
            >
              {form.gdpr_email_consent && (
                <div className="h-2 w-2 rounded-full bg-accent-foreground" />
              )}
            </div>
            <Label className="cursor-pointer" onClick={() => !isReadOnly && update('gdpr_email_consent', !form.gdpr_email_consent)}>
              I consent to receiving email campaigns and informational messages from the studio
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader><CardTitle>Signature</CardTitle></CardHeader>
        <CardContent>
          <SignaturePad
            value={form.client_signature}
            onChange={v => update('client_signature', v)}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex gap-3 justify-end pb-8">
          <Button onClick={() => {
            const newErrors: Record<string, string> = {};
            if (!form.first_name.trim()) newErrors.name = 'Full name is required';
            if (!form.email.trim()) newErrors.email = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email address';
            if (!form.date_of_birth) newErrors.dob = 'Date of birth is required';
            if (!form.body_area) newErrors.body_area = 'Tattoo placement is required';
            if (!form.client_signature) newErrors.signature = 'Signature is required';
            if (!form.accepted_terms) newErrors.terms = 'You must accept the terms';
            if (Object.keys(newErrors).length > 0) {
              setErrors(newErrors);
              return;
            }
            onSave(form);
          }} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      )}
    </div>
  );
}
