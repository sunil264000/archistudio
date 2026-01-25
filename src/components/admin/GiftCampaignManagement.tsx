import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Gift, Plus, Pencil, Trash2, Loader2, Calendar, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
  eligible_users: string;
  random_percent: number | null;
  access_duration_hours: number | null;
  cta_text: string;
  custom_messages: string[];
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
}

export function GiftCampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [claimsCount, setClaimsCount] = useState<Record<string, number>>({});

  // Form state
  const [form, setForm] = useState({
    name: '',
    start_at: '',
    end_at: '',
    is_active: true,
    eligible_users: 'all',
    random_percent: 50,
    access_duration_hours: 24,
    cta_text: 'Start Learning',
    custom_messages: [''],
    selectedCourses: [] as string[],
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_gift_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse custom_messages from JSONB
      const parsedCampaigns = (data || []).map(c => ({
        ...c,
        custom_messages: Array.isArray(c.custom_messages) ? c.custom_messages as unknown as string[] : []
      })) as Campaign[];
      setCampaigns(parsedCampaigns);

      // Fetch claims count for each campaign
      const counts: Record<string, number> = {};
      for (const campaign of parsedCampaigns) {
        const { count } = await supabase
          .from('login_gift_claims')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);
        counts[campaign.id] = count || 0;
      }
      setClaimsCount(counts);
    } catch (error: any) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, is_published')
      .eq('is_published', true)
      .order('title');
    setCourses(data || []);
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCourses();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      start_at: '',
      end_at: '',
      is_active: true,
      eligible_users: 'all',
      random_percent: 50,
      access_duration_hours: 24,
      cta_text: 'Start Learning',
      custom_messages: [''],
      selectedCourses: [],
    });
    setEditingCampaign(null);
  };

  const handleEdit = async (campaign: Campaign) => {
    setEditingCampaign(campaign);
    
    // Fetch linked courses
    const { data: linkedCourses } = await supabase
      .from('login_gift_campaign_courses')
      .select('course_id')
      .eq('campaign_id', campaign.id);

    setForm({
      name: campaign.name,
      start_at: campaign.start_at.slice(0, 16), // Format for datetime-local
      end_at: campaign.end_at.slice(0, 16),
      is_active: campaign.is_active,
      eligible_users: campaign.eligible_users,
      random_percent: campaign.random_percent || 50,
      access_duration_hours: campaign.access_duration_hours || 24,
      cta_text: campaign.cta_text || 'Start Learning',
      custom_messages: campaign.custom_messages.length > 0 ? campaign.custom_messages : [''],
      selectedCourses: linkedCourses?.map(lc => lc.course_id) || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.start_at || !form.end_at) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
    }

    if (form.custom_messages.filter(m => m.trim()).length === 0) {
      toast.error('Please add at least one custom message');
      return;
    }

    setSaving(true);
    try {
      const campaignData = {
        name: form.name,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        is_active: form.is_active,
        eligible_users: form.eligible_users,
        random_percent: form.eligible_users === 'random_percent' ? form.random_percent : null,
        access_duration_hours: form.access_duration_hours || null,
        cta_text: form.cta_text,
        custom_messages: form.custom_messages.filter(m => m.trim()),
      };

      let campaignId: string;

      if (editingCampaign) {
        const { error } = await supabase
          .from('login_gift_campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
        if (error) throw error;
        campaignId = editingCampaign.id;

        // Delete existing course links
        await supabase
          .from('login_gift_campaign_courses')
          .delete()
          .eq('campaign_id', campaignId);
      } else {
        const { data, error } = await supabase
          .from('login_gift_campaigns')
          .insert(campaignData)
          .select()
          .single();
        if (error) throw error;
        campaignId = data.id;
      }

      // Insert course links
      const courseLinks = form.selectedCourses.map(courseId => ({
        campaign_id: campaignId,
        course_id: courseId,
      }));

      const { error: linkError } = await supabase
        .from('login_gift_campaign_courses')
        .insert(courseLinks);
      
      if (linkError) throw linkError;

      toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
      setDialogOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('login_gift_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (error: any) {
      toast.error('Failed to delete campaign');
    }
  };

  const addMessage = () => {
    if (form.custom_messages.length < 5) {
      setForm(prev => ({
        ...prev,
        custom_messages: [...prev.custom_messages, ''],
      }));
    }
  };

  const updateMessage = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      custom_messages: prev.custom_messages.map((m, i) => i === index ? value : m),
    }));
  };

  const removeMessage = (index: number) => {
    if (form.custom_messages.length > 1) {
      setForm(prev => ({
        ...prev,
        custom_messages: prev.custom_messages.filter((_, i) => i !== index),
      }));
    }
  };

  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_at);
    const end = new Date(campaign.end_at);

    if (!campaign.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (now < start) return { label: 'Scheduled', variant: 'outline' as const };
    if (now > end) return { label: 'Ended', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                Login Gift Campaigns
              </CardTitle>
              <CardDescription>
                Create time-based gift campaigns that give users free course access on login
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCampaign ? 'Edit Campaign' : 'Create Gift Campaign'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure a time-based gift that grants free course access to users on login
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Campaign Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., New Year Gift 2025"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_at">Start Date & Time *</Label>
                      <Input
                        id="start_at"
                        type="datetime-local"
                        value={form.start_at}
                        onChange={(e) => setForm(prev => ({ ...prev, start_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_at">End Date & Time *</Label>
                      <Input
                        id="end_at"
                        type="datetime-local"
                        value={form.end_at}
                        onChange={(e) => setForm(prev => ({ ...prev, end_at: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Eligible Users */}
                  <div className="space-y-2">
                    <Label>Eligible Users</Label>
                    <Select
                      value={form.eligible_users}
                      onValueChange={(v) => setForm(prev => ({ ...prev, eligible_users: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="new_only">New Users Only</SelectItem>
                        <SelectItem value="random_percent">Random % of Users</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.eligible_users === 'random_percent' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={form.random_percent}
                          onChange={(e) => setForm(prev => ({ ...prev, random_percent: parseInt(e.target.value) }))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">% of users will receive this gift</span>
                      </div>
                    )}
                  </div>

                  {/* Access Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">Access Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      value={form.access_duration_hours}
                      onChange={(e) => setForm(prev => ({ ...prev, access_duration_hours: parseInt(e.target.value) }))}
                      placeholder="24"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to grant access until campaign ends
                    </p>
                  </div>

                  {/* Select Courses */}
                  <div className="space-y-2">
                    <Label>Select Courses *</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={course.id}
                            checked={form.selectedCourses.includes(course.id)}
                            onCheckedChange={(checked) => {
                              setForm(prev => ({
                                ...prev,
                                selectedCourses: checked
                                  ? [...prev.selectedCourses, course.id]
                                  : prev.selectedCourses.filter(id => id !== course.id)
                              }));
                            }}
                          />
                          <label htmlFor={course.id} className="text-sm cursor-pointer">
                            {course.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Messages */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Custom Messages (2-5)</Label>
                      {form.custom_messages.length < 5 && (
                        <Button type="button" variant="ghost" size="sm" onClick={addMessage}>
                          <Plus className="h-3 w-3 mr-1" /> Add Message
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      System will randomly select one message per user
                    </p>
                    {form.custom_messages.map((msg, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={msg}
                          onChange={(e) => updateMessage(index, e.target.value)}
                          placeholder={`Message ${index + 1}: e.g., "Congratulations! You've been selected for free access to our premium course."`}
                          rows={2}
                        />
                        {form.custom_messages.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMessage(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* CTA Text */}
                  <div className="space-y-2">
                    <Label htmlFor="cta">CTA Button Text</Label>
                    <Input
                      id="cta"
                      value={form.cta_text}
                      onChange={(e) => setForm(prev => ({ ...prev, cta_text: e.target.value }))}
                      placeholder="Start Learning"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Campaign Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Inactive campaigns won't trigger on login
                      </p>
                    </div>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No gift campaigns yet</p>
              <p className="text-sm">Create your first campaign to gift users free course access</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const status = getCampaignStatus(campaign);
                return (
                  <div
                    key={campaign.id}
                    className="border rounded-xl p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(campaign.start_at), 'MMM d, yyyy')} - {format(new Date(campaign.end_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.eligible_users === 'all' && 'All users'}
                            {campaign.eligible_users === 'new_only' && 'New users only'}
                            {campaign.eligible_users === 'random_percent' && `${campaign.random_percent}% random`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            {claimsCount[campaign.id] || 0} claims
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Access: {campaign.access_duration_hours ? `${campaign.access_duration_hours}h` : 'Until campaign end'}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {campaign.custom_messages.length} message(s)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(campaign)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(campaign.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
