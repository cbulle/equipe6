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
      <div role="tablist" className="flex min-w-max gap-1 rounded-xl bg-white/70 p-1 ring-1 ring-brand-200/60">
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
                'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-brand-50 hover:text-brand-800',
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
