import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { TattooConsentForm, type TattooFormData } from '@/components/forms/TattooConsentForm';
import { PiercingConsentForm, type PiercingFormData } from '@/components/forms/PiercingConsentForm';
import type { ConsentForm, ConsentType } from '@/types';

export default function ConsentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role } = useAuth();
  const isNew = !id || id === 'new';

  const typeFromUrl = searchParams.get('type') as ConsentType | null;
  const [consentType, setConsentType] = useState<ConsentType | null>(typeFromUrl);
  const [existingForm, setExistingForm] = useState<ConsentForm | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [existingId, setExistingId] = useState<string | null>(null);

  const isApproved = existingForm?.status === 'approved';
  const isReadOnly = isApproved && role !== 'admin';

  useEffect(() => {
    if (!isNew && id) {
      supabase
        .from('consent_forms')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            toast({ title: 'Form not found', variant: 'destructive' });
            navigate(-1);
            return;
          }
          const d = data as unknown as ConsentForm;
          setExistingForm(d);
          setConsentType(d.consent_type);
          setExistingId(d.id);
          setLoading(false);
        });
    }
  }, [id, isNew]);

  const saveForm = async (formData: TattooFormData | PiercingFormData, type: ConsentType) => {
    if (!formData.first_name) {
      toast({ title: 'Error', description: 'Full name is required.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const payload: Record<string, any> = {
      created_by: user!.id,
      status: 'draft',
      consent_type: type,
      first_name: formData.first_name,
      last_name: formData.last_name || '',
      email: (formData as any).email || null,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
      postal_code: formData.postal_code,
      date_of_birth: formData.date_of_birth,
      body_area: formData.body_area,
      gender: (formData as any).gender || null,
      accepted_terms: formData.accepted_terms,
      photo_consent: (formData as any).gdpr_email_consent ?? false,
      client_signature: formData.client_signature,
      signature_date: formData.client_signature ? new Date().toISOString().split('T')[0] : null,
      reference_notes: formData.referral_source || null,
      emergency_contact_name: formData.parent_name || null,
      emergency_contact_phone: formData.parent_signature || null,
    };

    if ('procedure_description' in formData) {
      payload.procedure_description = (formData as TattooFormData).procedure_description;
    }

    let result;
    if (existingId) {
      result = await supabase.from('consent_forms').update(payload).eq('id', existingId);
    } else {
      result = await supabase.from('consent_forms').insert(payload as any).select().single();
    }

    if (result.error) {
      toast({ title: 'Save failed', description: result.error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Form saved' });
      const dashboardPath = role === 'admin' ? '/admin' : '/designer';
      navigate(dashboardPath, { replace: true });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // No type selected — redirect to dashboard
  if (isNew && !consentType) {
    navigate(-1);
    return null;
  }

  const initialData = existingForm ? {
    first_name: existingForm.first_name,
    last_name: existingForm.last_name,
    email: existingForm.email || '',
    phone: existingForm.phone,
    country: existingForm.country,
    city: existingForm.city,
    postal_code: existingForm.postal_code,
    date_of_birth: existingForm.date_of_birth,
    gender: existingForm.gender,
    body_area: existingForm.body_area,
    procedure_description: existingForm.procedure_description,
    accepted_terms: existingForm.accepted_terms,
    gdpr_email_consent: existingForm.photo_consent ?? false,
    client_signature: existingForm.client_signature,
    referral_source: existingForm.reference_notes,
    referral_source_other: '',
    parent_name: existingForm.emergency_contact_name || '',
    parent_signature: existingForm.emergency_contact_phone || null,
  } : undefined;

  const title = isNew
    ? `New ${consentType === 'tattoo' ? 'Tattoo' : 'Piercing'} Consent Form`
    : isApproved
      ? 'Approved Form'
      : `Edit ${consentType === 'tattoo' ? 'Tattoo' : 'Piercing'} Draft`;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => isNew && !existingId ? setConsentType(null) : navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {isReadOnly && <p className="text-sm text-muted-foreground">This form is approved and read-only.</p>}
          </div>
        </div>

        {consentType === 'tattoo' ? (
          <TattooConsentForm
            initialData={initialData}
            onSave={data => saveForm(data, 'tattoo')}
            saving={saving}
            isReadOnly={isReadOnly}
          />
        ) : (
          <PiercingConsentForm
            initialData={initialData}
            onSave={data => saveForm(data, 'piercing')}
            saving={saving}
            isReadOnly={isReadOnly}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
