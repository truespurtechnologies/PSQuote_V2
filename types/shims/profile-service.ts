// Shim module for app-focused typechecking. Replace with real types later.
export const profileService: any = {
  getProfile: async (_id: string) => null,
  getProfileByEmail: async (_email: string) => null,
  updateProfile: async (_id: string, _data: any) => ({ data: null, error: null }),
};
export default profileService;
