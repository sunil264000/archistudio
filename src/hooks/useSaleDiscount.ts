import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SaleInfo {
  isActive: boolean;
  discountPercent: number;
  endTime: string | null;
  title: string;
}

export function useSaleDiscount() {
  const [saleInfo, setSaleInfo] = useState<SaleInfo>({
    isActive: false,
    discountPercent: 0,
    endTime: null,
    title: 'Flash Sale!'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaleSettings = async () => {
      // 1. Fetch site-wide settings
      const { data: siteSettings } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['sale_active', 'sale_end_time', 'sale_discount_percent', 'sale_title']);

      // 2. Fetch user-specific flash sale
      let userFlashSaleEnd = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('flash_sale_expires_at')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profile?.flash_sale_expires_at) {
            const expiry = new Date(profile.flash_sale_expires_at).getTime();
            if (expiry > Date.now()) {
              userFlashSaleEnd = profile.flash_sale_expires_at;
            }
          }
        }
      } catch (e) {
        console.warn('Flash sale check failed:', e);
      }

      if (siteSettings || userFlashSaleEnd) {
        const settings: SaleInfo = {
          isActive: false,
          discountPercent: 0,
          endTime: null,
          title: 'Flash Sale!'
        };

        if (siteSettings) {
          siteSettings.forEach(item => {
            if (item.key === 'sale_active') settings.isActive = item.value === 'true';
            if (item.key === 'sale_end_time') settings.endTime = item.value;
            if (item.key === 'sale_discount_percent') settings.discountPercent = parseInt(item.value || '0');
            if (item.key === 'sale_title') settings.title = item.value || 'Flash Sale!';
          });
        }

        // If site sale is active, check expiry
        if (settings.isActive && settings.endTime) {
          if (Date.now() >= new Date(settings.endTime).getTime()) {
            settings.isActive = false;
          }
        }

        // USER FLASH SALE OVERRIDE (MAY2026 etc)
        if (userFlashSaleEnd) {
          settings.isActive = true;
          settings.discountPercent = Math.max(settings.discountPercent, 20);
          settings.endTime = userFlashSaleEnd;
          settings.title = 'Personal Flash Sale! ⚡';
        }

        setSaleInfo(settings);
      }
      setLoading(false);
    };

    fetchSaleSettings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('sale_settings_hook')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_settings' 
      }, () => {
        fetchSaleSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!saleInfo.isActive || saleInfo.discountPercent <= 0) {
      return originalPrice;
    }
    return Math.round(originalPrice * (1 - saleInfo.discountPercent / 100));
  };

  return {
    ...saleInfo,
    loading,
    calculateDiscountedPrice,
  };
}
