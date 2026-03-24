import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AdminUsersSection } from '@/components/AdminUsersSection';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage staff accounts and invitations</p>
        </div>
        <AdminUsersSection />
      </div>
    </DashboardLayout>
  );
}
