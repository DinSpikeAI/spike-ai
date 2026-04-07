'use client'

import { useState, useEffect } from 'react'

export default function ArticleClient() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const winHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight - winHeight
      const scrolled = window.scrollY
      setProgress(docHeight > 0 ? Math.min((scrolled / docHeight) * 100, 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Copy link buttons
    document.querySelectorAll('[data-copy-url]').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = (btn as HTMLElement).dataset.copyUrl || ''
        navigator.clipboard.writeText(url)
        const el = btn as HTMLElement
        const orig = el.textContent
        el.textContent = 'Copied!'
        setTimeout(() => { el.textContent = orig }, 2000)
      })
    })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px]">
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
