import { Outlet, Link } from 'react-router';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function PublicLayout() {
  const { t } = useTranslation(['common', 'public']);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
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
            <LanguageSwitcher />
            <Link
              to="/login"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>{t('common.login')}</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1" id="main-content" tabIndex={-1}>
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
                <p className="text-sm font-semibold text-foreground">{t('header.portalName')}</p>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {t('public:footer.description')}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">{t('public:footer.services')}</p>
              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li>{t('public:services.electricity')}</li>
                <li>{t('public:services.water')}</li>
                <li>{t('public:services.gas')}</li>
                <li>{t('public:services.waste')}</li>
                <li>{t('public:services.municipal')}</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">{t('public:footer.quickLinks')}</p>
              <ul className="space-y-2 text-[13px]">
                <li><Link to="/track" className="text-muted-foreground hover:text-primary transition-colors">{t('public:footer.trackApplication')}</Link></li>
                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">{t('public:footer.citizenLogin')}</Link></li>
                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">{t('public:footer.officerLogin')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">{t('public:footer.contact')}</p>
              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li>{t('public:footer.helpline')}</li>
                <li>{t('public:footer.email')}</li>
                <li>{t('public:footer.hours')}</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-[12px] text-muted-foreground">
              {t('public:footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
