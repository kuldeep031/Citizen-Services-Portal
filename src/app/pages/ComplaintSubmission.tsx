import { useState, useEffect } from 'react';
import { CheckCircle, Upload, X, ArrowLeft, ArrowRight, Send, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAuth } from '../../auth';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

const categoryKeys: Record<string, string[]> = {
  ELEC: ['new_connection', 'disconnection', 'billing_issue', 'power_outage', 'street_light', 'meter_fault'],
  WATER: ['new_connection', 'low_pressure', 'contamination', 'leakage', 'billing_issue', 'no_supply'],
  GAS: ['new_connection', 'gas_leak', 'meter_issue', 'billing_issue', 'transfer', 'safety_concern'],
  WASTE: ['missed_collection', 'illegal_dumping', 'bin_replacement', 'schedule_change', 'hazardous_waste'],
  MUNI: ['road_repair', 'drainage_block', 'footpath_damage', 'public_toilet', 'park_maintenance'],
};

interface FormData {
  departmentId: string;
  departmentCode: string;
  category: string;
  title: string;
  description: string;
  location: string;
  priority: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  files: File[];
}

export function ComplaintSubmission() {
  const { t } = useTranslation('citizen');
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  const steps = [
    t('submit.steps.department'),
    t('submit.steps.details'),
    t('submit.steps.location'),
    t('submit.steps.documents'),
    t('submit.steps.review'),
  ];

  const priorities = [
    { id: 'low', label: t('submit.priority.low'), description: t('submit.priority.lowDesc'), color: 'border-success/40 bg-success/5 text-success' },
    { id: 'medium', label: t('submit.priority.medium'), description: t('submit.priority.mediumDesc'), color: 'border-warning/40 bg-warning/5 text-warning' },
    { id: 'high', label: t('submit.priority.high'), description: t('submit.priority.highDesc'), color: 'border-destructive/40 bg-destructive/5 text-destructive' },
  ];
  const [formData, setFormData] = useState<FormData>({
    departmentId: '',
    departmentCode: '',
    category: '',
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    files: [],
  });

  useEffect(() => {
    api.get<{ departments: Department[] }>('departments').then((res) => {
      setDepartments(res.departments);
    }).catch(() => {});
  }, []);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return !!formData.departmentId && !!formData.category;
      case 1: return !!formData.title && !!formData.description;
      case 2: return !!formData.location && !!formData.priority;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post<{ complaint: { ticketId: string; id: string } }>('complaints', {
        title: formData.title,
        description: formData.description,
        departmentId: formData.departmentId,
        category: formData.category,
        priority: formData.priority,
        location: formData.location,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
      });

      // Upload files if any
      if (formData.files.length > 0) {
        const fd = new FormData();
        formData.files.forEach((file) => fd.append('files', file));
        await api.upload(`uploads/${res.complaint.id}`, fd).catch(() => {});
      }

      setTicketId(res.complaint.ticketId);
      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateField('files', [...formData.files, ...Array.from(e.target.files)]);
    }
    e.target.value = '';
  };

  const handleFileRemove = (index: number) => {
    updateField('files', formData.files.filter((_, i) => i !== index));
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 sm:py-16 px-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5" aria-hidden="true">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-2">{t('submit.success.heading')}</h1>
        <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
          {t('submit.success.message')}
        </p>
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border inline-block">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.success.ticketId')}</p>
          <p className="text-xl font-bold text-primary tabular-nums">{ticketId}</p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/citizen/track-application" className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            {t('submit.success.trackButton')}
          </a>
          <button
            onClick={() => { setSubmitted(false); setCurrentStep(0); setFormData({ departmentId: '', departmentCode: '', category: '', title: '', description: '', location: '', priority: 'medium', contactName: '', contactPhone: '', contactEmail: '', files: [] }); }}
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            {t('submit.success.submitAnother')}
          </button>
        </div>
      </div>
    );
  }

  const selectedDept = departments.find((d) => d.id === formData.departmentId);
  const categories = selectedDept ? (categoryKeys[selectedDept.code] || []) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">{t('submit.heading')}</h1>
        <p className="text-[15px] text-muted-foreground">{t('submit.description')}</p>
      </div>

      {/* Step Progress */}
      <nav className="bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border" aria-label="Form progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold border-2 transition-colors ${
                    index < currentStep
                      ? 'bg-success border-success text-success-foreground'
                      : index === currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                  aria-current={index === currentStep ? 'step' : undefined}
                >
                  {index < currentStep ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" /> : index + 1}
                </div>
                <span className={`text-[11px] mt-1.5 hidden sm:block text-center ${index === currentStep ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 sm:mx-3 rounded-full ${index < currentStep ? 'bg-success' : 'bg-border'}`} aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Content */}
      <div className="bg-card rounded-xl p-5 sm:p-6 lg:p-8 shadow-sm border border-border">
        {currentStep === 0 && (
          <fieldset className="space-y-6">
            <legend className="sr-only">{t('submit.selectDepartment')}</legend>
            <div>
              <h3 className="font-semibold mb-4">{t('submit.selectDepartment')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departments.map((dept) => {
                  const translatedName = t(`categories.${dept.code}.name`, { defaultValue: '' });
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => { updateField('departmentId', dept.id); updateField('departmentCode', dept.code); updateField('category', ''); }}
                      aria-pressed={formData.departmentId === dept.id}
                      className={`p-4 rounded-xl border-2 text-left transition-all min-h-[44px] ${
                        formData.departmentId === dept.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      }`}
                    >
                      <p className="text-sm font-semibold text-card-foreground">
                        {translatedName || dept.name}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">{dept.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.departmentId && categories.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">{t('submit.selectCategory')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((catKey) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => updateField('category', t(`categories.${selectedDept!.code}.${catKey}`))}
                      aria-pressed={formData.category === t(`categories.${selectedDept!.code}.${catKey}`)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all min-h-[44px] ${
                        formData.category === t(`categories.${selectedDept!.code}.${catKey}`)
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-card-foreground">{t(`categories.${selectedDept!.code}.${catKey}`)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        )}

        {currentStep === 1 && (
          <fieldset className="space-y-5">
            <legend className="sr-only">{t('submit.steps.details')}</legend>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-1.5">
                {t('submit.form.title')} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input id="title" type="text" required value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder={t('submit.form.titlePlaceholder')} className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-card-foreground mb-1.5">
                {t('submit.form.description')} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <textarea id="description" required value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder={t('submit.form.descriptionPlaceholder')} rows={4} className="w-full px-4 py-3 rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-card-foreground mb-1.5">{t('submit.form.contactName')}</label>
                <input id="contactName" type="text" value={user?.name || ''} disabled className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground focus:outline-none opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-card-foreground mb-1.5">{t('submit.form.email')}</label>
                <input id="contactEmail" type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground focus:outline-none opacity-60 cursor-not-allowed" />
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 2 && (
          <fieldset className="space-y-6">
            <legend className="sr-only">{t('submit.steps.location')}</legend>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-card-foreground mb-1.5">
                {t('submit.form.location')} <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <textarea id="location" required value={formData.location} onChange={(e) => updateField('location', e.target.value)} placeholder={t('submit.form.locationPlaceholder')} rows={3} className="w-full px-4 py-3 rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
            </div>
            <div role="radiogroup" aria-labelledby="priority-label">
              <h3 id="priority-label" className="font-semibold mb-4">{t('submit.priority.heading')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {priorities.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={formData.priority === p.id} onClick={() => updateField('priority', p.id)} className={`p-4 rounded-xl border-2 text-left transition-all min-h-[44px] ${formData.priority === p.id ? `${p.color} ring-1 ring-current/20` : 'border-border hover:border-primary/30 hover:bg-muted/30'}`}>
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 3 && (
          <fieldset className="space-y-5">
            <legend className="sr-only">{t('submit.upload.heading')}</legend>
            <div>
              <h3 className="font-semibold mb-1">{t('submit.upload.heading')}</h3>
              <p className="text-[13px] text-muted-foreground mb-4">{t('submit.upload.description')}</p>
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-36 sm:h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors">
                <Upload className="w-7 h-7 text-muted-foreground mb-2" aria-hidden="true" />
                <p className="text-sm text-muted-foreground font-medium">{t('submit.upload.clickToUpload')}</p>
                <p className="text-[12px] text-muted-foreground/70 mt-1">{t('submit.upload.fileTypes')}</p>
                <input id="file-upload" type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileAdd} className="sr-only" />
              </label>
            </div>
            {formData.files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">{t('submit.upload.filesSelected', { count: formData.files.length })}</p>
                {formData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm text-card-foreground truncate">{file.name}</span>
                    </div>
                    <span className="text-[12px] text-muted-foreground flex-shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                    <button type="button" onClick={() => handleFileRemove(index)} className="min-w-[36px] min-h-[36px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-lg flex-shrink-0" aria-label={`Remove ${file.name}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formData.files.length === 0 && (
              <div className="text-center py-4">
                <p className="text-[13px] text-muted-foreground/70">{t('submit.upload.noFiles')}</p>
              </div>
            )}
          </fieldset>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <h3 className="font-semibold">{t('submit.review.heading')}</h3>
            <p className="text-[13px] text-muted-foreground">{t('submit.review.description')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.department')}</p>
                <p className="text-sm font-medium text-card-foreground">{selectedDept?.name}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.category')}</p>
                <p className="text-sm font-medium text-card-foreground">{formData.category}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg sm:col-span-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.title')}</p>
                <p className="text-sm font-medium text-card-foreground">{formData.title}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg sm:col-span-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.descriptionLabel')}</p>
                <p className="text-sm text-card-foreground leading-relaxed">{formData.description}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.location')}</p>
                <p className="text-sm text-card-foreground">{formData.location}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.priority')}</p>
                <p className="text-sm font-medium text-card-foreground capitalize">{formData.priority}</p>
              </div>
              {formData.contactName && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.contact')}</p>
                  <p className="text-sm text-card-foreground">{formData.contactName}</p>
                </div>
              )}
              {formData.files.length > 0 && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t('submit.review.attachments')}</p>
                  <p className="text-sm text-card-foreground">{t('submit.upload.filesSelected', { count: formData.files.length })}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={handleBack} disabled={currentStep === 0} className="flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-foreground hover:bg-muted">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('submit.back')}
        </button>

        {currentStep < steps.length - 1 ? (
          <button type="button" onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            {t('submit.next')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" aria-hidden="true" />}
            {submitting ? t('submit.submitting') : t('submit.submitButton')}
          </button>
        )}
      </div>
    </div>
  );
}
