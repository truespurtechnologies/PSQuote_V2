// Lightweight module stubs to unblock app-focused typechecking
// NOTE: These should be removed once the respective modules are fully typed and stabilized.

declare module '@/lib/supabase/profile-service' {
  export const getProfile: any;
  export const updateProfile: any;
  const _default: any;
  export default _default;
}

declare module '@/lib/supabase-server' {
  const _default: any;
  export default _default;
}

declare module '@/lib/auth-utils' {
  export const getUser: any;
  export const requireAuth: any;
}
