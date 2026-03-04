import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Upload, Eye } from 'lucide-react';

interface CertificateSettings {
  id: string;
  logo_url: string | null;
  background_color: string;
  primary_color: string;
  accent_color: string;
  title_color: string;
  body_text_color: string;
  tagline_color: string;
  font_family: string;
  institution_name: string;
  institution_tagline: string;
  signature_name: string;
  signature_title: string;
  show_border: boolean;
  border_style: string;
}

const defaultSettings: CertificateSettings = {
  id: '',
  logo_url: null,
  background_color: '#ffffff',
  primary_color: '#1a1a1a',
  accent_color: '#c45a32',
  title_color: '#1a1a1a',
  body_text_color: '#4a4a4a',
  tagline_color: '#6b7280',
  font_family: 'Playfair Display',
  institution_name: 'Archistudio',
  institution_tagline: 'Architecture Learning Platform',
  signature_name: 'Archistudio',
  signature_title: 'Founder & Lead Instructor',
  show_border: true,
  border_style: 'classic',
};

const fontOptions = [
  'Playfair Display',
  'Georgia',
  'Times New Roman',
  'Merriweather',
  'Lora',
  'Libre Baskerville',
];

const borderStyles = [
  { value: 'classic', label: 'Classic Double Border' },
  { value: 'modern', label: 'Modern Single Line' },
  { value: 'elegant', label: 'Elegant Gold Corners' },
  { value: 'minimal', label: 'Minimal' },
];

export function CertificateTemplateSettings() {
  const [settings, setSettings] = useState<CertificateSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('certificate_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          logo_url: data.logo_url,
          background_color: data.background_color || '#ffffff',
          primary_color: data.primary_color || '#1a1a1a',
          accent_color: data.accent_color || '#c45a32',
          title_color: (data as any).title_color || '#1a1a1a',
          body_text_color: (data as any).body_text_color || '#4a4a4a',
          tagline_color: (data as any).tagline_color || '#6b7280',
          font_family: data.font_family || 'Playfair Display',
          institution_name: data.institution_name || 'Archistudio',
          institution_tagline: data.institution_tagline || 'Architecture Learning Platform',
          signature_name: data.signature_name || 'Archistudio',
          signature_title: data.signature_title || 'Founder & Lead Instructor',
          show_border: data.show_border ?? true,
          border_style: data.border_style || 'classic',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load certificate settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `certificate-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson-resources')
        .upload(`logos/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lesson-resources')
        .getPublicUrl(`logos/${fileName}`);

      setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('certificate_settings')
        .update({
          logo_url: settings.logo_url,
          background_color: settings.background_color,
          primary_color: settings.primary_color,
          accent_color: settings.accent_color,
          title_color: settings.title_color,
          body_text_color: settings.body_text_color,
          tagline_color: settings.tagline_color,
          font_family: settings.font_family,
          institution_name: settings.institution_name,
          institution_tagline: settings.institution_tagline,
          signature_name: settings.signature_name,
          signature_title: settings.signature_title,
          show_border: settings.show_border,
          border_style: settings.border_style,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', settings.id);

      if (error) throw error;
      toast.success('Certificate template saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save certificate settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const previewUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate?preview=true`;
    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branding</CardTitle>
            <CardDescription>Customize your certificate appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Certificate Logo"
                    className="h-16 w-auto object-contain border rounded p-1"
                  />
                ) : (
                  <div className="h-16 w-24 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">
                    No logo
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload">
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        Upload Logo
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution_name">Institution Name</Label>
              <Input id="institution_name" value={settings.institution_name} onChange={(e) => setSettings(prev => ({ ...prev, institution_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution_tagline">Tagline</Label>
              <Input id="institution_tagline" value={settings.institution_tagline} onChange={(e) => setSettings(prev => ({ ...prev, institution_tagline: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {/* Signature Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Signature</CardTitle>
            <CardDescription>Signatory information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature_name">Signatory Name</Label>
              <Input id="signature_name" value={settings.signature_name} onChange={(e) => setSettings(prev => ({ ...prev, signature_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature_title">Signatory Title</Label>
              <Input id="signature_title" value={settings.signature_title} onChange={(e) => setSettings(prev => ({ ...prev, signature_title: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Premium certificate preview — maroon & gold design</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-[1.4/1] max-w-3xl mx-auto rounded-lg overflow-hidden shadow-2xl" style={{ background: '#3d1c2e', padding: '12px' }}>
            <div className="w-full h-full relative" style={{ background: '#fffdf9', fontFamily: settings.font_family }}>
              {/* Gold double border */}
              <div className="absolute pointer-events-none" style={{ top: 6, left: 6, right: 6, bottom: 6, border: '2.5px solid #c9a84c' }} />
              <div className="absolute pointer-events-none" style={{ top: 11, left: 11, right: 11, bottom: 11, border: '1px solid #c9a84c' }} />

              {/* Left maroon wave panel */}
              <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: '22%' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #6b1d3a, #4a1228, #7a2244)' }} />
                <div className="absolute top-0 bottom-0" style={{ right: -20, width: 80, background: '#fffdf9', borderRadius: '50% 0 0 50% / 50% 0 0 50%' }} />
                <div className="absolute top-0 bottom-0" style={{ right: -5, width: 60, background: 'rgba(255,253,249,0.12)', borderRadius: '50% 0 0 60% / 40% 0 0 50%' }} />
                {/* Gold dots */}
                <div className="absolute" style={{ right: 25, top: '15%', bottom: '15%' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="rounded-full" style={{ width: 2.5, height: 2.5, background: '#c9a84c', marginBottom: 6, marginLeft: Math.sin(i * 0.5) * 8 }} />
                  ))}
                </div>
              </div>

              {/* Award badge */}
              <div className="absolute" style={{ top: '6%', right: '6%', zIndex: 5 }}>
                <div className="flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #c9a84c, #e8d48b, #c9a84c)', boxShadow: '0 2px 12px rgba(201,168,76,0.3)' }}>
                  <div className="flex items-center justify-center rounded-full" style={{ width: 54, height: 54, border: '1.5px solid rgba(255,255,255,0.4)' }}>
                    <div className="flex flex-col items-center justify-center rounded-full" style={{ width: 46, height: 46, background: 'linear-gradient(135deg, #6b1d3a, #4a1228)', border: '1px solid #c9a84c50' }}>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 12, fontWeight: 800, color: '#e8d48b' }}>{new Date().getFullYear()}</span>
                      <span style={{ fontSize: 5, fontWeight: 700, color: '#c9a84c', letterSpacing: 2, textTransform: 'uppercase' as const }}>Award</span>
                    </div>
                  </div>
                </div>
                {/* Ribbon tails */}
                <div className="flex justify-center" style={{ marginTop: -4, gap: 6 }}>
                  <div style={{ width: 14, height: 16, background: 'linear-gradient(135deg, #c9a84c, #a67c30)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                  <div style={{ width: 14, height: 16, background: 'linear-gradient(135deg, #c9a84c, #a67c30)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                </div>
              </div>

              {/* Content */}
              <div className="relative flex flex-col h-full" style={{ padding: '7% 8% 5% 26%', zIndex: 4 }}>
                {settings.logo_url && (
                  <img src={settings.logo_url} alt="Logo" className="object-contain mb-1" style={{ maxHeight: 24 }} />
                )}
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2em', fontWeight: 900, color: '#2c1810', letterSpacing: 3, lineHeight: 1, margin: 0 }}>
                  CERTIFICATE
                </h1>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95em', color: '#6b1d3a', letterSpacing: 6, textTransform: 'uppercase' as const, marginTop: 1 }}>
                  of Achievement
                </p>

                <div style={{ width: '100%', height: 1.5, background: 'linear-gradient(90deg, #c9a84c, #e8d48b, #c9a84c)', margin: '10px 0', opacity: 0.6 }} />

                <p style={{ fontSize: '0.5em', color: '#8b7355', letterSpacing: 5, textTransform: 'uppercase' as const, marginBottom: 4 }}>
                  This certificate is proudly presented to
                </p>

                <p style={{ fontFamily: 'Great Vibes, cursive', fontSize: '2.4em', color: '#2c1810', lineHeight: 1.15, marginBottom: 2 }}>
                  Student Name
                </p>
                <div style={{ width: 200, height: 1.5, background: 'linear-gradient(90deg, #c9a84c, #e8d48b, #c9a84c)', marginBottom: 10 }} />

                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.55em', color: '#5a4a3a', lineHeight: 1.8, maxWidth: '75%', fontStyle: 'italic', marginBottom: 6 }}>
                  Having demonstrated exceptional dedication, discipline, and commitment to mastering professional architecture and design skills through {settings.institution_name}.
                </p>

                <p style={{ fontSize: '0.45em', color: '#8b7355', letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 3 }}>
                  For successfully completing
                </p>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '1em', fontWeight: 700, color: '#6b1d3a', letterSpacing: 2 }}>
                  Studio Program Title
                </p>

                {/* Footer with signature and date */}
                <div className="flex justify-between items-end mt-auto" style={{ paddingTop: 12 }}>
                  <div className="text-center" style={{ minWidth: 120 }}>
                    <p style={{ fontFamily: 'Great Vibes, cursive', fontSize: '1.4em', color: '#2c1810', marginBottom: 1 }}>{settings.signature_name}</p>
                    <div style={{ width: 120, height: 1, background: '#2c1810', margin: '0 auto 4px' }} />
                    <p style={{ fontSize: '0.5em', fontWeight: 600, color: '#2c1810', letterSpacing: 1 }}>{settings.signature_name}</p>
                    <p style={{ fontSize: '0.4em', color: '#8b7355', letterSpacing: 1.5, marginTop: 1 }}>{settings.signature_title}</p>
                  </div>
                  <div className="text-center" style={{ minWidth: 120 }}>
                    <div style={{ width: 120, height: 1, background: '#2c1810', margin: '0 auto 4px' }} />
                    <p style={{ fontSize: '0.5em', fontWeight: 600, color: '#2c1810', letterSpacing: 3, textTransform: 'uppercase' as const }}>Date</p>
                    <p style={{ fontSize: '0.45em', color: '#5a4a3a', marginTop: 1 }}>February 14, 2026</p>
                  </div>
                </div>
              </div>

              {/* Seal */}
              <div className="absolute" style={{ bottom: '5%', right: '4%' }}>
                <div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, border: '1.5px solid #c9a84c40', transform: 'rotate(-12deg)' }}>
                  <div className="flex flex-col items-center justify-center rounded-full" style={{ width: 38, height: 38, border: '1px dashed #c9a84c30' }}>
                    <span style={{ fontSize: 10, color: '#c9a84c' }}>✦</span>
                    <span style={{ fontSize: 4, fontWeight: 700, color: '#c9a84c', letterSpacing: 1.5, textTransform: 'uppercase' as const }}>Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handlePreview}>
          <Eye className="h-4 w-4 mr-2" />
          Preview Full
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Template
        </Button>
      </div>
    </div>
  );
}
