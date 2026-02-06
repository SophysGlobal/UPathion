import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface OnboardingData {
  fullName: string;
  username: string;
  referralSource: string;
  referralSourceOther: string;
  schoolType: 'high_school' | 'college' | 'other' | '';
  schoolName: string;
  gradeOrYear: string;
  major: string;
  aspirationalSchool: string;
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
  referralSource: '',
  referralSourceOther: '',
  schoolType: '',
  schoolName: '',
  gradeOrYear: '',
  major: '',
  aspirationalSchool: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [localOverrides, setLocalOverrides] = useState<Partial<OnboardingData>>({});
  const initialDataRef = useRef<OnboardingData>(defaultData);

  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ['onboarding-data', user?.id],
    queryFn: async (): Promise<OnboardingData> => {
      if (!user?.id) return defaultData;

      try {
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('display_name, school_type')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        const result: OnboardingData = {
          ...defaultData,
          fullName: userData?.display_name || '',
          schoolType: (userData?.school_type as OnboardingData['schoolType']) || '',
        };
        
        initialDataRef.current = result;
        return result;
      } catch (err) {
        console.error('Error loading onboarding data:', err);
        return defaultData;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Merge fetched data with local overrides
  const data: OnboardingData = {
    ...(fetchedData ?? defaultData),
    ...localOverrides,
  };

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setLocalOverrides((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetData = useCallback(() => {
    setLocalOverrides({});
  }, []);

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData, loading: isLoading }}>
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
