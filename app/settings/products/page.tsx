"use client"

import { redirect } from 'next/navigation';

export default function ProductsPage() {
  // This page is no longer used as we handle the products tab in the main settings page
  // Redirect to the main settings page with the products tab active
  redirect('/settings?tab=products')
  
  return null
}
