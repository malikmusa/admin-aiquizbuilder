/* eslint-disable @typescript-eslint/no-explicit-any */
export function formatDate(date: string | null | undefined): string {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getUserStatus(user: any): 'active' | 'banned' | 'deleted' | 'unconfirmed' {
  if (user.deleted_at) return 'deleted'
  if (user.banned_until && new Date(user.banned_until) > new Date()) return 'banned'
  if (!user.email_confirmed_at && !user.phone_confirmed_at) return 'unconfirmed'
  return 'active'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-green-600 bg-green-100'
    case 'banned': return 'text-red-600 bg-red-100'
    case 'deleted': return 'text-gray-600 bg-gray-100'
    case 'unconfirmed': return 'text-yellow-600 bg-yellow-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}