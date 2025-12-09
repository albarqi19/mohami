import React, { useState, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  RefreshCw,
  FileCheck,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Timer,
  ScrollText,
  Building,
  Eye,
} from 'lucide-react';
import { WekalatService } from '../services/wekalatService';
import type { Wekala, WekalaParty, WekalaPermission } from '../types';

// ==================== Types ====================

interface ToneMeta {
  label: string;
  tone: string;
  soft: string;
  border: string;
}

// ==================== Status Colors ====================

const STATUS_META: Record<string, ToneMeta> = {
  'معتمدة': {
    label: 'معتمدة',
    tone: 'var(--color-success)',
    soft: 'var(--color-success-soft)',
    border: 'rgba(27, 153, 139, 0.4)'
  },
  'منتهية': {
    label: 'منتهية',
    tone: 'var(--color-warning)',
    soft: 'var(--color-warning-soft)',
    border: 'rgba(244, 162, 89, 0.4)'
  },
  'مفسوخة': {
    label: 'مفسوخة',
    tone: 'var(--color-error)',
    soft: 'var(--color-error-soft)',
    border: 'rgba(209, 73, 91, 0.4)'
  },
  'قيد الاعتماد': {
    label: 'قيد الاعتماد',
    tone: 'var(--color-info)',
    soft: 'var(--color-info-soft)',
    border: 'rgba(59, 130, 246, 0.4)'
  },
  'موقوفة': {
    label: 'موقوفة',
    tone: 'var(--color-accent)',
    soft: 'var(--color-accent-soft)',
    border: 'rgba(197, 165, 114, 0.4)'
  },
};

// ==================== Helper Functions ====================

const getStatusMeta = (status: string): ToneMeta => {
  return STATUS_META[status] || {
    label: status || 'غير محدد',
    tone: 'var(--color-text-secondary)',
    soft: 'var(--color-neutral-soft)',
    border: 'var(--color-border)'
  };
};

const buildChipStyles = (meta: ToneMeta): CSSProperties => ({
  color: meta.tone,
  backgroundColor: meta.soft,
  border: `1px solid ${meta.border}`,
  padding: '6px 14px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
} as CSSProperties);

const formatDate = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return value;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'معتمدة':
      return <CheckCircle size={16} />;
    case 'منتهية':
      return <Timer size={16} />;
    case 'مفسوخة':
      return <XCircle size={16} />;
    case 'قيد الاعتماد':
      return <Clock size={16} />;
    case 'موقوفة':
      return <AlertCircle size={16} />;
    default:
      return <FileCheck size={16} />;
  }
};

// ==================== Skeleton Component ====================

const WekalaCardSkeleton: React.FC = () => (
  <div className="wekala-card wekala-card--skeleton" style={{
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-6)',
    border: '1px solid var(--color-border)',
    animation: 'pulse 1.5s infinite',
  }}>
    <div style={{ display: 'flex', gap: 'var(--space-4)', flexDirection: 'column' }}>
      <div style={{ height: '24px', width: '60%', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-xs)' }} />
      <div style={{ height: '20px', width: '40%', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-xs)' }} />
      <div style={{ height: '16px', width: '80%', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-xs)' }} />
      <div style={{ height: '16px', width: '50%', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-xs)' }} />
    </div>
  </div>
);

// ==================== Stats Card Component ====================

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  isActive?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, color, onClick, isActive }) => (
  <motion.div
    whileHover={{ scale: 1.02, translateY: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      background: isActive ? `${color}15` : 'var(--color-surface)',
      border: `1px solid ${isActive ? color : 'var(--color-border)'}`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all var(--transition-base)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      boxShadow: isActive ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
    }}
  >
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: 'var(--radius-sm)',
      background: `${color}18`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-heading)' }}>
        {value.toLocaleString('ar-SA')}
      </div>
      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        {label}
      </div>
    </div>
  </motion.div>
);

// ==================== Wekala Card Component ====================

interface WekalaCardProps {
  wekala: Wekala;
  onView: (wekala: Wekala) => void;
}

const WekalaCard: React.FC<WekalaCardProps> = ({ wekala, onView }) => {
  const statusMeta = getStatusMeta(wekala.status);
  const agents = wekala.agents || [];
  const clients = wekala.clients || [];
  
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ translateY: -4, boxShadow: 'var(--shadow-md)' }}
      onClick={() => onView(wekala)}
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        border: '1px solid var(--color-border)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* الشريط الجانبي الملون */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '4px',
        height: '100%',
        background: statusMeta.tone,
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
      }} />

      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-4)',
        paddingRight: 'var(--space-3)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            color: 'var(--color-heading)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            <FileCheck size={18} style={{ color: statusMeta.tone }} />
            وكالة رقم: {wekala.number}
          </h3>
          {wekala.type && (
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Briefcase size={14} />
              {wekala.type}
            </span>
          )}
        </div>
        <span style={buildChipStyles(statusMeta)}>
          {getStatusIcon(wekala.status)}
          {statusMeta.label}
        </span>
      </header>

      {/* Clients (الموكلين) */}
      {clients.length > 0 && (
        <div style={{
          marginBottom: 'var(--space-3)',
          padding: 'var(--space-3)',
          background: 'var(--color-info-soft)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-info)',
            marginBottom: 'var(--space-2)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <User size={14} />
            الموكلين ({clients.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {clients.slice(0, 2).map((client, idx) => (
              <span key={idx} style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text)',
                background: 'var(--color-surface)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border)',
              }}>
                {client.name}
              </span>
            ))}
            {clients.length > 2 && (
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                padding: '4px 10px',
              }}>
                +{clients.length - 2} آخرين
              </span>
            )}
          </div>
        </div>
      )}

      {/* Agents (الوكلاء/المحامين) */}
      {agents.length > 0 && (
        <div style={{
          marginBottom: 'var(--space-3)',
          padding: 'var(--space-3)',
          background: 'var(--color-success-soft)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-success)',
            marginBottom: 'var(--space-2)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Shield size={14} />
            الوكلاء ({agents.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {agents.slice(0, 2).map((agent, idx) => (
              <span key={idx} style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text)',
                background: 'var(--color-surface)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border)',
              }}>
                {agent.name}
                {agent.adjective && (
                  <span style={{ color: 'var(--color-text-secondary)', marginRight: '4px' }}>
                    ({agent.adjective})
                  </span>
                )}
              </span>
            ))}
            {agents.length > 2 && (
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                padding: '4px 10px',
              }}>
                +{agents.length - 2} آخرين
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer - Dates */}
      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 'var(--space-3)',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'var(--space-3)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
        }}>
          <Calendar size={14} />
          الإصدار: {wekala.issue_date_hijri || formatDate(wekala.issue_date) || 'غير محدد'}
        </div>
        {wekala.expiry_date_hijri || wekala.expiry_date ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--font-size-xs)',
            color: wekala.status === 'منتهية' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
          }}>
            <Clock size={14} />
            الانتهاء: {wekala.expiry_date_hijri || formatDate(wekala.expiry_date)}
          </div>
        ) : null}
      </footer>
    </motion.article>
  );
};

// ==================== Details Modal Component ====================

interface WekalaDetailsModalProps {
  wekala: Wekala | null;
  isOpen: boolean;
  onClose: () => void;
}

const WekalaDetailsModal: React.FC<WekalaDetailsModalProps> = ({ wekala, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'clients' | 'agents' | 'permissions'>('info');

  if (!wekala) return null;

  const statusMeta = getStatusMeta(wekala.status);
  const agents = wekala.agents || [];
  const clients = wekala.clients || [];
  const permissions = wekala.permissions || [];

  const tabs = [
    { id: 'info', label: 'معلومات عامة', icon: <FileText size={18} /> },
    { id: 'clients', label: `الموكلين (${clients.length})`, icon: <User size={18} /> },
    { id: 'agents', label: `الوكلاء (${agents.length})`, icon: <Shield size={18} /> },
    { id: 'permissions', label: `الصلاحيات (${permissions.length})`, icon: <ScrollText size={18} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 25, 47, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-5)',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Modal Header */}
            <header style={{
              padding: 'var(--space-6)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface-subtle)',
            }}>
              <div>
                <h2 style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-heading)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}>
                  <FileCheck size={28} style={{ color: statusMeta.tone }} />
                  وكالة رقم: {wekala.number}
                </h2>
                {wekala.type && (
                  <p style={{
                    margin: 'var(--space-2) 0 0',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}>
                    <Briefcase size={16} />
                    {wekala.type}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={buildChipStyles(statusMeta)}>
                  {getStatusIcon(wekala.status)}
                  {statusMeta.label}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2)',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </header>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-1)',
              padding: 'var(--space-4) var(--space-6)',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-subtle)',
              overflowX: 'auto',
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap',
                    boxShadow: activeTab === tab.id ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div style={{
              padding: 'var(--space-6)',
              overflowY: 'auto',
              flex: 1,
            }}>
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
                  {/* Quick Info Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)',
                  }}>
                    <div style={{
                      padding: 'var(--space-4)',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Calendar size={20} style={{ color: 'var(--color-info)' }} />
                      <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>تاريخ الإصدار</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{wekala.issue_date_hijri || formatDate(wekala.issue_date) || 'غير محدد'}</div>
                      </div>
                    </div>
                    <div style={{
                      padding: 'var(--space-4)',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Clock size={20} style={{ color: 'var(--color-warning)' }} />
                      <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>تاريخ الانتهاء</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{wekala.expiry_date_hijri || formatDate(wekala.expiry_date) || 'غير محدد'}</div>
                      </div>
                    </div>
                    {wekala.issue_location && (
                      <div style={{
                        padding: 'var(--space-4)',
                        background: 'var(--color-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        border: '1px solid var(--color-border)',
                      }}>
                        <Building size={20} style={{ color: 'var(--color-success)' }} />
                        <div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>مكان الإصدار</div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{wekala.issue_location}</div>
                        </div>
                      </div>
                    )}
                    <div style={{
                      padding: 'var(--space-4)',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Users size={20} style={{ color: 'var(--color-accent)' }} />
                      <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>عدد الأطراف</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{clients.length + agents.length} طرف</div>
                      </div>
                    </div>
                  </div>

                  {/* Agency Text */}
                  {wekala.agency_text && (
                    <div style={{
                      padding: 'var(--space-5)',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <h4 style={{
                        margin: '0 0 var(--space-3)',
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        color: 'var(--color-heading)',
                      }}>
                        <ScrollText size={18} style={{ color: 'var(--color-info)' }} />
                        نص الوكالة
                      </h4>
                      <p style={{
                        margin: 0,
                        lineHeight: 1.8,
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        fontSize: 'var(--font-size-sm)',
                      }}>
                        {wekala.agency_text}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Clients Tab */}
              {activeTab === 'clients' && (
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {clients.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: 'var(--space-9)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      لا يوجد موكلين
                    </div>
                  ) : (
                    clients.map((client, idx) => (
                      <PartyCard key={idx} party={client} type="client" />
                    ))
                  )}
                </div>
              )}

              {/* Agents Tab */}
              {activeTab === 'agents' && (
                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  {agents.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: 'var(--space-9)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      لا يوجد وكلاء
                    </div>
                  ) : (
                    agents.map((agent, idx) => (
                      <PartyCard key={idx} party={agent} type="agent" />
                    ))
                  )}
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === 'permissions' && (
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  {permissions.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: 'var(--space-9)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      لا توجد صلاحيات
                    </div>
                  ) : (
                    permissions.map((permission, idx) => (
                      <PermissionCard key={idx} permission={permission} />
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== Party Card Component ====================

interface PartyCardProps {
  party: WekalaParty;
  type: 'agent' | 'client';
}

const PartyCard: React.FC<PartyCardProps> = ({ party, type }) => {
  const isAgent = type === 'agent';
  const color = isAgent ? 'var(--color-success)' : 'var(--color-info)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        padding: 'var(--space-4) var(--space-5)',
        background: 'var(--color-surface-subtle)',
        borderRadius: 'var(--radius-sm)',
        borderRight: `4px solid ${color}`,
        border: '1px solid var(--color-border)',
        borderRightWidth: '4px',
        borderRightColor: color,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <h4 style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-heading)',
          }}>
            {isAgent ? <Shield size={18} style={{ color }} /> : <User size={18} style={{ color }} />}
            {party.name}
          </h4>
          {party.adjective && (
            <span style={{
              display: 'inline-block',
              marginTop: 'var(--space-2)',
              padding: '4px 10px',
              background: isAgent ? 'var(--color-success-soft)' : 'var(--color-info-soft)',
              color: color,
              borderRadius: 'var(--radius-xs)',
              fontSize: 'var(--font-size-xs)',
            }}>
              {party.adjective}
            </span>
          )}
        </div>
        {party.id_number && (
          <span style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-surface)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--color-border)',
          }}>
            {party.id_number}
          </span>
        )}
      </div>
      {party.representation_text && (
        <p style={{
          margin: 'var(--space-3) 0 0',
          padding: 'var(--space-3)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xs)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1.7,
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
        }}>
          {party.representation_text}
        </p>
      )}
    </motion.div>
  );
};

// ==================== Permission Card Component ====================

interface PermissionCardProps {
  permission: WekalaPermission;
}

const PermissionCard: React.FC<PermissionCardProps> = ({ permission }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const clauses = permission.clauses || [];

  return (
    <motion.div
      layout
      style={{
        padding: 'var(--space-4) var(--space-5)',
        background: 'var(--color-surface-subtle)',
        borderRadius: 'var(--radius-sm)',
        borderRight: '4px solid var(--color-accent)',
        border: '1px solid var(--color-border)',
        borderRightWidth: '4px',
        borderRightColor: 'var(--color-accent)',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <h4 style={{
          margin: 0,
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: 'var(--color-heading)',
        }}>
          <ScrollText size={18} style={{ color: 'var(--color-accent)' }} />
          {permission.category || 'صلاحية عامة'}
          {clauses.length > 0 && (
            <span style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              fontWeight: 400,
            }}>
              ({clauses.length} بند)
            </span>
          )}
        </h4>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft size={18} style={{ color: 'var(--color-text-secondary)' }} />
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isExpanded && clauses.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <ul style={{
              margin: 'var(--space-3) 0 0',
              padding: '0 var(--space-5)',
              listStyle: 'none',
            }}>
              {clauses.map((clause, idx) => (
                <li key={idx} style={{
                  padding: 'var(--space-2) 0',
                  borderBottom: idx < clauses.length - 1 ? '1px dashed var(--color-border)' : 'none',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                }}>
                  <CheckCircle size={14} style={{ color: 'var(--color-success)', marginTop: '4px', flexShrink: 0 }} />
                  {clause}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      
      {permission.grouped_text && !isExpanded && (
        <p style={{
          margin: 'var(--space-3) 0 0',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          maxHeight: '60px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {permission.grouped_text}
        </p>
      )}
    </motion.div>
  );
};

// ==================== Main Wekalat Component ====================

const Wekalat: React.FC = () => {
  const [wekalat, setWekalat] = useState<Wekala[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('معتمدة');
  const [selectedWekala, setSelectedWekala] = useState<Wekala | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  // Stats from server
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    expired: 0,
    cancelled: 0,
    pending: 0,
  });

  const fetchStats = async () => {
    try {
      const serverStats = await WekalatService.getWekalatStats();
      setStats(serverStats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchWekalat = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        page,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };

      const response = await WekalatService.getWekalat(filters);
      const data = Array.isArray(response.data) ? response.data : [];

      setWekalat(data);
      setPagination({
        currentPage: response.current_page ?? page,
        totalPages: response.last_page ?? 1,
        total: response.total ?? data.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في جلب الوكالات');
      console.error('Error fetching wekalat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWekalat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchWekalat(1);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleViewWekala = (wekala: Wekala) => {
    setSelectedWekala(wekala);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchWekalat(page);
  };

  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'all';
  const canGoPrev = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < pagination.totalPages;

  return (
    <div className="page-wrapper wekalat-page">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
        style={{
          marginBottom: 'var(--space-5)',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}>
          <div>
            <h1 className="page-title__text" style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-heading)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}>
              <FileCheck size={28} style={{ color: 'var(--color-primary)' }} />
              الوكالات 
            </h1>
            <p className="hide-on-mobile" style={{
              margin: 'var(--space-2) 0 0',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}>
              إدارة ومتابعة الوكالات المستوردة من منصة ناجز
            </p>
          </div>
          <motion.button
            className="refresh-btn hide-on-mobile"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchWekalat(pagination.currentPage)}
            disabled={loading}
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-5)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 500,
              opacity: loading ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'جاري التحديث...' : 'تحديث القائمة'}
          </motion.button>
        </div>
      </motion.header>

      {/* Stats Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stats-section"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <StatsCard
          icon={<FileCheck size={24} />}
          label="إجمالي الوكالات"
          value={stats.total}
          color="var(--color-primary)"
          onClick={() => setStatusFilter('all')}
          isActive={statusFilter === 'all'}
        />
        <StatsCard
          icon={<CheckCircle size={24} />}
          label="معتمدة"
          value={stats.approved}
          color="var(--color-success)"
          onClick={() => setStatusFilter('معتمدة')}
          isActive={statusFilter === 'معتمدة'}
        />
        <StatsCard
          icon={<Timer size={24} />}
          label="منتهية"
          value={stats.expired}
          color="var(--color-warning)"
          onClick={() => setStatusFilter('منتهية')}
          isActive={statusFilter === 'منتهية'}
        />
        <StatsCard
          icon={<XCircle size={24} />}
          label="مفسوخة"
          value={stats.cancelled}
          color="var(--color-error)"
          onClick={() => setStatusFilter('مفسوخة')}
          isActive={statusFilter === 'مفسوخة'}
        />
      </motion.section>

      {/* Search & Filters */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="search-section"
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{
          flex: 1,
          minWidth: '200px',
          position: 'relative',
        }}>
          <Search size={16} style={{
            position: 'absolute',
            right: 'var(--space-3)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-secondary)',
          }} />
          <input
            type="text"
            placeholder="ابحث برقم الوكالة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-8) var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            minWidth: '120px',
          }}
        >
          <option value="all">جميع الحالات</option>
          <option value="معتمدة">معتمدة</option>
          <option value="منتهية">منتهية</option>
          <option value="مفسوخة">مفسوخة</option>
          <option value="قيد الاعتماد">قيد الاعتماد</option>
          <option value="موقوفة">موقوفة</option>
        </select>

        {hasActiveFilters && statusFilter !== 'معتمدة' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('معتمدة');
            }}
            className="hide-on-mobile"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Filter size={18} />
            مسح الفلاتر
          </motion.button>
        )}

        <div style={{
          marginRight: 'auto',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}>
          عدد النتائج: {pagination.total}
        </div>
      </motion.section>

      {/* Wekalat Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-5)',
          }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <WekalaCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-5)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}>
            <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)' }} />
            <h3 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-heading)' }}>
              حدث خطأ أثناء جلب البيانات
            </h3>
            <p style={{ margin: '0 0 var(--space-5)', color: 'var(--color-text-secondary)' }}>{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchWekalat(pagination.currentPage)}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3) var(--space-6)',
                cursor: 'pointer',
              }}
            >
              إعادة المحاولة
            </motion.button>
          </div>
        )}

        {!loading && !error && wekalat.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-5)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}>
            <FileCheck size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }} />
            <h3 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-heading)' }}>
              لا توجد وكالات
            </h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {hasActiveFilters
                ? 'جرّب تعديل معايير البحث'
                : 'استخدم إضافة ناجز لاستيراد الوكالات'}
            </p>
          </div>
        )}

        {!loading && !error && wekalat.length > 0 && (
          <motion.div
            layout
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-5)',
            }}
          >
            <AnimatePresence>
              {wekalat.map((wekala) => (
                <WekalaCard
                  key={wekala.id}
                  wekala={wekala}
                  onView={handleViewWekala}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>

      {/* Pagination */}
      {!loading && !error && wekalat.length > 0 && pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-7)',
            padding: 'var(--space-4)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            flexWrap: 'wrap',
            overflowX: 'auto',
            maxWidth: '100%',
          }}
        >
          <motion.button
            whileHover={{ scale: canGoPrev ? 1.05 : 1 }}
            whileTap={{ scale: canGoPrev ? 0.95 : 1 }}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!canGoPrev}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-border)',
              background: canGoPrev ? 'var(--color-surface-subtle)' : 'transparent',
              color: canGoPrev ? 'var(--color-text)' : 'var(--color-text-secondary)',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              opacity: canGoPrev ? 1 : 0.5,
              fontSize: 'var(--font-size-sm)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <ChevronRight size={16} />
            السابق
          </motion.button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, idx) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = idx + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = idx + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + idx;
              } else {
                pageNum = pagination.currentPage - 2 + idx;
              }

              return (
                <motion.button
                  key={pageNum}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-xs)',
                    border: pagination.currentPage === pageNum ? 'none' : '1px solid var(--color-border)',
                    background: pagination.currentPage === pageNum
                      ? 'var(--color-primary)'
                      : 'transparent',
                    color: pagination.currentPage === pageNum ? '#fff' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontWeight: pagination.currentPage === pageNum ? 600 : 400,
                    fontSize: 'var(--font-size-sm)',
                    flexShrink: 0,
                  }}
                >
                  {pageNum}
                </motion.button>
              );
            })}
          </div>

          <motion.button
            whileHover={{ scale: canGoNext ? 1.05 : 1 }}
            whileTap={{ scale: canGoNext ? 0.95 : 1 }}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!canGoNext}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--color-border)',
              background: canGoNext ? 'var(--color-surface-subtle)' : 'transparent',
              color: canGoNext ? 'var(--color-text)' : 'var(--color-text-secondary)',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              opacity: canGoNext ? 1 : 0.5,
              fontSize: 'var(--font-size-sm)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            التالي
            <ChevronLeft size={16} />
          </motion.button>
        </motion.div>
      )}

      {/* Details Modal */}
      <WekalaDetailsModal
        wekala={selectedWekala}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWekala(null);
        }}
      />

      {/* Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .wekalat-page {
            padding: var(--space-3) !important;
          }
          
          .hide-on-mobile {
            display: none !important;
          }
          
          .stats-section {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: var(--space-2) !important;
            margin-bottom: var(--space-4) !important;
          }
          
          .search-section {
            gap: var(--space-2) !important;
            margin-bottom: var(--space-4) !important;
          }
          
          .search-section > div:first-child {
            min-width: 100% !important;
            flex: 1 1 100% !important;
          }
          
          .search-section select {
            flex: 1 !important;
            min-width: auto !important;
          }
        }
        
        @media (max-width: 480px) {
          .stats-section {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Wekalat;
