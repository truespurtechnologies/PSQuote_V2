import { cn } from "@/lib/utils"
import { User, Package } from "lucide-react"

interface SettingsTabsProps {
  activeTab: 'users' | 'products'
  onTabChange: (tab: 'users' | 'products') => void
}

type Tab = {
  id: 'users' | 'products'
  name: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  {
    id: 'users',
    name: 'User Management',
    icon: <User className="h-5 w-5" />
  },
  {
    id: 'products',
    name: 'Product Catalog',
    icon: <Package className="h-5 w-5" />
  }
]

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="border-b border-red-500/20 mb-8">
      <nav className="-mb-px flex space-x-8" aria-label="Settings tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                isActive
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300',
                'group inline-flex items-center border-b-2 py-4 px-1 text-base font-medium whitespace-nowrap',
                'transition-colors duration-200 focus:outline-none'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={cn(
                'mr-2 h-5 w-5',
                isActive ? 'text-red-400' : 'text-gray-500 group-hover:text-gray-400',
                'transition-colors duration-200'
              )}>
                {tab.icon}
              </div>
              <span>{tab.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
