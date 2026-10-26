import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
}

export function Tabs<T extends string>({ tabs, activeTab, onChange }: TabsProps<T>) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" className="flex min-w-max gap-0.5 border-b border-brand-300">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={clsx(
                '-mb-px inline-flex items-center gap-2 rounded-t-sm border px-4 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-brand-300 border-t-brand-700 border-b-brand-50 bg-brand-50 text-brand-900 shadow-[inset_0_2px_0_var(--color-brand-700)]'
                  : 'border-transparent bg-brand-100/70 text-slate-600 hover:bg-brand-100 hover:text-brand-900',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
