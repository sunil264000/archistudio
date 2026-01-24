import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Gift, BookOpen, User, Check, Loader2 } from 'lucide-react';

interface Ebook {
  id: string;
  title: string;
  category: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

export function ManualEbookAccess() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedEbooks, setSelectedEbooks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEbooks();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const fetchEbooks = async () => {
    const { data } = await supabase
      .from('ebooks')
      .select('id, title, category')
      .eq('is_published', true)
      .order('category', { ascending: true });
    
    if (data) setEbooks(data);
  };

  const searchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(10);
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const toggleEbook = (id: string) => {
    const newSelected = new Set(selectedEbooks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEbooks(newSelected);
  };

  const selectAllEbooks = () => {
    if (selectedEbooks.size === ebooks.length) {
      setSelectedEbooks(new Set());
    } else {
      setSelectedEbooks(new Set(ebooks.map(e => e.id)));
    }
  };

  const grantAccess = async () => {
    if (!selectedUser || selectedEbooks.size === 0) {
      toast({
        title: "Missing Selection",
        description: "Please select a user and at least one eBook",
        variant: "destructive",
      });
      return;
    }

    setGranting(true);

    try {
      // Check if user already has any ebook purchases
      const { data: existingPurchase } = await supabase
        .from('ebook_purchases')
        .select('id, ebook_ids')
        .eq('user_id', selectedUser.user_id)
        .eq('status', 'completed')
        .single();

      const ebookIdsArray = Array.from(selectedEbooks);

      if (existingPurchase) {
        // Merge new ebooks with existing ones
        const existingIds = existingPurchase.ebook_ids || [];
        const mergedIds = [...new Set([...existingIds, ...ebookIdsArray])];

        const { error } = await supabase
          .from('ebook_purchases')
          .update({
            ebook_ids: mergedIds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPurchase.id);

        if (error) throw error;
      } else {
        // Create new purchase record
        const { error } = await supabase
          .from('ebook_purchases')
          .insert({
            user_id: selectedUser.user_id,
            ebook_ids: ebookIdsArray,
            total_amount: 0,
            status: 'completed',
            is_full_bundle: selectedEbooks.size === ebooks.length,
          });

        if (error) throw error;
      }

      toast({
        title: "Access Granted!",
        description: `${selectedEbooks.size} eBook(s) access granted to ${selectedUser.email}`,
      });

      // Reset form
      setSelectedUser(null);
      setSelectedEbooks(new Set());
      setSearchQuery('');
    } catch (error: any) {
      console.error("Grant access error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to grant access",
        variant: "destructive",
      });
    } finally {
      setGranting(false);
    }
  };

  const categories = [...new Set(ebooks.map(e => e.category))];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select User
          </CardTitle>
          <CardDescription>
            Search for a user by email or name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {users.length > 0 && (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedUser?.user_id === user.user_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{user.full_name || 'No name'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedUser && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="font-medium">Selected:</span>
              </div>
              <p className="text-sm mt-1">{selectedUser.full_name || selectedUser.email}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* eBook Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Select eBooks
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>{selectedEbooks.size} of {ebooks.length} selected</span>
            <Button variant="outline" size="sm" onClick={selectAllEbooks}>
              {selectedEbooks.size === ebooks.length ? 'Deselect All' : 'Select All'}
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {categories.map((category) => {
                const categoryBooks = ebooks.filter(e => e.category === category);
                return (
                  <div key={category}>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {category} ({categoryBooks.length})
                    </Label>
                    <div className="mt-2 space-y-1">
                      {categoryBooks.map((ebook) => (
                        <div
                          key={ebook.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedEbooks.has(ebook.id)
                              ? 'bg-primary/10'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => toggleEbook(ebook.id)}
                        >
                          <Checkbox
                            checked={selectedEbooks.has(ebook.id)}
                            onCheckedChange={() => toggleEbook(ebook.id)}
                          />
                          <span className="text-sm line-clamp-1">{ebook.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Grant Access Button */}
      <div className="lg:col-span-2">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-semibold">Grant Free Access</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser ? selectedUser.email : 'No user selected'} • {selectedEbooks.size} book(s)
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-success hover:bg-success/90"
                onClick={grantAccess}
                disabled={!selectedUser || selectedEbooks.size === 0 || granting}
              >
                {granting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Grant Access
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
