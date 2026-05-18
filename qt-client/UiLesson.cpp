//
// Created by localuser on 5/18/26.
//

#include "UiLesson.h"

#include "TimetablePainter.h"
#include <QFile>
#include <QFontMetrics>
#include <QResizeEvent>

QString UiLesson::minutes_to_time(int minutes) {
    return QString("%1:%2")
            .arg(minutes / 60, 2, 10, QChar('0'))
            .arg(minutes % 60, 2, 10, QChar('0'));
}

QString UiLesson::elide_two_lines(const QString &text, const QFont &font, int width, int max_lines) const {
    if (width <= 0 || text.isEmpty())
        return text;

    QFontMetrics metrics(font);
    const QStringList words = text.split(' ', Qt::SkipEmptyParts);
    QStringList lines;
    QString current_line;

    for (const QString &word : words) {
        QString candidate = current_line.isEmpty() ? word : current_line + " " + word;
        if (metrics.horizontalAdvance(candidate) <= width) {
            current_line = candidate;
        } else {
            if (!current_line.isEmpty())
                lines.push_back(current_line);
            current_line = word;
            if (lines.size() >= max_lines)
                break;
        }
    }

    if (!current_line.isEmpty() && lines.size() < max_lines)
        lines.push_back(current_line);

    if (lines.size() > max_lines)
        lines = lines.mid(0, max_lines);

    if (lines.size() == max_lines) {
        const QString last_line = lines.last();
        lines[lines.size() - 1] = metrics.elidedText(last_line, Qt::ElideRight, width);
    }

    return lines.join('\n');
}

void UiLesson::update_elided_texts() {
    if (label_full_texts.isEmpty())
        return;

    for (auto it = label_full_texts.begin(); it != label_full_texts.end(); ++it) {
        QLabel *label = it.key();
        if (!label)
            continue;
        const QString &full_text = it.value();
        const int available_width = label->contentsRect().width();
        const QString elided = elide_two_lines(full_text, label->font(), available_width, 2);
        label->setText(elided);
    }
}

void UiLesson::resizeEvent(QResizeEvent *event) {
    QWidget::resizeEvent(event);
    update_elided_texts();
}

UiLesson::UiLesson(const OpenAPI::OAILesson &new_lesson) {
    lesson = new_lesson;

    setObjectName("ui_lesson");
    setProperty("lessonCategory", lesson.getCategory());
    setAttribute(Qt::WA_StyledBackground, true);

    QFile style_file(":/styles/ui_lesson.qss");
    if (style_file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        setStyleSheet(style_file.readAll());
    }

    vertical_layout = new QVBoxLayout(this);
    vertical_layout->setContentsMargins(10, 9, 5, 4);
    vertical_layout->setAlignment(Qt::AlignTop);

    auto configure_label = [&](QLabel *label) {
        label->setWordWrap(true);
        label->setAlignment(Qt::AlignLeft | Qt::AlignTop);
        QFontMetrics metrics(label->font());
        label->setMaximumHeight(metrics.lineSpacing() * 2);
        label->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
        label->setMinimumWidth(0);
    };

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
        teacher_layout->setContentsMargins(0, 0, 0, 0);
        teacher_layout->setSpacing(6);
        auto teacher = new QLabel(teacher_location_assignment.getTeacher().getName(), this);
        auto location = new QLabel(teacher_location_assignment.getLocation().getName(), this);
        teacher->setObjectName("lesson_teacher");
        location->setObjectName("lesson_location");
        teacher_location_assignments.push_back({teacher, location});
        configure_label(teacher);
        configure_label(location);
        teacher_layout->setStretch(0, 1);
        teacher_layout->setStretch(1, 1);
        teacher_layout->addWidget(teacher);
        teacher_layout->addWidget(location);
        vertical_layout->addItem(teacher_layout);
    }

    vertical_layout->addWidget(line_subgroups);

    configure_label(line_time);
    configure_label(line_subject);
    configure_label(line_subgroups);

    label_full_texts.insert(line_time, line_time->text());
    label_full_texts.insert(line_subject, line_subject->text());
    label_full_texts.insert(line_subgroups, line_subgroups->text());
    for (const auto &pair : teacher_location_assignments) {
        label_full_texts.insert(pair.first, pair.first->text());
        label_full_texts.insert(pair.second, pair.second->text());
    }

    update_elided_texts();
}
