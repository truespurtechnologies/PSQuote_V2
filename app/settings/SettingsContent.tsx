"use client"

import { Button } from "../../components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { UserManagement } from "../../components/settings/user-management"
import { ProductCatalog } from "../../components/settings/product-catalog"
import { SettingsTabs } from "../../components/settings/settings-tabs"
import { useMemo } from "react"

type TabType = 'users' | 'products'

export function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab')

  // Determine active tab based on URL parameter
  const activeTab: TabType = useMemo(() => {
    return tabParam === 'products' ? 'products' : 'users'
  }, [tabParam])

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (tab === 'users') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    router.push(`/settings?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-white text-black shadow-lg border-b-4 border-red-500">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push("/landing")}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <SettingsTabs activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'users' ? <UserManagement /> : <ProductCatalog />}
        </div>
      </main>
    </div>
  )
}
