import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Shield, Users, Search, Loader2, UserPlus, Crown,
  Settings, Upload, Eye, Trash2, Check
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

type AppRole = 'admin' | 'manager' | 'uploader' | 'moderator' | 'user';

const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  admin: {
    label: 'Admin',
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    description: 'Full access to all features, settings, and user management',
  },
  manager: {
    label: 'Manager',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    description: 'Manage courses, enrollments, and view analytics',
  },
  uploader: {
    label: 'Uploader',
    icon: <Upload className="h-4 w-4" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    description: 'Upload and manage course content and resources',
  },
  moderator: {
    label: 'Moderator',
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    description: 'Moderate Q&A, reviews, and user interactions',
  },
  user: {
    label: 'User',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
    description: 'Standard user with course access',
  },
};

export function RoleManagement() {
  const [userRoles, setUserRoles] = useState<(UserRole & { profile?: UserProfile })[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addingRole, setAddingRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('manager');
  const [saving, setSaving] = useState(false);
  const [removingRole, setRemovingRole] = useState<UserRole | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .order('role');
    
    // Fetch all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email');

    if (rolesError) {
      toast.error(`Failed to load roles: ${rolesError.message}`);
    }
    if (profilesError) {
      toast.error(`Failed to load users: ${profilesError.message}`);
    }
    
    if (profilesData) {
      setProfiles(profilesData);
    }
    
    if (roles && profilesData) {
      const rolesWithProfiles = roles.map(role => ({
        ...role,
        profile: profilesData.find(p => p.user_id === role.user_id),
      }));
      setUserRoles(rolesWithProfiles);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime sync: if roles/users change elsewhere in admin, reflect here
  useEffect(() => {
    const rolesChannel = supabase
      .channel('role-management-user-roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        fetchData();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('role-management-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [fetchData]);

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select a user and role');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole,
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('User already has this role');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Role assigned successfully');
      setAddingRole(false);
      setSelectedUser('');
      setSelectedRole('manager');
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to assign role: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!removingRole) return;
    
    setRemoveLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', removingRole.id);

      if (error) throw error;

      toast.success('Role removed successfully');
      setRemovingRole(null);
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to remove role: ${error.message}`);
    } finally {
      setRemoveLoading(false);
    }
  };

  const filteredRoles = userRoles.filter(r =>
    r.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase())
  );

  // IMPORTANT:
  // Don't hide users just because they already have a role (many installs assign a default 'user' role).
  // We allow picking any user and we handle duplicates gracefully on insert.
  const selectableUsers = profiles;

  const getRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role as AppRole] || ROLE_CONFIG.user;
    return (
      <Badge className={`${config.color} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3">Loading roles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-accent" />
            Role Management
          </h2>
          <p className="text-muted-foreground">Assign and manage user roles and permissions</p>
        </div>
        <Button onClick={() => setAddingRole(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Assign Role
        </Button>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(Object.keys(ROLE_CONFIG) as AppRole[]).map((role) => {
          const config = ROLE_CONFIG[role];
          const count = userRoles.filter(r => r.role === role).length;
          return (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${config.color.replace('text-', 'border-').replace('/10', '/20')}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {config.icon}
                <span className="font-medium">{config.label}</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{config.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Role List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assigned Roles</CardTitle>
              <CardDescription>{userRoles.length} role assignments</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No role assignments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRoles.map((roleEntry, index) => (
                  <motion.div
                    key={roleEntry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-accent font-bold text-lg">
                          {(roleEntry.profile?.full_name || roleEntry.profile?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{roleEntry.profile?.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{roleEntry.profile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(roleEntry.role)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemovingRole(roleEntry)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addingRole} onOpenChange={setAddingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-accent" />
              Assign Role to User
            </DialogTitle>
            <DialogDescription>
              Select a user and assign them a specific role with permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {selectableUsers.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name || user.email || 'Unknown'}
                      {user.email && user.full_name && (
                        <span className="text-muted-foreground ml-2">({user.email})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Role</Label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(ROLE_CONFIG) as AppRole[]).filter(r => r !== 'user').map((role) => {
                  const config = ROLE_CONFIG[role];
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingRole(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={saving || !selectedUser}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Confirmation */}
      <AlertDialog open={!!removingRole} onOpenChange={() => setRemovingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Remove Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the {removingRole?.role} role from this user?
              They will lose all associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              disabled={removeLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
