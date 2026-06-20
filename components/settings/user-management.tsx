import { useState, useCallback, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Edit, Trash2, UserPlus, Loader2, Save, X } from "lucide-react"
import { Input } from "../../components/ui/input"
import { Switch } from "../../components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { UserModal } from "./user-modal"
// Users will be loaded from API: /api/users
import type { AppUser, EditableUserField, EditState, UserInput } from "../../lib/types/user"

interface UserManagementProps {
  // Add any props if needed
}

// Format date in DD-MM-YYYY format consistently between server and client
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}-${month}-${year} ${hours}:${minutes}`
  } catch (error) {
    // Silently fail for date formatting errors
    return dateString
  }
}

const UserManagement: React.FC<UserManagementProps> = () => {
  // State for users list and UI state
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  
  // State for modals and dialogs
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserInput | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  
  // State for inline editing
  const [editing, setEditing] = useState<EditState | null>(null)
  const [editValue, setEditValue] = useState('')
  
  // Handle editing a user
  const handleEditUser = useCallback((user: AppUser) => {
    setSelectedUser({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: user.password
    })
    setIsModalOpen(true)
  }, [])

  // Load users from server (Supabase) on mount
  useEffect(() => {
    let active = true
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/users')
        if (!res.ok) throw new Error(`Failed to load users (${res.status})`)
        const json = await res.json()
        const list: AppUser[] = json.users || []
        if (active) setUsers(list)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load users'
        toast.error(msg)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])
  
  /**
   * Handles saving a user (both create and update)
   * @param userData The user data to save
   */
  const handleSaveUser = useCallback(async (userData: UserInput) => {
    setIsLoading(true)
    try {
      if (!userData.id) {
        // CREATE new user
        const createPayload = {
          username: userData.username,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          password: userData.password,
        }
        console.log('[UserManagement] Creating user with payload:', createPayload)
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('[UserManagement] Create user failed:', text)
          throw new Error(text || `Failed to create user (${res.status})`)
        }
        const json = await res.json()
        console.log('[UserManagement] Create user success response:', json)
        const created: AppUser | undefined = json.user
        if (created) {
          setUsers(prev => [created, ...prev])
        }
        toast.success('User created successfully')
        setIsModalOpen(false)
        setSelectedUser(null)
      } else {
        // UPDATE existing user
        const payload = {
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          status: userData.status,
        }
        console.log('[UserManagement] Updating user', userData.id, 'with payload:', payload)
        const res = await fetch(`/api/users/${userData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('[UserManagement] Update user failed:', text)
          throw new Error(text || `Failed to update user (${res.status})`)
        }
        // Update list locally
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userData.id 
              ? { 
                  ...user, 
                  name: userData.name ?? user.name,
                  username: userData.username ?? user.username,
                  email: userData.email ?? user.email,
                  role: userData.role ?? user.role,
                  status: userData.status ?? user.status,
                  lastUpdated: new Date().toISOString(),
                } as AppUser
              : user
          )
        )
        toast.success('User updated successfully')
        setIsModalOpen(false)
        setSelectedUser(null)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user'
      console.error('[UserManagement] Save user error:', error)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Confirm delete user
  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/users/${userToDelete}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to delete user (${res.status})`)
      }
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete))
      toast.success('User deleted successfully')
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      setSelectedUser(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [userToDelete])
  
  // Handle starting inline edit
  const startEditing = useCallback((userId: string, field: EditableUserField, currentValue: string) => {
    setEditing({ userId, field, value: currentValue })
    setEditValue(currentValue)
  }, [])
  
  // Handle creating a new user
  const handleCreateUser = useCallback(() => {
    setSelectedUser({
      username: '',
      name: '',
      email: '',
      role: 'USER',
      status: 'ACTIVE',
      password: ''
    })
    setIsModalOpen(true)
  }, [])
  
  // Handle canceling inline edit
  const cancelEditing = useCallback(() => {
    setEditing(null)
    setEditValue('')
  }, [])

  // Handle saving inline edit
  const saveEdit = useCallback(async () => {
    if (!editing || !editValue.trim()) {
      cancelEditing()
      return
    }
    
    const { userId, field } = editing
    
    // Find the user being edited
    const userToUpdate = users.find(user => user.id === userId)
    if (!userToUpdate) {
      cancelEditing()
      return
    }
    
    // Update the user
    try {
      await handleSaveUser({
        ...userToUpdate,
        [field]: field === 'status' ? (editValue as 'ACTIVE' | 'INACTIVE') : editValue
      })
    } catch (error) {
      console.error('Failed to save user:', error)
    } finally {
      cancelEditing()
    }
  }, [editing, editValue, users, handleSaveUser, cancelEditing])
  
  // Handle input change for inline edit
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }, [])

  // Handle key down for inline edit
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }, [saveEdit, cancelEditing])
  
  // Render editable field
  const renderEditableField = useCallback((
    userId: string, 
    field: EditableUserField,
    value: string = '', 
    className: string = ''
  ) => {
    const isEditingField = editing?.userId === userId && editing.field === field
    
    if (isEditingField) {
      if (field === 'role') {
        return (
          <div className="flex items-center gap-2">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              autoFocus
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="USER">USER</option>
            </select>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={saveEdit}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={cancelEditing}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      }
      
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-8 w-full"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={saveEdit}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={cancelEditing}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }
    
    return (
      <div 
        className={`cursor-pointer hover:bg-accent p-2 rounded ${className}`}
        onClick={() => startEditing(userId, field, value)}
      >
        {value || <span className="text-muted-foreground">Click to edit</span>}
      </div>
    )
  }, [editing, editValue, handleInputChange, handleKeyDown, saveEdit, cancelEditing, startEditing, isLoading])

  // Handle deleting a user
  const handleDeleteUser = useCallback(async (user: AppUser) => {
    setUserToDelete(user.id)
    setSelectedUser({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: user.password
    })
    setIsDeleteDialogOpen(true)
  }, [])

  /**
   * Toggles a user's status between ACTIVE and INACTIVE
   * @param userId The ID of the user to toggle
   */
  const toggleUserStatus = useCallback(async (userId: string) => {
    setTogglingUserId(userId)
    try {
      const current = users.find(u => u.id === userId)
      const nextStatus = current?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to update status (${res.status})`)
      }
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                status: nextStatus!,
                lastUpdated: new Date().toISOString()
              } 
            : user
        )
      )
      toast.success('User status updated')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status'
      toast.error(errorMessage)
    } finally {
      setTogglingUserId(null)
    }
  }, [users]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (userToDelete) {
      confirmDeleteUser()
    }
  }, [userToDelete, confirmDeleteUser])

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedUser(null)
    setEditing(null)
    setEditValue('')
  }, [])

  // Handle modal open/close
  const handleModalOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleModalClose()
    }
    setIsModalOpen(open)
  }, [handleModalClose])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card className="border-2 border-red-500 bg-white">
        <CardHeader>
          <CardTitle className="text-black">Users</CardTitle>
          <p className="text-sm text-gray-500">Manage all users in the system</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    {renderEditableField(user.id, 'name', user.name)}
                  </TableCell>
                  <TableCell>
                    {renderEditableField(user.id, 'username', user.username)}
                  </TableCell>
                  <TableCell>
                    {renderEditableField(user.id, 'email', user.email)}
                  </TableCell>
                  <TableCell>
                    {renderEditableField(user.id, 'role', user.role)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Switch
                          id={`status-${user.id}`}
                          checked={user.status === 'ACTIVE'}
                          onCheckedChange={() => toggleUserStatus(user.id)}
                          className="data-[state=checked]:bg-green-600"
                          disabled={isLoading || togglingUserId === user.id}
                        />
                        {togglingUserId === user.id && (
                          <Loader2 className="h-3 w-3 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        user.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(user.lastLogin)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleEditUser(user)}
                        disabled={isLoading || togglingUserId === user.id}
                        aria-label={`Edit user ${user.name}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteUser(user)}
                        disabled={isLoading || user.role === 'ADMIN' || togglingUserId === user.id}
                        aria-label={`Delete user ${user.name}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* User Modal */}
      <UserModal
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        user={selectedUser}
        onSave={handleSaveUser}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { UserManagement }
export default UserManagement
