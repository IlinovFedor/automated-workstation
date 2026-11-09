import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { categoryStyle } from '@/lib/format';
import type { Entity, TableType, TeacherLocationAssignment } from '@/types';

export const scheduleHref = (table: TableType, id: number) => `/timetable/${table}/${id}`;

/** Ссылки внутри карточки не должны открывать шторку карточки. */
const stop = (e: MouseEvent) => e.stopPropagation();

export function CategoryTag({ category }: { category: string }) {
  return <span className="lesson-tag">{categoryStyle(category).label}</span>;
}

/**
 * Строки «преподаватель — аудитория»: аудитории столбцом справа, чтобы найти своего преподавателя.
 * linked — ссылки на расписания; в ленте выключены, чтобы не промахиваться мимо карточки.
 */
export function AssignmentList({ items, linked = true }: { items: TeacherLocationAssignment[]; linked?: boolean }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-col gap-0.5 text-[13px] leading-snug">
      {items.map((a, i) => (
        <li key={`${a.teacher.id}-${a.location.id}-${i}`} className="flex items-baseline gap-3">
          <MaybeLink
            to={linked ? scheduleHref('teachers', a.teacher.id) : null}
            className="min-w-0 flex-1 text-muted [overflow-wrap:anywhere]"
            linkClassName="link-underline hover:text-link"
          >
            {a.teacher.name}
          </MaybeLink>
          <MaybeLink
            to={linked ? scheduleHref('locations', a.location.id) : null}
            className={`max-w-[55%] shrink-0 text-right [overflow-wrap:anywhere] ${linked ? 'text-link' : 'text-ink'}`}
            linkClassName="link-underline"
          >
            {a.location.name}
          </MaybeLink>
        </li>
      ))}
    </ul>
  );
}

export function SubgroupChips({ items, linked = true }: { items: Entity[]; linked?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((s) => (
        <MaybeLink
          key={s.id}
          to={linked ? scheduleHref('subgroups', s.id) : null}
          className="chip"
          linkClassName="link-underline"
        >
          {s.name}
        </MaybeLink>
      ))}
    </div>
  );
}

function MaybeLink({
  to,
  className,
  linkClassName = '',
  children,
}: {
  to: string | null;
  className: string;
  linkClassName?: string;
  children: ReactNode;
}) {
  if (!to) return <span className={className}>{children}</span>;
  return (
    <Link to={to} onClick={stop} className={`${className} ${linkClassName}`}>
      {children}
    </Link>
  );
}
