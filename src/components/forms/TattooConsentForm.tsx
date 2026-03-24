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
import { Loader2, Save, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface TattooFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  postal_code: string | null;
  date_of_birth: string | null;
  gender: string | null;
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

const TATTOO_CLIENT_DECLARATION = [
  'I have considered the information "Information for the client accompanying the consent form".',
  'I have been informed about possible risks and complications associated with the placement of the tattoo and understand the information.',
  'I am currently not under the influence of alcohol, drugs or other substances that affect my experience, free will or influence my judgment.',
  'The aftercare procedure has been clearly explained to me and I understand which actions I have to perform and what precautions I should take. I received my copy of the aftercare procedure.',
  'I agree that the tattooing as described in the ink passport is carried out by the named tattoo artist.',
  'I confirm that the tattoo artist may keep this consent form on file.',
  'ATTENTION: Hand, fingers, inner lips and feet tattoos may fade once they are healed. The skin in the mentioned areas is thicker and subjected to friction, therefore there is a higher risk of needing a touch-up.',
  'I confirm that I have given the above information and statements in good faith and that they are correct.'
];

const TATTOO_ARTIST_DECLARATION = [
  'I confirm that tattooing is done under hygienic conditions with suitable sterile instruments and safe techniques and according to EN 17169 and corresponding national requirements.',
  'I confirm that a copy of this signed consent form has been presented to the client and that the client has been advised to keep the information.'
];

const TATTOO_MEDIA_CONSENT = 'I allow all my images taken and recorded in the studio to be shared on social media.';

const GDPR_TEXT = `In accordance with GDPR (General Data Protection Regulation), your personal data will be processed solely for the purpose of this consent form and studio records. Your data will be stored securely and will not be shared with third parties without your explicit consent. This includes your name, contact information, date of birth, and health-related data necessary for the procedure.`;

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
    gender: initialData?.gender || null,
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
              <Label>First Name *</Label>
              <Input
                value={form.first_name}
                onChange={e => {
                  update('first_name', e.target.value);
                  setErrors(prev => ({ ...prev, first_name: '' }));
                }}
                disabled={isReadOnly}
                placeholder="John"
                className={errors.first_name ? 'border-destructive' : ''}
              />
              {errors.first_name && <p className="text-xs text-destructive mt-1">{errors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={form.last_name}
                onChange={e => {
                  update('last_name', e.target.value);
                  setErrors(prev => ({ ...prev, last_name: '' }));
                }}
                disabled={isReadOnly}
                placeholder="Doe"
                className={errors.last_name ? 'border-destructive' : ''}
              />
              {errors.last_name && <p className="text-xs text-destructive mt-1">{errors.last_name}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email Address <span className="text-rose-500 font-bold">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => { update('email', e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                disabled={isReadOnly}
                placeholder="email@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
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
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Date of Birth <span className="text-rose-500 font-bold">*</span></Label>
            <DateOfBirthSelect
              value={form.date_of_birth}
              onChange={v => {
                update('date_of_birth', v);
                setErrors(prev => ({ ...prev, dob: '' }));
              }}
              disabled={isReadOnly}
            />
            {errors.dob && <p className="text-xs text-destructive mt-1">{errors.dob}</p>}
          </div>
          {age !== null && (
            <p className="text-sm text-muted-foreground">
              Age: {age} years old
              {isMinor && <span className="text-primary font-medium ml-2">(Parent/guardian consent required)</span>}
            </p>
          )}
          {/* Gender */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Gender <span className="text-rose-500 font-bold">*</span></Label>
            {errors.gender && <p className="text-xs text-destructive mb-2">{errors.gender}</p>}
            <div className="flex gap-2">
              {['Male', 'Female', 'Other'].map(g => (
                <button
                  key={g}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => !isReadOnly && update('gender', form.gender === g ? null : g)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    form.gender === g
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/60 bg-background/50 text-foreground hover:border-primary/40 hover:bg-primary/5'
                  } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
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

      {/* Consent & GDPR Confirmation */}
      <Card className="border-accent/20 bg-accent/5 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Consent Confirmation</CardTitle>
          <div className="h-px bg-border/40 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 pt-0 mt-4">
          <div className="flex flex-wrap gap-3 py-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-6 bg-background/50 backdrop-blur-sm border-border/60 hover:border-accent/50 hover:bg-accent/5 transition-all gap-2 group">
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  Read full consent form
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-accent/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center border-b pb-4 mb-6">TATTOO CONSENT FORM</DialogTitle>
                </DialogHeader>
                <div className="space-y-8 py-2">
                  <div className="text-center space-y-1 text-sm text-muted-foreground mb-8">
                    <p className="font-bold text-foreground">Cleopatra Ink Tattoo & Piercing</p>
                    <p>Spuistraat 197 1012 VN</p>
                    <p>Amsterdam</p>
                  </div>

                  <section className="space-y-4">
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Client Declaration</h3>
                    <ul className="space-y-3">
                      {TATTOO_CLIENT_DECLARATION.map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
                          <span className="text-accent shrink-0 mt-1.5">•</span>
                          <span className={point.includes('ATTENTION:') ? 'font-medium text-foreground' : ''}>
                            {point.startsWith('ATTENTION:') ? (
                              <>
                                <strong className="text-orange-500">ATTENTION:</strong>
                                {point.replace('ATTENTION:', '')}
                              </>
                            ) : point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Tattoo Artist Declaration</h3>
                    <ul className="space-y-3">
                      {TATTOO_ARTIST_DECLARATION.map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
                          <span className="text-accent shrink-0 mt-1.5">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Media & Image Consent</h3>
                    <p className="text-sm leading-relaxed text-foreground/80 pl-2 italic">
                      {TATTOO_MEDIA_CONSENT}
                    </p>
                  </section>

                  <section className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Email Notifications</h3>
                    <p className="text-sm leading-relaxed text-foreground/80 pl-2">
                      I accept to receive email campaigns and informational messages from the studio. (Kampanyalardan ve bilgilendirmelerden haberdar olmak için e-posta almayı kabul ediyorum.)
                    </p>
                  </section>

                  <div className="flex justify-center pt-6">
                    <Button variant="secondary" className="px-8" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
                      I have read and understand
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-6 bg-background/50 backdrop-blur-sm border-border/60 hover:border-accent/50 hover:bg-accent/5 transition-all gap-2 group">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  Read GDPR policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-accent/20">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    GDPR Data Protection
                  </DialogTitle>
                </DialogHeader>
                <div className="text-sm leading-relaxed text-foreground/80 space-y-4">
                  <p>{GDPR_TEXT}</p>
                  <p className="text-xs text-muted-foreground italic border-t pt-4">In accordance with GDPR (General Data Protection Regulation), your personal data will be processed solely for the purpose of this consent form and studio records.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4 border-t border-border/40 pt-6">
            <div 
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer group"
              onClick={() => !isReadOnly && update('accepted_terms', !form.accepted_terms)}
            >
              <div
                className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                  form.accepted_terms
                    ? 'border-accent bg-accent scale-105 shadow-sm shadow-accent/20'
                    : 'border-input bg-background border-border/60'
                }`}
              >
                {form.accepted_terms && (
                  <CheckCircle className="h-4 w-4 text-accent-foreground" />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium text-foreground cursor-pointer group-hover:text-accent transition-colors">
                  I have read and understood the consent form. <span className="text-rose-500 font-bold">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">Tüm maddeleri okudum ve uygulama risklerini kabul ediyorum.</p>
              </div>
            </div>
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
            if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
            if (!form.last_name.trim()) newErrors.last_name = 'Last name is required';
            if (!form.email.trim()) newErrors.email = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email address';
            if (!form.country) newErrors.country = 'Country is required';
            if (!form.city) newErrors.city = 'City is required';
            if (!form.postal_code) newErrors.postal_code = 'Postal code is required';
            if (!form.date_of_birth) newErrors.dob = 'Date of birth is required';
            if (!form.gender) newErrors.gender = 'Gender is required';
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
