import React, { useState, useEffect } from 'react';

const DEPARTMENTS = [
  'Front of House & Service',
  'Kitchen & Culinary',
  'Bar & Beverage',
  'Management & Operations'
];

const SHIFTS = [
  'Morning Shift (07:00 - 15:00)',
  'Evening Shift (15:00 - 23:00)',
  'Full-Time Day (08:00 - 17:00)',
  'Split / Flexible Shift',
  'Weekend Dedicated'
];

export default function StaffFormModal({ isOpen, onClose, editingStaff = null, onSave, onShowToast }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Front of House & Service');
  const [shift, setShift] = useState('Morning Shift (07:00 - 15:00)');
  const [hourlyRate, setHourlyRate] = useState('4.50');
  const [dutyStatus, setDutyStatus] = useState('on_duty');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingStaff) {
      setName(editingStaff.name || '');
      setUsername(editingStaff.username || '');
      setPassword(editingStaff.password || '');
      setRole(editingStaff.role || 'staff');
      setPhone(editingStaff.phone || '');
      setEmail(editingStaff.email || '');
      setDepartment(editingStaff.department || 'Front of House & Service');
      setShift(editingStaff.shift || 'Morning Shift (07:00 - 15:00)');
      setHourlyRate(editingStaff.hourlyRate !== undefined ? String(editingStaff.hourlyRate) : '4.50');
      setDutyStatus(editingStaff.dutyStatus || 'on_duty');
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setRole('staff');
      setPhone('');
      setEmail('');
      setDepartment('Front of House & Service');
      setShift('Morning Shift (07:00 - 15:00)');
      setHourlyRate('4.50');
      setDutyStatus('on_duty');
    }
    setErrorMsg('');
  }, [editingStaff, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUser = username.trim().toLowerCase();

    if (!cleanName) {
      setErrorMsg('Please enter employee full name.');
      return;
    }
    if (!cleanUser) {
      setErrorMsg('Please enter a login username.');
      return;
    }
    if (!editingStaff && !password.trim()) {
      setErrorMsg('Please assign an initial password for the staff account.');
      return;
    }

    const payload = {
      id: editingStaff?.id || `staff-${Date.now()}`,
      name: cleanName,
      username: cleanUser,
      password: password.trim() || editingStaff?.password || 'staff123',
      role,
      phone: phone.trim() || 'N/A',
      email: email.trim() || `${cleanUser}@bistro.com`,
      department,
      shift,
      hourlyRate: Number(hourlyRate) || 4.5,
      dutyStatus,
      hireDate: editingStaff?.hireDate || new Date().toISOString().split('T')[0]
    };

    onSave(payload);
    if (onShowToast) {
      onShowToast(
        editingStaff ? `Staff profile "${cleanName}" updated.` : `New staff "${cleanName}" onboarded!`,
        'success'
      );
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          padding: '1.75rem 2rem',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                boxShadow: '0 4px 12px var(--primary-glow)'
              }}
            >
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {editingStaff ? 'Edit Staff Profile' : 'Onboard New Staff Member'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Restaurant Human Resources &amp; Role Permissions
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'static' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.65rem 0.9rem',
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body without horizontal overflow */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            paddingRight: '2px',
            boxSizing: 'border-box'
          }}
        >
          {/* Row 1: Full Name & Username */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>
                Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Serey Vathna"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>
                Login Username <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="e.g. vathna"
                required
              />
            </div>
          </div>

          {/* Row 2: Password & Role */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>
                Password {editingStaff ? '(leave blank to keep current)' : <span style={{ color: 'var(--danger)' }}>*</span>}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingStaff ? 'Keep current password' : 'e.g. pass123'}
                required={!editingStaff}
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>Access Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="staff">Staff (Front-of-House / Floor / POS)</option>
                <option value="kitchen">Kitchen (Chefs / Back-of-House KDS)</option>
                <option value="manager">Manager (Menu, Layout, Floor, Reports)</option>
                <option value="admin">Admin (Full System &amp; User Control)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Department & Shift */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>Department / Station</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>Assigned Shift</label>
              <select value={shift} onChange={(e) => setShift(e.target.value)}>
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Phone & Email */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +855 12 345 678"
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@bistro.com"
              />
            </div>
          </div>

          {/* Row 5: Hourly Rate & Duty Status */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>Hourly Rate ($ / hr)</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="4.50"
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label>Current Duty Status</label>
              <select value={dutyStatus} onChange={(e) => setDutyStatus(e.target.value)}>
                <option value="on_duty">🟢 On Duty (Active / Clocked In)</option>
                <option value="on_break">🟡 On Break</option>
                <option value="off_duty">⚪ Off Duty (Clocked Out)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.35rem', fontWeight: 700 }}
            >
              <i className="fa-solid fa-check"></i>{' '}
              {editingStaff ? 'Save Changes' : 'Onboard Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
