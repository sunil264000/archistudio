import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Timer, Percent, Tag, Save, Play, Square, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SalesManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [settings, setSettings] = useState({
    sale_active: false,
    sale_end_time: '',
    sale_discount_percent: 50,
    sale_title: 'Flash Sale!',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['sale_active', 'sale_end_time', 'sale_discount_percent', 'sale_title', 'whatsapp_number']);

    if (data) {
      const newSettings = { ...settings };
      data.forEach(item => {
        if (item.key === 'sale_active') newSettings.sale_active = item.value === 'true';
        if (item.key === 'sale_end_time') newSettings.sale_end_time = item.value || '';
        if (item.key === 'sale_discount_percent') newSettings.sale_discount_percent = parseInt(item.value || '50');
        if (item.key === 'sale_title') newSettings.sale_title = item.value || 'Flash Sale!';
        if (item.key === 'whatsapp_number') setWhatsappNumber(item.value || '');
      });
      setSettings(newSettings);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'sale_active', value: String(settings.sale_active) },
        { key: 'sale_end_time', value: settings.sale_end_time },
        { key: 'sale_discount_percent', value: String(settings.sale_discount_percent) },
        { key: 'sale_title', value: settings.sale_title },
      ];

      for (const setting of settingsToSave) {
        // Try update first
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({ value: setting.value, updated_at: new Date().toISOString() })
          .eq('key', setting.key);

        if (updateError) {
          // Insert if doesn't exist
          await supabase
            .from('site_settings')
            .insert({ 
              key: setting.key, 
              value: setting.value, 
              description: `Sale setting: ${setting.key}` 
            });
        }
      }

      toast.success('Sale settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const startQuickSale = async (hours: number) => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + hours);
    
    setSettings(prev => ({
      ...prev,
      sale_active: true,
      sale_end_time: endTime.toISOString(),
    }));
  };

  const stopSale = () => {
    setSettings(prev => ({
      ...prev,
      sale_active: false,
      sale_end_time: '',
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-destructive" />
            Flash Sale Management
          </CardTitle>
          <CardDescription>
            Control site-wide sales with discount and countdown timer. Discount applies to all course prices on frontend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sale Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${settings.sale_active ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <div>
                <p className="font-medium">Sale Status</p>
                <p className="text-sm text-muted-foreground">
                  {settings.sale_active ? 'Active - Discount is being applied' : 'Inactive'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.sale_active}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sale_active: checked }))}
            />
          </div>

          {/* Quick Start Buttons */}
          <div className="space-y-2">
            <Label>Quick Start Sale</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => startQuickSale(1)}>
                <Play className="h-3 w-3 mr-1" /> 1 Hour
              </Button>
              <Button variant="outline" size="sm" onClick={() => startQuickSale(6)}>
                <Play className="h-3 w-3 mr-1" /> 6 Hours
              </Button>
              <Button variant="outline" size="sm" onClick={() => startQuickSale(12)}>
                <Play className="h-3 w-3 mr-1" /> 12 Hours
              </Button>
              <Button variant="outline" size="sm" onClick={() => startQuickSale(24)}>
                <Play className="h-3 w-3 mr-1" /> 24 Hours
              </Button>
              <Button variant="destructive" size="sm" onClick={stopSale}>
                <Square className="h-3 w-3 mr-1" /> Stop Sale
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Sale Title */}
            <div className="space-y-2">
              <Label htmlFor="sale_title" className="flex items-center gap-2">
                <Tag className="h-4 w-4" /> Sale Title
              </Label>
              <Input
                id="sale_title"
                value={settings.sale_title}
                onChange={(e) => setSettings(prev => ({ ...prev, sale_title: e.target.value }))}
                placeholder="Flash Sale!"
              />
            </div>

            {/* Discount Percent */}
            <div className="space-y-2">
              <Label htmlFor="discount" className="flex items-center gap-2">
                <Percent className="h-4 w-4" /> Discount Percentage
              </Label>
              <Input
                id="discount"
                type="number"
                min="1"
                max="90"
                value={settings.sale_discount_percent}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  sale_discount_percent: Math.min(90, Math.max(1, parseInt(e.target.value) || 0)) 
                }))}
              />
            </div>
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="end_time" className="flex items-center gap-2">
              <Timer className="h-4 w-4" /> Sale End Time
            </Label>
            <Input
              id="end_time"
              type="datetime-local"
              value={settings.sale_end_time ? new Date(settings.sale_end_time).toISOString().slice(0, 16) : ''}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                sale_end_time: e.target.value ? new Date(e.target.value).toISOString() : '' 
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty or set future date. Sale automatically stops when time expires.
            </p>
          </div>

          {/* Preview */}
          {settings.sale_active && settings.sale_discount_percent > 0 && (
            <div className="p-4 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/5">
              <p className="font-medium text-destructive mb-2">Preview:</p>
              <p className="text-sm">
                ₹2,999 → <span className="font-bold text-success">₹{Math.round(2999 * (1 - settings.sale_discount_percent / 100)).toLocaleString()}</span>
                <span className="ml-2 text-xs text-destructive font-medium">{settings.sale_discount_percent}% OFF</span>
              </p>
            </div>
          )}

          <Button onClick={saveSettings} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Sale Settings
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            WhatsApp Button
          </CardTitle>
          <CardDescription>
            Configure the floating WhatsApp button for instant customer contact. Leave empty to hide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number (with country code)</Label>
            <Input
              id="whatsapp"
              placeholder="919876543210"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Example: 919876543210 for India (+91)</p>
          </div>
          <Button 
            onClick={async () => {
              setSavingWhatsapp(true);
              const { error } = await supabase
                .from('site_settings')
                .upsert({ key: 'whatsapp_number', value: whatsappNumber, description: 'WhatsApp contact number' }, { onConflict: 'key' });
              if (error) toast.error('Failed to save');
              else toast.success('WhatsApp number saved!');
              setSavingWhatsapp(false);
            }} 
            disabled={savingWhatsapp}
            className="gap-2"
          >
            {savingWhatsapp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save WhatsApp Number
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
