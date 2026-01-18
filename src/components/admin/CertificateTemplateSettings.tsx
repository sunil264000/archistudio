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
  font_family: 'Playfair Display',
  institution_name: 'Concrete Logic',
  institution_tagline: 'Architecture Learning Platform',
  signature_name: 'Course Director',
  signature_title: 'Concrete Logic',
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
          font_family: data.font_family || 'Playfair Display',
          institution_name: data.institution_name || 'Concrete Logic',
          institution_tagline: data.institution_tagline || 'Architecture Learning Platform',
          signature_name: data.signature_name || 'Course Director',
          signature_title: data.signature_title || 'Concrete Logic',
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
          font_family: settings.font_family,
          institution_name: settings.institution_name,
          institution_tagline: settings.institution_tagline,
          signature_name: settings.signature_name,
          signature_title: settings.signature_title,
          show_border: settings.show_border,
          border_style: settings.border_style,
          updated_at: new Date().toISOString(),
        })
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
            {/* Logo Upload */}
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
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
              <Input
                id="institution_name"
                value={settings.institution_name}
                onChange={(e) => setSettings(prev => ({ ...prev, institution_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution_tagline">Tagline</Label>
              <Input
                id="institution_tagline"
                value={settings.institution_tagline}
                onChange={(e) => setSettings(prev => ({ ...prev, institution_tagline: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Typography & Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Style</CardTitle>
            <CardDescription>Colors and typography</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font_family">Font Family</Label>
              <Select
                value={settings.font_family}
                onValueChange={(value) => setSettings(prev => ({ ...prev, font_family: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bg_color">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="bg_color"
                    value={settings.background_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.background_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primary_color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent_color">Accent</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="accent_color"
                    value={settings.accent_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.accent_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>
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
              <Input
                id="signature_name"
                value={settings.signature_name}
                onChange={(e) => setSettings(prev => ({ ...prev, signature_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature_title">Signatory Title</Label>
              <Input
                id="signature_title"
                value={settings.signature_title}
                onChange={(e) => setSettings(prev => ({ ...prev, signature_title: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Border Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Border</CardTitle>
            <CardDescription>Certificate border style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show_border">Show Border</Label>
              <Switch
                id="show_border"
                checked={settings.show_border}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, show_border: checked }))}
              />
            </div>

            {settings.show_border && (
              <div className="space-y-2">
                <Label htmlFor="border_style">Border Style</Label>
                <Select
                  value={settings.border_style}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, border_style: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {borderStyles.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Certificate template preview</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="aspect-[1.4/1] max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg"
            style={{ backgroundColor: settings.background_color }}
          >
            <div 
              className={`w-full h-full p-8 flex flex-col items-center justify-center relative ${
                settings.show_border ? 'border-4' : ''
              }`}
              style={{ 
                borderColor: settings.primary_color,
                fontFamily: settings.font_family,
              }}
            >
              {settings.show_border && settings.border_style === 'classic' && (
                <div 
                  className="absolute inset-3 border pointer-events-none"
                  style={{ borderColor: `${settings.primary_color}40` }}
                />
              )}
              
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-12 object-contain mb-2"
                />
              )}
              
              <h3 
                className="text-xl font-bold tracking-widest"
                style={{ color: settings.primary_color }}
              >
                {settings.institution_name.toUpperCase()}
              </h3>
              <p className="text-xs text-gray-500 tracking-wide mb-4">
                {settings.institution_tagline}
              </p>
              
              <h2 
                className="text-2xl md:text-3xl my-4"
                style={{ color: settings.primary_color }}
              >
                Certificate of Completion
              </h2>
              
              <p className="text-sm text-gray-600 mb-2">This is to certify that</p>
              <p 
                className="text-xl md:text-2xl font-bold mb-4"
                style={{ color: settings.primary_color }}
              >
                Student Name
              </p>
              
              <p className="text-sm text-gray-600">has successfully completed</p>
              <p 
                className="text-lg font-semibold"
                style={{ color: settings.accent_color }}
              >
                Course Title
              </p>
              
              <div className="absolute bottom-8 left-8 text-left">
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium">January 18, 2026</p>
              </div>
              
              <div className="absolute bottom-8 right-8 text-right">
                <div 
                  className="w-24 border-b mb-1"
                  style={{ borderColor: settings.primary_color }}
                />
                <p className="text-sm font-medium">{settings.signature_name}</p>
                <p className="text-xs text-gray-500">{settings.signature_title}</p>
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