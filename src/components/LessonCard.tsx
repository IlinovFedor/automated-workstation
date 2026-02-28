import { Link } from 'react-router-dom';
import type { Lesson, CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import { formatTimeRange } from '@/utils/date';

interface LessonCardProps {
  lesson: Lesson;
  showDate?: boolean;
  date?: Date;
}

const categoryColors: typeof CATEGORY_COLORS = {
  '(лек)': 'bg-blue-500',
  '(пр)': 'bg-green-500',
  '(лаб)': 'bg-orange-500',
  '(кср)': 'bg-purple-500',
};

const categoryLabels: typeof CATEGORY_LABELS = {
  '(лек)': 'Лекция',
  '(пр)': 'Практика',
  '(лаб)': 'Лабораторная',
  '(кср)': 'КСР',
};

export function LessonCard({ lesson, date }: LessonCardProps) {
  const categoryColor = categoryColors[lesson.category] || 'bg-gray-500';
  const categoryLabel = categoryLabels[lesson.category] || lesson.category;

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      state={{ date }}
      className="block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors"
    >
      <div className="flex">
        <div className={`${categoryColor} w-1.5 shrink-0`} />
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColor} text-white`}>
                {categoryLabel}
              </span>
              <span className="text-sm text-gray-500">
                {formatTimeRange(lesson.time_start, lesson.time_end)}
              </span>
            </div>
          </div>
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {lesson.subject.name}
          </h3>
          <div className="space-y-1">
            {lesson.teacher_location_assignments.map((assignment, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="truncate flex-1">{assignment.teacher.name}</span>
                <span className="text-gray-400">—</span>
                <Link
                  to={`/timetable/locations/${assignment.location.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:underline shrink-0"
                >
                  {assignment.location.name}
                </Link>
              </div>
            ))}
          </div>
          {lesson.subgroups.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {lesson.subgroups.map((subgroup) => (
                <Link
                  key={subgroup.id}
                  to={`/timetable/subgroups/${subgroup.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                >
                  {subgroup.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
