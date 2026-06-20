import { AppUser } from "../types/user"

export const mockUsers: AppUser[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2023-06-01T10:30:00Z',
    lastUpdated: '2023-06-01T10:30:00Z'
  },
  {
    id: '2',
    username: 'manager',
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'MANAGER',
    status: 'ACTIVE',
    lastLogin: '2023-06-05T14:20:00Z',
    lastUpdated: '2023-06-05T14:20:00Z'
  },
  {
    id: '3',
    username: 'user1',
    name: 'Regular User',
    email: 'user1@example.com',
    role: 'USER',
    status: 'INACTIVE',
    lastLogin: '2023-05-28T09:15:00Z',
    lastUpdated: '2023-05-28T09:15:00Z'
  }
]
