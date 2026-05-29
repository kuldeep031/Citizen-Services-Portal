import { Outlet, Link } from 'react-router';
import { LayoutDashboard, LogIn } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground leading-tight">Citizen Services Portal</p>
              <p className="text-[11px] text-muted-foreground hidden sm:block">Government of Country</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Login</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-foreground">Citizen Services Portal</p>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Unified platform for all civic utility services. Submit requests, track applications, and stay updated.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Services</p>
              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li>Electricity Department</li>
                <li>Water Supply</li>
                <li>Gas Services</li>
                <li>Waste Management</li>
                <li>Municipal Corporation</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Quick Links</p>
              <ul className="space-y-2 text-[13px]">
                <li><Link to="/track" className="text-muted-foreground hover:text-primary transition-colors">Track Application</Link></li>
                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Citizen Login</Link></li>
                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Officer Login</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Contact</p>
              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li>Helpline: 1800-111-5555</li>
                <li>Email: support@citizenportal.gov.in</li>
                <li>Mon-Sat: 9:00 AM - 6:00 PM</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-[12px] text-muted-foreground">
              &copy; 2025 Unified Citizen Services Portal. All rights reserved. Government of Country.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
