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
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['sale_active', 'sale_end_time', 'sale_discount_percent', 'sale_title']);

      if (data && data.length > 0) {
        const settings: SaleInfo = {
          isActive: false,
          discountPercent: 0,
          endTime: null,
          title: 'Flash Sale!'
        };

        data.forEach(item => {
          if (item.key === 'sale_active') settings.isActive = item.value === 'true';
          if (item.key === 'sale_end_time') settings.endTime = item.value;
          if (item.key === 'sale_discount_percent') settings.discountPercent = parseInt(item.value || '0');
          if (item.key === 'sale_title') settings.title = item.value || 'Flash Sale!';
        });

        // Check if sale has expired
        if (settings.endTime) {
          const endTime = new Date(settings.endTime).getTime();
          if (Date.now() >= endTime) {
            settings.isActive = false;
          }
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
