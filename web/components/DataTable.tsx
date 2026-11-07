'use client';
import React, { useState } from 'react';
import { tokens } from '../theme/tokens';

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
}

interface DataTableProps {
  columns: TableColumn[];
  rows: Record<string, string>[];
  onRowClick: (row: Record<string, string>) => void;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable({ columns, rows, onRowClick }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (col: TableColumn) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
  };

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = av.localeCompare(bv);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                data-testid={`col-header-${col.key}`}
                data-sortable={String(col.sortable)}
                onClick={() => handleSort(col)}
                style={{
                  ...thStyle,
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr
              key={ri}
              onClick={() => onRowClick(row)}
              style={trStyle}
            >
              {columns.map((col) => (
                <td key={col.key} data-testid={`cell-${col.key}`} style={tdStyle}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: tokens.font.family,
  fontSize: tokens.font.body.size,
  color: tokens.color.text,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: `${tokens.space[1]}px ${tokens.space[2]}px`,
  borderBottom: `2px solid ${tokens.color.border}`,
  fontSize: tokens.font.labelSmall.size,
  fontWeight: tokens.font.labelSmall.weight,
  color: tokens.color.textMuted,
};

const trStyle: React.CSSProperties = {
  cursor: 'pointer',
  borderBottom: `1px solid ${tokens.color.border}`,
};

const tdStyle: React.CSSProperties = {
  padding: `${tokens.space[1]}px ${tokens.space[2]}px`,
  minHeight: tokens.size.row.single,
};
