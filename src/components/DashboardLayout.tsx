import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  BarChart3,
  Settings,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPw !== newPwConfirm) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated successfully' });
      setPwOpen(false);
      setNewPw('');
      setNewPwConfirm('');
    }
    setChangingPw(false);
  };

  const adminItems = [
    { title: 'Statistics', url: '/admin', icon: BarChart3 },
    { title: 'Management', url: '/admin/management', icon: Settings },
    { title: 'Users', url: '/admin/users', icon: Users },
    { title: 'All Forms', url: '/admin/forms', icon: FileText },
  ];

  const designerItems = [
    { title: 'Dashboard', url: '/designer', icon: LayoutDashboard },
    { title: 'My Forms', url: '/designer/forms', icon: FileText },
  ];

  const items = profile?.role === 'admin' ? adminItems : designerItems;

  return (
    <>
    <Sidebar collapsible="icon" className="glass-dark border-r-0">
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <div className="px-4 py-5">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
                <h2 className="text-sm font-bold tracking-wider text-foreground/80 uppercase">
                  Consent Manager
                </h2>
              </div>
            )}
          </div>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs tracking-widest uppercase">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-primary/10 rounded-lg transition-all duration-200 text-foreground/60 hover:text-foreground"
                        activeClassName="bg-gradient-to-r from-primary/15 to-transparent text-primary font-medium border-l-2 border-primary"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        <div className="p-4 border-t border-primary/10">
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPwOpen(true)}
              className="w-full justify-start text-foreground/40 hover:text-primary hover:bg-primary/10 mb-2"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {!collapsed && 'Settings'}
            </Button>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPwOpen(true)}
              className="w-full text-foreground/40 hover:text-primary hover:bg-primary/10 mb-2"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          )}
          {!collapsed && profile && (
            <div className="mb-3 px-2">
              <p className="text-xs font-medium text-foreground/80 truncate">{profile.full_name}</p>
              <p className="text-xs text-primary/70 capitalize">{profile.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-foreground/40 hover:text-primary hover:bg-primary/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && 'Sign out'}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
    <Dialog open={pwOpen} onOpenChange={setPwOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} placeholder="Re-enter password" />
          </div>
          <Button className="w-full" onClick={handleChangePassword} disabled={changingPw}>
            {changingPw && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full mesh-gradient">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/40 bg-background/40 backdrop-blur-xl px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground font-medium">
              {profile?.full_name}
            </span>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
