import { categoryVars, formatTime, visibleSubgroups } from '@/lib/format';
import type { Occurrence } from '@/lib/time';
import type { ScheduleContext } from '@/types';
import { AssignmentList, CategoryTag, SubgroupChips } from './LessonParts';

interface LessonCardProps {
  occ: Occurrence;
  ctx: ScheduleContext;
  onOpen: () => void;
}

/** Карточка ленты: видно всё; в расписании группы она сама не повторяется среди групп. */
export function LessonCard({ occ, ctx, onOpen }: LessonCardProps) {
  const { lesson } = occ;
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer gap-3 border-t border-line py-3 transition-colors hover:bg-panel/50"
      style={categoryVars(lesson.category)}
    >
      <div className="w-12 shrink-0 text-sm font-medium leading-tight tabular-nums">
        {formatTime(occ.start)}
        <div className="font-normal text-muted">{formatTime(occ.end)}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-l-[3px] border-[var(--c)] pl-3">
        <CategoryTag category={lesson.category} />
        <h3 className="text-[15px] font-bold leading-snug break-words hyphens-auto">{lesson.subject.name}</h3>
        <AssignmentList items={lesson.teacher_location_assignments} linked={false} />
        <SubgroupChips items={visibleSubgroups(lesson, ctx)} linked={false} />
      </div>
    </article>
  );
}
