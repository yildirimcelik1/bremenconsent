
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'designer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'designer')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Consent forms table
CREATE TABLE public.consent_forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    approved_at timestamptz,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
    consent_type text NOT NULL CHECK (consent_type IN ('tattoo', 'piercing')),
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date,
    email text,
    phone text,
    address_line_1 text,
    address_line_2 text,
    city text,
    postal_code text,
    country text,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relationship text,
    government_id_type text,
    government_id_number text,
    has_allergies boolean DEFAULT false,
    allergies_details text,
    has_medical_conditions boolean DEFAULT false,
    medical_conditions_details text,
    takes_medication boolean DEFAULT false,
    medication_details text,
    pregnant_or_breastfeeding boolean,
    has_skin_condition boolean,
    skin_condition_details text,
    blood_disorder boolean,
    blood_disorder_details text,
    diabetes boolean,
    heart_condition boolean,
    epilepsy boolean,
    hepatitis boolean,
    hiv boolean,
    fainting_history boolean,
    under_influence boolean,
    other_health_notes text,
    procedure_description text,
    body_area text,
    reference_notes text,
    designer_notes text,
    internal_notes text,
    accepted_terms boolean DEFAULT false,
    accepted_aftercare boolean DEFAULT false,
    photo_consent boolean,
    client_signature text,
    signature_date date,
    pdf_url text,
    document_generated_at timestamptz
);
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER consent_forms_updated_at
    BEFORE UPDATE ON public.consent_forms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'designer')
    );
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
        NEW.id,
        (COALESCE(NEW.raw_user_meta_data->>'role', 'designer'))::app_role
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for consent_forms
CREATE POLICY "Admins full access to forms" ON public.consent_forms
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Designers can read own forms" ON public.consent_forms
    FOR SELECT TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Designers can create forms" ON public.consent_forms
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Designers can update own forms" ON public.consent_forms
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());
