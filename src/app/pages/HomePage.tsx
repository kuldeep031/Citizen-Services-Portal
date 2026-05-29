import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Zap, Droplet, Flame, Trash2, Building, Search, Shield, AlertTriangle,
  ChevronDown, ChevronUp, Phone, Clock, Users, FileText, ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  publishedAt: string;
}

interface PublicStats {
  complaintsResolved: number;
  activeCitizens: number;
  avgResolutionDays: number;
  departmentsServed: number;
}

const emergencyAlerts: { title: string; description: string; time: string }[] = [];


export function HomePage() {
  const [trackingId, setTrackingId] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [portalStats, setPortalStats] = useState<PublicStats | null>(null);
  const { t } = useTranslation(['public', 'common']);

  const services = [
    { icon: Zap, titleKey: 'services.electricity', descKey: 'services.electricityDesc', color: 'bg-primary/10 text-primary' },
    { icon: Droplet, titleKey: 'services.water', descKey: 'services.waterDesc', color: 'bg-secondary/10 text-secondary' },
    { icon: Flame, titleKey: 'services.gas', descKey: 'services.gasDesc', color: 'bg-accent/10 text-accent' },
    { icon: Trash2, titleKey: 'services.waste', descKey: 'services.wasteDesc', color: 'bg-warning/10 text-warning' },
    { icon: Building, titleKey: 'services.municipal', descKey: 'services.municipalDesc', color: 'bg-info/10 text-info' },
    { icon: Shield, titleKey: 'services.other', descKey: 'services.otherDesc', color: 'bg-muted text-muted-foreground' },
  ];

  const faqs = [
    { qKey: 'faq.q1', aKey: 'faq.a1' },
    { qKey: 'faq.q2', aKey: 'faq.a2' },
    { qKey: 'faq.q3', aKey: 'faq.a3' },
    { qKey: 'faq.q4', aKey: 'faq.a4' },
  ];

  useEffect(() => {
    api.get<{ announcements: Announcement[] }>('announcements')
      .then((res) => setAnnouncements(res.announcements))
      .catch(() => {});
    api.get<{ stats: PublicStats }>('announcements/public-stats')
      .then((res) => setPortalStats(res.stats))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/85 mb-8 leading-relaxed max-w-2xl">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                {t('hero.submitComplaint')}
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Link>
              <Link
                to="/track"
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 rounded-lg font-semibold hover:bg-primary-foreground/20 transition-colors"
              >
                {t('hero.trackApplication')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b border-border" aria-label="Portal statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-card-foreground tabular-nums">{portalStats ? portalStats.complaintsResolved.toLocaleString('en-IN') : '—'}</p>
                <p className="text-[12px] text-muted-foreground">{t('stats.complaintsResolved')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-card-foreground tabular-nums">{portalStats ? portalStats.activeCitizens.toLocaleString('en-IN') : '—'}</p>
                <p className="text-[12px] text-muted-foreground">{t('stats.activeCitizens')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-card-foreground tabular-nums">{portalStats ? portalStats.avgResolutionDays : '—'}</p>
                <p className="text-[12px] text-muted-foreground">{t('stats.avgResolution')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-card-foreground tabular-nums">{portalStats ? portalStats.departmentsServed : '—'}</p>
                <p className="text-[12px] text-muted-foreground">{t('stats.departments')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Track Section */}
      <section className="bg-muted/50 py-10 sm:py-12" aria-label="Quick application tracking">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('tracking.title')}</h2>
            <p className="text-[15px] text-muted-foreground mb-5">{t('tracking.subtitle')}</p>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder={t('tracking.placeholder')}
                  aria-label="Ticket ID"
                  className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <Link
                to={trackingId ? `/track?id=${trackingId}` : '/track'}
                className="inline-flex items-center min-h-[48px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                {t('tracking.button')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 id="services-heading" className="text-xl sm:text-2xl font-bold mb-2">{t('services.title')}</h2>
            <p className="text-[15px] text-muted-foreground max-w-lg mx-auto">{t('services.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.titleKey} className="bg-card rounded-xl p-5 sm:p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${service.color}`} aria-hidden="true">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-card-foreground mb-1.5">{t(service.titleKey)}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{t(service.descKey)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Alerts */}
      {emergencyAlerts.length > 0 && (
        <section className="bg-destructive/5 border-y border-destructive/10 py-8 sm:py-10" aria-label="Emergency alerts">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
              <h2 className="text-lg font-bold text-destructive">Emergency Alerts</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {emergencyAlerts.map((alert, i) => (
                <article key={i} className="bg-card rounded-xl p-4 sm:p-5 border border-destructive/15">
                  <h3 className="text-sm font-semibold text-card-foreground mb-1">{alert.title}</h3>
                  <p className="text-[13px] text-muted-foreground mb-2">{alert.description}</p>
                  <time className="text-[11px] text-muted-foreground/70">{alert.time}</time>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Announcements */}
      <section className="py-12 sm:py-16 bg-card" aria-labelledby="announcements-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 id="announcements-heading" className="text-xl sm:text-2xl font-bold mb-2">Notices & Announcements</h2>
            <p className="text-[15px] text-muted-foreground">Stay updated with the latest from your local departments</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
            {announcements.map((item) => (
              <article key={item.id} className={`rounded-xl p-5 border ${item.type === 'success' ? 'bg-success/5 border-success/15' : 'bg-info/5 border-info/15'}`}>
                <time className="text-[11px] text-muted-foreground/70 block mb-2">{new Date(item.publishedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                <h3 className="text-sm font-semibold text-card-foreground mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{item.content}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold mb-2">{t('faq.title')}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left min-h-[44px]"
                >
                  <span className="text-sm font-medium text-card-foreground pr-4">{t(faq.qKey)}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{t(faq.aKey)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login CTA */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-12 sm:py-16" aria-label="Login options">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-3">{t('hero.title')}</h2>
          <p className="text-[15px] text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors flex-1 sm:flex-none"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              {t('footer.citizenLogin')}
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 rounded-lg font-semibold hover:bg-primary-foreground/20 transition-colors flex-1 sm:flex-none"
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              {t('footer.officerLogin')}
            </Link>
          </div>
        </div>
      </section>

      {/* Helpline Bar */}
      <section className="bg-card border-t border-border py-6" aria-label="Helpline information">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <Phone className="w-5 h-5 text-primary" aria-hidden="true" />
          <p className="text-sm text-card-foreground">
            <span className="font-semibold">{t('footer.helpline')}</span>
            <span className="mx-2 text-border hidden sm:inline">|</span>
            <span className="block sm:inline mt-1 sm:mt-0">
              <span className="font-semibold">{t('footer.email')}</span>
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
