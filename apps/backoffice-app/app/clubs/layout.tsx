'use client'

import {clearAdminToken} from '@/src/services/adminTokenService'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'

export default function ClubsLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearAdminToken()
    router.push('/login')
  }

  const navigation = [
    {name: 'Clubs List', href: '/clubs', current: pathname === '/clubs'},
    {
      name: 'Create Club',
      href: '/clubs/create',
      current: pathname === '/clubs/create',
    },
    {
      name: 'Generate Link',
      href: '/clubs/generate-link',
      current: pathname === '/clubs/generate-link',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Vexl Backoffice
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      item.current
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <div className="sm:hidden px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                item.current
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6">{children}</main>
    </div>
  )
}
