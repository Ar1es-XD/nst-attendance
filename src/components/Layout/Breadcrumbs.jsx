import React from 'react';
import { ChevronRight, Home, Layers, Calendar, HelpCircle } from 'lucide-react';

export default function Breadcrumbs({
  activeTab,
  semesterTitle,
  onTabChange,
  is404 = false
}) {
  const items = [
    { label: 'Home', icon: Home, onClick: () => onTabChange('workbook'), href: '#home' }
  ];

  if (is404) {
    items.push({ label: 'Error 404 (Not Found)', icon: HelpCircle, isCurrent: true });
  } else if (activeTab === 'attendance-log') {
    items.push({ label: semesterTitle || 'Current Semester', icon: Layers, onClick: () => onTabChange('workbook'), href: '#workbook' });
    items.push({ label: 'Class Attendance Ledger', icon: Calendar, isCurrent: true, href: '#attendance-log' });
  } else {
    items.push({ label: semesterTitle || 'Current Semester', icon: Layers, isCurrent: true, href: '#workbook' });
  }

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs-bar">
      <ol className="breadcrumbs-list" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;
          return (
            <li
              key={item.label}
              className={`breadcrumb-item ${item.isCurrent ? 'active' : ''}`}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {Icon && <Icon size={12} className="breadcrumb-icon" />}
              {item.isCurrent ? (
                <span itemProp="name" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || '#'}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  itemProp="item"
                >
                  <span itemProp="name">{item.label}</span>
                </a>
              )}
              <meta itemProp="position" content={String(index + 1)} />
              {!isLast && <ChevronRight size={12} className="breadcrumb-separator" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
