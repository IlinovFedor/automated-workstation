//
// Created by localuser on 5/18/26.
//

#include "UiLesson.h"

#include "TimetableViewer/TimetablePainter.h"
#include <QFile>
#include <QFontMetrics>
#include <QResizeEvent>

QString UiLesson::minutes_to_time(int minutes) {
    return QString("%1:%2")
            .arg(minutes / 60, 2, 10, QChar('0'))
            .arg(minutes % 60, 2, 10, QChar('0'));
}

UiLesson::UiLesson(const OpenAPI::OAILesson &new_lesson) {
    lesson = new_lesson;

    setObjectName("ui_lesson");
    setProperty("lessonCategory", lesson.getCategory());
    setAttribute(Qt::WA_StyledBackground, true);

    QFile style_file(":/styles/ui_lesson.qss");
    if (style_file.open(QIODevice::ReadOnly | QIODevice::Text))
        setStyleSheet(style_file.readAll());

    vertical_layout = new QVBoxLayout(this);

    line_time = new QLabel(
        minutes_to_time(lesson.getTimeStart()) + " - " + minutes_to_time(lesson.getTimeEnd()) + " " + lesson.
        getCategory(), this);
    line_time->setObjectName("lesson_time");

    line_subject = new QLabel(lesson.getSubject().getName(), this);
    line_subject->setObjectName("lesson_subject");

    line_subgroups = new QLabel(this);
    line_subgroups->setObjectName("lesson_subgroups");

    for (auto subgroup: lesson.getSubgroups())
        line_subgroups->setText(line_subgroups->text() + subgroup.getName() + ' ');

    vertical_layout->addWidget(line_time);
    vertical_layout->addWidget(line_subject);

    for (auto teacher_location_assignment: lesson.getTeacherLocationAssignments()) {
        auto teacher_layout = new QHBoxLayout;
        auto teacher = new QLabel(teacher_location_assignment.getTeacher().getName(), this);
        auto location = new QLabel(teacher_location_assignment.getLocation().getName(), this);
        teacher->setObjectName("lesson_teacher");
        location->setObjectName("lesson_location");
        teacher_location_assignments.push_back({teacher, location});
        teacher_layout->addWidget(teacher);
        teacher_layout->addWidget(location);
        vertical_layout->addItem(teacher_layout);

        teacher->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
        location->setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Preferred);  // аудитория — фиксированная
    }

    vertical_layout->addWidget(line_subgroups);

    label_full_texts.insert(line_time, line_time->text());
    label_full_texts.insert(line_subject, line_subject->text());
    label_full_texts.insert(line_subgroups, line_subgroups->text());
    for (const auto &pair: teacher_location_assignments) {
        label_full_texts.insert(pair.first, pair.first->text());
        label_full_texts.insert(pair.second, pair.second->text());
    }
    line_time->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    line_subject->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    line_subgroups->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);

}