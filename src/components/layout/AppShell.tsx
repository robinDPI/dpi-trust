import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from '../command/CommandPalette'
import { CommandPaletteProvider } from '../command/CommandPaletteContext'
import { Footer } from './Footer'
import { ModuleMenu } from './ModuleMenu'
import { SecondaryNav } from './SecondaryNav'
import { TopBar } from './TopBar'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen flex-col bg-canvas">
        <TopBar onMenuClick={() => setMenuOpen(true)} />
        <SecondaryNav />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
      <CommandPalette />
      <ModuleMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </CommandPaletteProvider>
  )
}
