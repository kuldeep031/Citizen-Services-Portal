import { useState, useEffect } from 'react';
import { CheckCircle, Upload, X, ArrowLeft, ArrowRight, Send, FileText, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

const categoryMap: Record<string, string[]> = {
  ELEC: ['New Connection', 'Disconnection', 'Billing Issue', 'Power Outage', 'Street Light', 'Meter Fault'],
  WATER: ['New Connection', 'Low Pressure', 'Contamination', 'Leakage', 'Billing Issue', 'No Supply'],
  GAS: ['New Connection', 'Gas Leak', 'Meter Issue', 'Billing Issue', 'Transfer', 'Safety Concern'],
  WASTE: ['Missed Collection', 'Illegal Dumping', 'Bin Replacement', 'Schedule Change', 'Hazardous Waste'],
  MUNI: ['Road Repair', 'Drainage Block', 'Footpath Damage', 'Public Toilet', 'Park Maintenance'],
};

const priorities = [
  { id: 'low', label: 'Low', description: 'Non-urgent, general inquiry', color: 'border-success/40 bg-success/5 text-success' },
  { id: 'medium', label: 'Medium', description: 'Needs attention within a week', color: 'border-warning/40 bg-warning/5 text-warning' },
  { id: 'high', label: 'High', description: 'Urgent, needs immediate action', color: 'border-destructive/40 bg-destructive/5 text-destructive' },
];

const steps = ['Department', 'Details', 'Location & Priority', 'Documents', 'Review'];

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
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
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
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Complaint Submitted Successfully</h1>
        <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
          Your complaint has been registered. Track its progress using the ticket ID below.
        </p>
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border inline-block">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Ticket ID</p>
          <p className="text-xl font-bold text-primary tabular-nums">{ticketId}</p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/citizen/track-application" className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Track Application
          </a>
          <button
            onClick={() => { setSubmitted(false); setCurrentStep(0); setFormData({ departmentId: '', departmentCode: '', category: '', title: '', description: '', location: '', priority: 'medium', contactName: '', contactPhone: '', contactEmail: '', files: [] }); }}
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  const selectedDept = departments.find((d) => d.id === formData.departmentId);
  const categories = selectedDept ? (categoryMap[selectedDept.code] || []) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Submit a Complaint</h1>
        <p className="text-[15px] text-muted-foreground">Fill in the details below to register your complaint or service request.</p>
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
            <legend className="sr-only">Select department and category</legend>
            <div>
              <h3 className="font-semibold mb-4">Select Department</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departments.map((dept) => (
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
                    <p className="text-sm font-semibold text-card-foreground">{dept.name}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{dept.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {formData.departmentId && categories.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Select Category</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateField('category', cat)}
                      aria-pressed={formData.category === cat}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all min-h-[44px] ${
                        formData.category === cat
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-card-foreground">{cat}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        )}

        {currentStep === 1 && (
          <fieldset className="space-y-5">
            <legend className="sr-only">Complaint details and contact information</legend>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-card-foreground mb-1.5">
                Complaint Title <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input id="title" type="text" required value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Brief title for your complaint" className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-card-foreground mb-1.5">
                Description <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <textarea id="description" required value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe your issue in detail..." rows={4} className="w-full px-4 py-3 rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
            </div>
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-card-foreground mb-1.5">Contact Name</label>
              <input id="contactName" type="text" value={formData.contactName} onChange={(e) => updateField('contactName', e.target.value)} placeholder="Your full name" className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-card-foreground mb-1.5">Phone Number</label>
                <input id="contactPhone" type="tel" value={formData.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-card-foreground mb-1.5">Email Address</label>
                <input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" />
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 2 && (
          <fieldset className="space-y-6">
            <legend className="sr-only">Location and priority</legend>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-card-foreground mb-1.5">
                Location / Address <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <textarea id="location" required value={formData.location} onChange={(e) => updateField('location', e.target.value)} placeholder="Enter the full address or landmark where the issue is located" rows={3} className="w-full px-4 py-3 rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
            </div>
            <div role="radiogroup" aria-labelledby="priority-label">
              <h3 id="priority-label" className="font-semibold mb-4">Priority Level</h3>
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
            <legend className="sr-only">Upload supporting documents</legend>
            <div>
              <h3 className="font-semibold mb-1">Upload Documents</h3>
              <p className="text-[13px] text-muted-foreground mb-4">Attach photos, bills, or any supporting documents (optional).</p>
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-36 sm:h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors">
                <Upload className="w-7 h-7 text-muted-foreground mb-2" aria-hidden="true" />
                <p className="text-sm text-muted-foreground font-medium">Click to upload or drag and drop</p>
                <p className="text-[12px] text-muted-foreground/70 mt-1">PDF, PNG, JPG up to 10MB each</p>
                <input id="file-upload" type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileAdd} className="sr-only" />
              </label>
            </div>
            {formData.files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">{formData.files.length} file(s) selected</p>
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
                <p className="text-[13px] text-muted-foreground/70">No files uploaded yet. You can skip this step if not needed.</p>
              </div>
            )}
          </fieldset>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <h3 className="font-semibold">Review Your Complaint</h3>
            <p className="text-[13px] text-muted-foreground">Please verify the details below before submitting.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Department</p>
                <p className="text-sm font-medium text-card-foreground">{selectedDept?.name}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Category</p>
                <p className="text-sm font-medium text-card-foreground">{formData.category}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg sm:col-span-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Title</p>
                <p className="text-sm font-medium text-card-foreground">{formData.title}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg sm:col-span-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Description</p>
                <p className="text-sm text-card-foreground leading-relaxed">{formData.description}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Location</p>
                <p className="text-sm text-card-foreground">{formData.location}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Priority</p>
                <p className="text-sm font-medium text-card-foreground capitalize">{formData.priority}</p>
              </div>
              {formData.contactName && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Contact</p>
                  <p className="text-sm text-card-foreground">{formData.contactName}</p>
                </div>
              )}
              {formData.files.length > 0 && (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Attachments</p>
                  <p className="text-sm text-card-foreground">{formData.files.length} file(s)</p>
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
          Back
        </button>

        {currentStep < steps.length - 1 ? (
          <button type="button" onClick={handleNext} disabled={!canProceed()} className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            Next
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 min-h-[44px] px-6 py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" aria-hidden="true" />}
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        )}
      </div>
    </div>
  );
}
