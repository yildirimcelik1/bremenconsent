export type AppRole = 'admin' | 'designer';
export type ConsentType = 'tattoo' | 'piercing';
export type FormStatus = 'draft' | 'approved';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsentForm {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  approved_at: string | null;
  status: FormStatus;
  consent_type: ConsentType;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  government_id_type: string | null;
  government_id_number: string | null;
  has_allergies: boolean;
  allergies_details: string | null;
  has_medical_conditions: boolean;
  medical_conditions_details: string | null;
  takes_medication: boolean;
  medication_details: string | null;
  pregnant_or_breastfeeding: boolean | null;
  has_skin_condition: boolean | null;
  skin_condition_details: string | null;
  blood_disorder: boolean | null;
  blood_disorder_details: string | null;
  diabetes: boolean | null;
  heart_condition: boolean | null;
  epilepsy: boolean | null;
  hepatitis: boolean | null;
  hiv: boolean | null;
  fainting_history: boolean | null;
  under_influence: boolean | null;
  other_health_notes: string | null;
  procedure_description: string | null;
  body_area: string | null;
  gender: string | null;
  reference_notes: string | null;
  designer_notes: string | null;
  internal_notes: string | null;
  accepted_terms: boolean;
  accepted_aftercare: boolean;
  photo_consent: boolean | null;
  client_signature: string | null;
  signature_date: string | null;
  pdf_url: string | null;
  document_generated_at: string | null;
  price: string | null;
  assigned_artist_id: string | null;
  last_birthday_wish_year: number | null;
}

export interface Artist {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export type ConsentFormInsert = Omit<ConsentForm, 'id' | 'created_at' | 'updated_at'>;
