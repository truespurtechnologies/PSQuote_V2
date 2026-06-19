export type UserRole = 'ADMIN' | 'MANAGER' | 'USER'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface BaseUser {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string
  lastUpdated: string
  password?: string
}

export interface AppUser extends BaseUser {}

// For form input and updates
// Make all fields optional except for required ones
// and make id optional for new users
export type UserInput = Partial<Omit<BaseUser, 'id' | 'lastLogin' | 'lastUpdated'>> & {
  id?: string
  username: string
  role: UserRole
  status: UserStatus
}

export interface EditState {
  userId: string
  field: EditableUserField
  value: string
}

export type EditableUserField = 'name' | 'email' | 'username' | 'role' | 'status'
