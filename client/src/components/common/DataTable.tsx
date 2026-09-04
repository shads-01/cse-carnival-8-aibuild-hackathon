import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from './Input';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  headerAction?: React.ReactNode;
  filterSlot?: React.ReactNode;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchKeys,
  headerAction,
  filterSlot,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items to display.',
  onRowClick,
  renderMobileCard
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered & Sorted records
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((row) => {
        if (searchKeys && searchKeys.length > 0) {
          return searchKeys.some((k) => String(row[k] || '').toLowerCase().includes(lower));
        }
        return Object.values(row).some((val) =>
          typeof val === 'string' || typeof val === 'number'
            ? String(val).toLowerCase().includes(lower)
            : false
        );
      });
    }

    // Sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = aVal > bVal ? 1 : -1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, searchKeySelector, sortKey, sortOrder]);

  function searchKeySelector() {
    return searchKeys;
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Top Bar: Search, Filters, and Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 260px', maxWidth: '400px' }}>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            leftIcon={<Search size={16} />}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {filterSlot}
          {headerAction}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton height="45px" />
          <Skeleton height="55px" />
          <Skeleton height="55px" />
          <Skeleton height="55px" />
        </div>
      ) : filteredData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Desktop Table View */}
          <div
            className="glass desktop-table-container"
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg-hover)'
                  }}
                >
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      style={{
                        padding: '12px 16px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        textAlign: col.align || 'left',
                        cursor: col.sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'
                        }}
                      >
                        <span>{col.label}</span>
                        {col.sortable && (
                          <span style={{ color: sortKey === col.key ? 'var(--accent)' : 'var(--text-dim)' }}>
                            {sortKey === col.key ? (
                              sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{
                      borderBottom: idx === filteredData.length - 1 ? 'none' : '1px solid var(--glass-border)',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background var(--transition-fast)'
                    }}
                    className="table-row-hover"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: '14px 16px',
                          textAlign: col.align || 'left',
                          color: 'var(--text-primary)',
                          verticalAlign: 'middle'
                        }}
                      >
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-cards-container" style={{ display: 'none', flexDirection: 'column', gap: '10px' }}>
            {filteredData.map((row) => (
              <div key={keyExtractor(row)} onClick={() => onRowClick && onRowClick(row)}>
                {renderMobileCard ? (
                  renderMobileCard(row)
                ) : (
                  <div className="glass-card">
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom: '1px solid var(--glass-border-subtle)'
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          {col.label}
                        </span>
                        <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', textAlign: 'right' }}>
                          {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Table Row count footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-dim)',
              padding: '0 4px'
            }}
          >
            <span>Showing {filteredData.length} records</span>
            {searchTerm && <span>Filtered from {data.length} total</span>}
          </div>
        </>
      )}

      <style>{`
        .table-row-hover:hover {
          background-color: var(--glass-bg-hover);
        }
        @media (max-width: 768px) {
          .desktop-table-container {
            display: none !important;
          }
          .mobile-cards-container {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
