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
  Download,
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
    tone: '#10b981',
    soft: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)'
  },
  'منتهية': {
    label: 'منتهية',
    tone: '#f59e0b',
    soft: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)'
  },
  'مفسوخة': {
    label: 'مفسوخة',
    tone: '#ef4444',
    soft: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)'
  },
  'قيد الاعتماد': {
    label: 'قيد الاعتماد',
    tone: '#6366f1',
    soft: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.4)'
  },
  'موقوفة': {
    label: 'موقوفة',
    tone: '#8b5cf6',
    soft: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.4)'
  },
};

// ==================== Helper Functions ====================

const getStatusMeta = (status: string): ToneMeta => {
  return STATUS_META[status] || {
    label: status || 'غير محدد',
    tone: '#6b7280',
    soft: 'rgba(107, 114, 128, 0.15)',
    border: 'rgba(107, 114, 128, 0.4)'
  };
};

const buildChipStyles = (meta: ToneMeta): CSSProperties => ({
  '--chip-color': meta.tone,
  '--chip-bg': meta.soft,
  '--chip-border': meta.border,
  color: meta.tone,
  backgroundColor: meta.soft,
  border: `1px solid ${meta.border}`,
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '0.85rem',
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
    background: 'var(--color-bg-secondary)',
    borderRadius: '16px',
    padding: '24px',
    animation: 'pulse 1.5s infinite',
  }}>
    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
      <div style={{ height: '24px', width: '60%', background: 'var(--color-bg-tertiary)', borderRadius: '8px' }} />
      <div style={{ height: '20px', width: '40%', background: 'var(--color-bg-tertiary)', borderRadius: '8px' }} />
      <div style={{ height: '16px', width: '80%', background: 'var(--color-bg-tertiary)', borderRadius: '8px' }} />
      <div style={{ height: '16px', width: '50%', background: 'var(--color-bg-tertiary)', borderRadius: '8px' }} />
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
    whileHover={{ scale: 1.02, translateY: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      background: isActive ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)` : 'var(--color-bg-secondary)',
      border: `2px solid ${isActive ? color : 'transparent'}`,
      borderRadius: '16px',
      padding: '20px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}
  >
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {value.toLocaleString('ar-SA')}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
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
      whileHover={{ translateY: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
      onClick={() => onView(wekala)}
      style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: '20px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid var(--color-border)',
        position: 'relative',
        overflow: 'hidden',
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
        borderRadius: '0 20px 20px 0',
      }} />

      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FileCheck size={20} style={{ color: statusMeta.tone }} />
            وكالة رقم: {wekala.number}
          </h3>
          {wekala.type && (
            <span style={{
              fontSize: '0.85rem',
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
          marginBottom: '12px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderRadius: '12px',
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: '#3b82f6',
            marginBottom: '8px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <User size={14} />
            الموكلين ({clients.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {clients.slice(0, 3).map((client, idx) => (
              <span key={idx} style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-primary)',
                padding: '4px 10px',
                borderRadius: '8px',
              }}>
                {client.name}
              </span>
            ))}
            {clients.length > 3 && (
              <span style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                padding: '4px 10px',
              }}>
                +{clients.length - 3} آخرين
              </span>
            )}
          </div>
        </div>
      )}

      {/* Agents (الوكلاء/المحامين) */}
      {agents.length > 0 && (
        <div style={{
          marginBottom: '12px',
          padding: '12px',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: '12px',
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: '#10b981',
            marginBottom: '8px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Shield size={14} />
            الوكلاء ({agents.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {agents.slice(0, 2).map((agent, idx) => (
              <span key={idx} style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-primary)',
                padding: '4px 10px',
                borderRadius: '8px',
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
                fontSize: '0.85rem',
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
        paddingTop: '12px',
        borderTop: '1px solid var(--color-border)',
        marginTop: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
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
            fontSize: '0.8rem',
            color: wekala.status === 'منتهية' ? '#f59e0b' : 'var(--color-text-secondary)',
          }}>
            <Clock size={14} />
            الانتهاء: {wekala.expiry_date_hijri || formatDate(wekala.expiry_date)}
          </div>
        ) : null}
      </footer>

      {/* View Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onView(wekala);
        }}
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '8px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        <Eye size={16} />
        عرض
      </motion.button>
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
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-primary)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <header style={{
              padding: '24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: `linear-gradient(135deg, ${statusMeta.soft} 0%, transparent 100%)`,
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <FileCheck size={28} style={{ color: statusMeta.tone }} />
                  وكالة رقم: {wekala.number}
                </h2>
                {wekala.type && (
                  <p style={{
                    margin: '8px 0 0',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <Briefcase size={16} />
                    {wekala.type}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={buildChipStyles(statusMeta)}>
                  {getStatusIcon(wekala.status)}
                  {statusMeta.label}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px',
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
              gap: '4px',
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--color-bg-primary)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
            }}>
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {/* Quick Info Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                  }}>
                    <div style={{
                      padding: '16px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <Calendar size={20} style={{ color: '#6366f1' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>تاريخ الإصدار</div>
                        <div style={{ fontWeight: 600 }}>{wekala.issue_date_hijri || formatDate(wekala.issue_date) || 'غير محدد'}</div>
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <Clock size={20} style={{ color: '#f59e0b' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>تاريخ الانتهاء</div>
                        <div style={{ fontWeight: 600 }}>{wekala.expiry_date_hijri || formatDate(wekala.expiry_date) || 'غير محدد'}</div>
                      </div>
                    </div>
                    {wekala.issue_location && (
                      <div style={{
                        padding: '16px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        <Building size={20} style={{ color: '#10b981' }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>مكان الإصدار</div>
                          <div style={{ fontWeight: 600 }}>{wekala.issue_location}</div>
                        </div>
                      </div>
                    )}
                    <div style={{
                      padding: '16px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <Users size={20} style={{ color: '#8b5cf6' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>عدد الأطراف</div>
                        <div style={{ fontWeight: 600 }}>{clients.length + agents.length} طرف</div>
                      </div>
                    </div>
                  </div>

                  {/* Agency Text */}
                  {wekala.agency_text && (
                    <div style={{
                      padding: '20px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '16px',
                    }}>
                      <h4 style={{
                        margin: '0 0 12px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <ScrollText size={18} style={{ color: '#6366f1' }} />
                        نص الوكالة
                      </h4>
                      <p style={{
                        margin: 0,
                        lineHeight: 1.8,
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        fontSize: '0.9rem',
                      }}>
                        {wekala.agency_text}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Clients Tab */}
              {activeTab === 'clients' && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {clients.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
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
                <div style={{ display: 'grid', gap: '12px' }}>
                  {agents.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
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
                <div style={{ display: 'grid', gap: '16px' }}>
                  {permissions.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
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
  const color = isAgent ? '#10b981' : '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        padding: '16px 20px',
        background: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        borderRight: `4px solid ${color}`,
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
            fontSize: '1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {isAgent ? <Shield size={18} style={{ color }} /> : <User size={18} style={{ color }} />}
            {party.name}
          </h4>
          {party.adjective && (
            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '4px 10px',
              background: `${color}15`,
              color: color,
              borderRadius: '6px',
              fontSize: '0.8rem',
            }}>
              {party.adjective}
            </span>
          )}
        </div>
        {party.id_number && (
          <span style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-primary)',
            padding: '6px 12px',
            borderRadius: '8px',
          }}>
            {party.id_number}
          </span>
        )}
      </div>
      {party.representation_text && (
        <p style={{
          margin: '12px 0 0',
          padding: '12px',
          background: 'var(--color-bg-primary)',
          borderRadius: '8px',
          fontSize: '0.85rem',
          lineHeight: 1.7,
          color: 'var(--color-text-secondary)',
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
        padding: '16px 20px',
        background: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        borderRight: '4px solid #8b5cf6',
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
          fontSize: '1rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <ScrollText size={18} style={{ color: '#8b5cf6' }} />
          {permission.category || 'صلاحية عامة'}
          {clauses.length > 0 && (
            <span style={{
              fontSize: '0.8rem',
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
              margin: '12px 0 0',
              padding: '0 20px',
              listStyle: 'none',
            }}>
              {clauses.map((clause, idx) => (
                <li key={idx} style={{
                  padding: '8px 0',
                  borderBottom: idx < clauses.length - 1 ? '1px dashed var(--color-border)' : 'none',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <CheckCircle size={14} style={{ color: '#10b981', marginTop: '4px', flexShrink: 0 }} />
                  {clause}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      
      {permission.grouped_text && !isExpanded && (
        <p style={{
          margin: '12px 0 0',
          fontSize: '0.85rem',
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWekala, setSelectedWekala] = useState<Wekala | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  // Stats from data
  const stats = useMemo(() => {
    const all = wekalat;
    return {
      total: pagination.total || all.length,
      approved: all.filter(w => w.status === 'معتمدة').length,
      expired: all.filter(w => w.status === 'منتهية').length,
      cancelled: all.filter(w => w.status === 'مفسوخة').length,
      pending: all.filter(w => w.status === 'قيد الاعتماد').length,
    };
  }, [wekalat, pagination.total]);

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
    <div className="page-wrapper" style={{ padding: '24px' }}>
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: '32px',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <FileCheck size={32} style={{ color: '#6366f1' }} />
              الوكالات 
            </h1>
            <p style={{
              margin: '8px 0 0',
              color: 'var(--color-text-secondary)',
              fontSize: '1rem',
            }}>
              إدارة ومتابعة الوكالات المستوردة من منصة ناجز
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fetchWekalat(pagination.currentPage)}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1rem',
              fontWeight: 500,
              opacity: loading ? 0.7 : 1,
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
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatsCard
          icon={<FileCheck size={28} />}
          label="إجمالي الوكالات"
          value={stats.total}
          color="#6366f1"
          onClick={() => setStatusFilter('all')}
          isActive={statusFilter === 'all'}
        />
        <StatsCard
          icon={<CheckCircle size={28} />}
          label="معتمدة"
          value={stats.approved}
          color="#10b981"
          onClick={() => setStatusFilter('معتمدة')}
          isActive={statusFilter === 'معتمدة'}
        />
        <StatsCard
          icon={<Timer size={28} />}
          label="منتهية"
          value={stats.expired}
          color="#f59e0b"
          onClick={() => setStatusFilter('منتهية')}
          isActive={statusFilter === 'منتهية'}
        />
        <StatsCard
          icon={<XCircle size={28} />}
          label="مفسوخة"
          value={stats.cancelled}
          color="#ef4444"
          onClick={() => setStatusFilter('مفسوخة')}
          isActive={statusFilter === 'مفسوخة'}
        />
      </motion.section>

      {/* Search & Filters */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{
          flex: 1,
          minWidth: '250px',
          position: 'relative',
        }}>
          <Search size={20} style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-secondary)',
          }} />
          <input
            type="text"
            placeholder="ابحث برقم الوكالة أو اسم الموكل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 48px 14px 14px',
              borderRadius: '12px',
              border: '2px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            border: '2px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            fontSize: '1rem',
            cursor: 'pointer',
            minWidth: '160px',
          }}
        >
          <option value="all">جميع الحالات</option>
          <option value="معتمدة">معتمدة</option>
          <option value="منتهية">منتهية</option>
          <option value="مفسوخة">مفسوخة</option>
          <option value="قيد الاعتماد">قيد الاعتماد</option>
          <option value="موقوفة">موقوفة</option>
        </select>

        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: '2px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Filter size={18} />
            مسح الفلاتر
          </motion.button>
        )}

        <div style={{
          marginRight: 'auto',
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <WekalaCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '20px',
          }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
              حدث خطأ أثناء جلب البيانات
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--color-text-secondary)' }}>{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchWekalat(pagination.currentPage)}
              style={{
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
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
            padding: '60px 20px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '20px',
          }}>
            <FileCheck size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px',
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
            gap: '16px',
            marginTop: '32px',
            padding: '20px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '16px',
          }}
        >
          <motion.button
            whileHover={{ scale: canGoPrev ? 1.05 : 1 }}
            whileTap={{ scale: canGoPrev ? 0.95 : 1 }}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!canGoPrev}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: canGoPrev ? 'var(--color-bg-primary)' : 'transparent',
              color: canGoPrev ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: canGoPrev ? 1 : 0.5,
            }}
          >
            <ChevronRight size={18} />
            السابق
          </motion.button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    border: 'none',
                    background: pagination.currentPage === pageNum
                      ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                      : 'transparent',
                    color: pagination.currentPage === pageNum ? '#fff' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontWeight: pagination.currentPage === pageNum ? 600 : 400,
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
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: canGoNext ? 'var(--color-bg-primary)' : 'transparent',
              color: canGoNext ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: canGoNext ? 1 : 0.5,
            }}
          >
            التالي
            <ChevronLeft size={18} />
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
      `}</style>
    </div>
  );
};

export default Wekalat;
