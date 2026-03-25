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
  'Ich habe die Information "Informationen für den Kunden zum Einverständnisbogen" zur Kenntnis genommen.',
  'Ich wurde über die möglichen Risiken und Komplikationen im Zusammenhang mit dem Tätowieren informiert und habe die Informationen verstanden.',
  'Ich stehe derzeit nicht unter dem Einfluss von Alkohol, Drogen oder anderen Substanzen, die mein Erleben, meinen freien Willen oder mein Urteilsvermögen beeinträchtigen könnten.',
  'Die Nachpflege wurde mir klar erklärt und ich verstehe, welche Maßnahmen ich ergreifen und welche Vorsichtsmaßnahmen ich treffen muss. Ich habe meine Kopie der Nachpflegeanleitung erhalten.',
  'Ich erkläre mich damit einverstanden, dass die im Ink-Pass beschriebene Tätowierung von dem genannten Tätowierer durchgeführt wird.',
  'Ich bestätige, dass der Tätowierer diesen Einverständnisbogen zu den Unterlagen nehmen darf.',
  'ACHTUNG: Tätowierungen an Händen, Fingern, Innenseiten der Lippen und Füßen können nach der Heilung verblassen. Die Haut in diesen Bereichen ist dicker und Reibung ausgesetzt, daher besteht ein höheres Risiko für Nachbesserungen.',
  'Ich bestätige, dass ich die oben genannten Informationen und Erklärungen nach bestem Wissen und Gewissen abgegeben habe und dass diese korrekt sind.'
];

const TATTOO_ARTIST_DECLARATION = [
  'Ich bestätige, dass das Tätowieren unter hygienischen Bedingungen mit geeigneten sterilen Instrumenten und sicheren Techniken gemäß EN 17169 und den entsprechenden nationalen Anforderungen erfolgt.',
  'Ich bestätige, dass dem Kunden eine Kopie dieses unterzeichneten Einverständnisbogens ausgehändigt wurde und der Kunde angewiesen wurde, die Informationen aufzubewahren.'
];

const TATTOO_MEDIA_CONSENT = 'Ich erlaube, dass alle meine im Studio aufgenommenen Bilder in den sozialen Medien geteilt werden.';

const TATTOO_MARKETING_CONSENT = 'Ich erkläre mich damit einverstanden, Informationsmitteilungen und Marketingkampagnen vom Studio zu erhalten.';

const GDPR_TEXT = `In Übereinstimmung mit der DSGVO (Datenschutz-Grundverordnung) werden Ihre personenbezogenen Daten ausschließlich zum Zweck dieses Einverständnisbogens und der Unterlagen des Studios verarbeitet. Ihre Daten werden sicher gespeichert und ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben. Dies umfasst Ihren Namen, Ihre Kontaktinformationen, Ihr Geburtsdatum und gesundheitsbezogene Daten, die für den Eingriff erforderlich sind.`;

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
    country: initialData?.country || 'Deutschland',
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
        <CardHeader><CardTitle>Kundeninformationen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Vorname *</Label>
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
              <Label>Nachname *</Label>
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
              <Label>E-Mail-Adresse <span className="text-rose-500 font-bold">*</span></Label>
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
              <Label>Telefonnummer <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
            <Label className="flex items-center gap-2">Geburtsdatum <span className="text-rose-500 font-bold">*</span></Label>
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
              Alter: {age} Jahre alt
              {isMinor && <span className="text-primary font-medium ml-2">(Einwilligung der Eltern/Erziehungsberechtigten erforderlich)</span>}
            </p>
          )}
          {/* Gender */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Geschlecht <span className="text-rose-500 font-bold">*</span></Label>
            {errors.gender && <p className="text-xs text-destructive mb-2">{errors.gender}</p>}
            <div className="flex gap-2">
              {['Männlich', 'Weiblich', 'Sonstiges'].map(g => (
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
        <CardHeader><CardTitle>Tattoo-Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tattoo-Beschreibung</Label>
            <Textarea
              value={form.procedure_description || ''}
              onChange={e => update('procedure_description', e.target.value || null)}
              disabled={isReadOnly}
              placeholder="z.B. Vogel, Schmetterling, Rose mit geometrischen Mustern..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Platzierung</Label>
            <Select
              value={placement || ''}
              onValueChange={v => {
                if (v === 'Sonstiges') {
                  update('body_area', form.body_area_other || '');
                } else {
                  update('body_area', v);
                  update('body_area_other', '');
                }
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger><SelectValue placeholder="Platzierungsbereich auswählen" /></SelectTrigger>
              <SelectContent>
                {TATTOO_PLACEMENTS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {placement === 'Sonstiges' && (
              <Input
                className="mt-2"
                value={form.body_area_other || (form.body_area && !TATTOO_PLACEMENTS.includes(form.body_area as any) ? form.body_area : '')}
                onChange={e => {
                  update('body_area_other', e.target.value);
                  update('body_area', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Bitte Platzierungsbereich angeben..."
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
          <CardTitle className="text-xl">Einwilligungsbestätigung</CardTitle>
          <div className="h-px bg-border/40 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 pt-0 mt-4">
          <div className="flex flex-wrap gap-3 py-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-6 bg-background/50 backdrop-blur-sm border-border/60 hover:border-accent/50 hover:bg-accent/5 transition-all gap-2 group">
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  Einverständnisbogen lesen
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
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Kundenerklärung</h3>
                    <ul className="space-y-3">
                      {TATTOO_CLIENT_DECLARATION.map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
                          <span className="text-accent shrink-0 mt-1.5">•</span>
                          <span className={point.includes('ACHTUNG:') ? 'font-medium text-foreground' : ''}>
                            {point.startsWith('ACHTUNG:') ? (
                              <>
                                <strong className="text-orange-500">ACHTUNG:</strong>
                                {point.replace('ACHTUNG:', '')}
                              </>
                            ) : point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Erklärung des Tätowierers</h3>
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
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Einwilligung zu Bildaufnahmen</h3>
                    <p className="text-sm leading-relaxed text-foreground/80 pl-2 italic">
                      {TATTOO_MEDIA_CONSENT}
                    </p>
                  </section>

                  <section className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="font-bold text-lg tracking-tight uppercase border-l-4 border-accent pl-3">Informationsbenachrichtigungen</h3>
                    <p className="text-sm leading-relaxed text-foreground/80 pl-2">
                      {TATTOO_MARKETING_CONSENT}
                    </p>
                  </section>

                  <div className="flex justify-center pt-6">
                    <Button variant="secondary" className="px-8" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
                      Ich habe alles gelesen und verstanden
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-6 bg-background/50 backdrop-blur-sm border-border/60 hover:border-accent/50 hover:bg-accent/5 transition-all gap-2 group">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  DSGVO-Richtlinie lesen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-accent/20">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                  DSGVO-Datenschutz
                  </DialogTitle>
                </DialogHeader>
                <div className="text-sm leading-relaxed text-foreground/80 space-y-4">
                  <p>{GDPR_TEXT}</p>
                  <p className="text-xs text-muted-foreground italic border-t pt-4">In Übereinstimmung mit der DSGVO (Datenschutz-Grundverordnung) werden Ihre personenbezogenen Daten ausschließlich zum Zweck dieses Einverständnisbogens und der Unterlagen des Studios verarbeitet.</p>
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
        <CardHeader><CardTitle>Unterschrift</CardTitle></CardHeader>
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
            if (!form.first_name.trim()) newErrors.first_name = 'Vorname ist erforderlich';
            if (!form.last_name.trim()) newErrors.last_name = 'Nachname ist erforderlich';
            if (!form.email.trim()) newErrors.email = 'E-Mail ist erforderlich';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Ungültige E-Mail-Adresse';
            if (!form.country) newErrors.country = 'Land ist erforderlich';
            if (!form.city) newErrors.city = 'Stadt ist erforderlich';
            if (!form.postal_code) newErrors.postal_code = 'Postleitzahl ist erforderlich';
            if (!form.date_of_birth) newErrors.dob = 'Geburtsdatum ist erforderlich';
            if (!form.phone) newErrors.phone = 'Telefonnummer ist erforderlich';
    if (!form.gender) newErrors.gender = 'Geschlecht ist erforderlich';
            if (!form.body_area) newErrors.body_area = 'Tattoo-Platzierung ist erforderlich';
            if (!form.client_signature) newErrors.signature = 'Unterschrift ist erforderlich';
            if (!form.accepted_terms) newErrors.terms = 'Sie müssen die Bedingungen akzeptieren';
            if (Object.keys(newErrors).length > 0) {
              setErrors(newErrors);
              return;
            }
            onSave(form);
          }} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" /> Speichern
          </Button>
        </div>
      )}
    </div>
  );
}
