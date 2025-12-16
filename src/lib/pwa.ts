// Progressive Web App utilities
export class PWAManager {
  private static instance: PWAManager
  private deferredPrompt: any = null
  private isInstalled = false

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  init() {
    if (typeof window === 'undefined') return

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      this.showInstallBanner()
    })

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.hideInstallBanner()
    })

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true
    }

    // Register service worker
    this.registerServiceWorker()
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) return false

    try {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        this.isInstalled = true
        this.hideInstallBanner()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error installing PWA:', error)
      return false
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  private showInstallBanner() {
    // Create install banner
    const banner = document.createElement('div')
    banner.id = 'pwa-install-banner'
    banner.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between'
    banner.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        <div>
          <p class="font-medium">Install TeamFlow</p>
          <p class="text-sm opacity-90">Get the full app experience</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button id="pwa-install-btn" class="bg-white text-blue-600 px-4 py-2 rounded font-medium">Install</button>
        <button id="pwa-dismiss-btn" class="text-white opacity-75 hover:opacity-100">×</button>
      </div>
    `

    document.body.appendChild(banner)

    // Add event listeners
    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.installApp()
    })

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallBanner()
    })
  }

  private hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner')
    if (banner) {
      banner.remove()
    }
  }

  isAppInstalled(): boolean {
    return this.isInstalled
  }

  // Offline detection
  isOnline(): boolean {
    return navigator.onLine
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void) {
    window.addEventListener('online', () => callback(true))
    window.addEventListener('offline', () => callback(false))
  }
}