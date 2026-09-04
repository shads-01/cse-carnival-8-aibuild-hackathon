import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  helperText?: string;
}

interface RecordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: FieldConfig[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  submitLabel?: string;
}

export const RecordDialog: React.FC<RecordDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = 'Save Record'
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(initialValues || {});
    setErrors({});
  }, [initialValues, isOpen]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    fields.forEach((f) => {
      if (f.required && (formData[f.name] === undefined || formData[f.name] === '')) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} maxWidth="560px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {errors.form && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              fontSize: '0.85rem'
            }}
          >
            {errors.form}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {fields.map((field) => {
            const val = formData[field.name] ?? '';

            if (field.type === 'select') {
              return (
                <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                  </label>
                  <select
                    className="glass-input"
                    value={val}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      borderColor: errors[field.name] ? 'var(--danger)' : undefined
                    }}
                  >
                    <option value="">Select {field.label}...</option>
                    {field.options?.map((opt) => (
                      <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors[field.name] && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{errors[field.name]}</span>
                  )}
                </div>
              );
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                  </label>
                  <textarea
                    className="glass-input"
                    rows={3}
                    placeholder={field.placeholder}
                    value={val}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      borderColor: errors[field.name] ? 'var(--danger)' : undefined
                    }}
                  />
                  {errors[field.name] && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{errors[field.name]}</span>
                  )}
                </div>
              );
            }

            return (
              <div key={field.name}>
                <Input
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={val}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  error={errors[field.name]}
                  helperText={field.helperText}
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--glass-border)'
          }}
        >
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
