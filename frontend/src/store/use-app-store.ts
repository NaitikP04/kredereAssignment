import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DateRange } from 'react-day-picker';

interface FilterPreferences {
  statusFilters: string[];
  typeFilters: string[];
  pageSize: number;
}

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Filter preferences (persisted)
  filterPreferences: FilterPreferences;
  setFilterPreferences: (prefs: Partial<FilterPreferences>) => void;
  resetFilterPreferences: () => void;
}

const defaultFilterPreferences: FilterPreferences = {
  statusFilters: [],
  typeFilters: [],
  pageSize: 10,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      filterPreferences: defaultFilterPreferences,
      setFilterPreferences: (prefs) => 
        set((state) => ({
          filterPreferences: { ...state.filterPreferences, ...prefs },
        })),
      resetFilterPreferences: () => 
        set({ filterPreferences: defaultFilterPreferences }),
    }),
    {
      name: 'job-dashboard-storage',
      partialize: (state) => ({ filterPreferences: state.filterPreferences }),
    }
  )
);