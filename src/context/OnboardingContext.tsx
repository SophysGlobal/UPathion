import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingData {
  fullName: string;
  username: string;
  schoolType: 'high_school' | 'college' | '';
  schoolName: string;
  gradeOrYear: string;
  major: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
  loading: boolean;
}

const defaultData: OnboardingData = {
  fullName: '',
  username: '',
  schoolType: '',
  schoolName: '',
  gradeOrYear: '',
  major: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOnboardingData = async () => {
      if (!user) {
        setData(defaultData);
        setLoading(false);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        setData((prev) => ({
          ...prev,
          fullName: userData?.display_name || '',
        }));
      } catch (err) {
        console.error('Error loading onboarding data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingData();
  }, [user]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData(defaultData);
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData, loading }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
