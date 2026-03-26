import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import type { ConsentForm } from '@/types';

export async function generateAndUploadPdf(form: ConsentForm, artistName?: string): Promise<string | null> {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  const addText = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += size * 0.5;
    }
    y += 2;
  };

  const addField = (label: string, value: string | null | undefined) => {
    if (y > 270) { doc.addPage(); y = margin; }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', margin + 45, y);
    y += 6;
  };

  const addSectionTitle = (title: string) => {
    y += 4;
    if (y > 265) { doc.addPage(); y = margin; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 3;
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = `${form.consent_type === 'tattoo' ? 'Tattoo' : 'Piercing'} Consent Form`;
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Client Info
  addSectionTitle('Client Information');
  addField('Name', `${form.first_name} ${form.last_name}`);
  addField('Date of Birth', form.date_of_birth || '—');
  addField('Phone', form.phone);
  addField('Address', [form.city, form.postal_code, form.country].filter(Boolean).join(', ') || '—');

  // Procedure
  addSectionTitle(form.consent_type === 'tattoo' ? 'Tattoo Details' : 'Piercing Details');
  addField('Body Area', form.body_area);
  if (form.consent_type === 'tattoo') {
    addField('Description', form.procedure_description);
  }

  // Artist & Price
  if (artistName || form.price) {
    addSectionTitle('Studio Details');
    addField('Artist', artistName);
    addField('Price', form.price ? `€${form.price}` : null);
  }

  // Referral
  if (form.reference_notes) {
    addField('Referral Source', form.reference_notes);
  }

  // Parent consent
  if (form.emergency_contact_name) {
    addSectionTitle('Parent/Guardian Consent');
    addField('Parent Name', form.emergency_contact_name);
    addField('Parent Signed', form.emergency_contact_phone ? 'Yes' : 'No');
  }

  // Consent
  addSectionTitle('Consent & GDPR');
  addField('Terms Accepted', form.accepted_terms ? 'Yes' : 'No');
  addField('Email Consent', form.photo_consent ? 'Yes' : 'No');

  // Signature
  addSectionTitle('Signature');
  if (form.client_signature) {
    try {
      if (y > 230) { doc.addPage(); y = margin; }
      doc.addImage(form.client_signature, 'PNG', margin, y, 60, 25);
      y += 30;
    } catch {
      addField('Signature', 'Provided');
    }
  } else {
    addField('Signature', 'Not provided');
  }
  addField('Date', form.signature_date || new Date().toISOString().split('T')[0]);

  // Footer
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, y);

  // Upload to Supabase
  const pdfBlob = doc.output('blob');
  const sanitizedName = `${form.first_name}_${form.last_name}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${sanitizedName}_${form.consent_type}_${form.id.slice(0, 8)}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('consent-pdfs')
    .upload(fileName, pdfBlob, { 
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('PDF upload failed:', uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('consent-pdfs')
    .getPublicUrl(fileName);

  // URL'yi döndür — DB güncellemesi DesignerDashboard'da tek UPDATE içinde yapılır
  return urlData.publicUrl;
}
