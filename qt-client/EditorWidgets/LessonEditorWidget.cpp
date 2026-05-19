//
// Created by localuser on 5/19/26.
//

#include "LessonEditorWidget.h"

#include <QMessageBox>
#include <algorithm>

LessonEditorWidget::LessonEditorWidget(QWidget *parent, OpenAPI::OAIDefaultApi *new_api,
                                       const OpenAPI::OAILesson &new_lesson) : QWidget(parent) {
    api = new_api;
    lesson = new_lesson;

    root_layout = new QVBoxLayout(this);

    id_label = new QLabel(QString("ID: %1").arg(lesson.getId()), this);
    subject_combo = new SearchComboWidget(this, SearchMode::Subject);
    category_combo = new QComboBox(this);
    day_combo = new QComboBox(this);
    time_start_edit = new QTimeEdit(this);
    time_end_edit = new QTimeEdit(this);
    repeat_combo = new QComboBox(this);
    timetable_combo = new SearchComboWidget(this, SearchMode::Timetables);

    category_combo->addItem("Лекция", "(лек)");
    category_combo->addItem("Практика", "(пр)");
    category_combo->addItem("Лаб. занятие", "(лаб)");
    category_combo->addItem("КСР", "(кср)");

    for (int i = 1; i <= 7; i++) {
        day_combo->addItem(QString::number(i), i);
    }

    repeat_combo->addItem("Каждую неделю", 0);
    repeat_combo->addItem("нечет недели", 1);
    repeat_combo->addItem("чет недели", 2);

    time_start_edit->setDisplayFormat("HH:mm");
    time_end_edit->setDisplayFormat("HH:mm");

    auto subject_layout = new QHBoxLayout;
    subject_layout->addWidget(new QLabel("Предмет", this));
    subject_layout->addWidget(subject_combo);

    auto category_layout = new QHBoxLayout;
    category_layout->addWidget(new QLabel("Категория", this));
    category_layout->addWidget(category_combo);

    auto day_layout = new QHBoxLayout;
    day_layout->addWidget(new QLabel("День", this));
    day_layout->addWidget(day_combo);

    auto time_layout = new QHBoxLayout;
    time_layout->addWidget(new QLabel("Время", this));
    time_layout->addWidget(time_start_edit);
    time_layout->addWidget(time_end_edit);

    auto repeat_layout = new QHBoxLayout;
    repeat_layout->addWidget(new QLabel("Повтор", this));
    repeat_layout->addWidget(repeat_combo);

    auto timetable_layout = new QHBoxLayout;
    timetable_layout->addWidget(new QLabel("Расписание", this));
    timetable_layout->addWidget(timetable_combo);

    auto subgroups_scroll = new QScrollArea(this);
    subgroups_scroll->setWidgetResizable(true);
    subgroups_scroll->setMinimumHeight(120);
    subgroups_container = new QWidget(subgroups_scroll);
    subgroups_layout = new QVBoxLayout(subgroups_container);
    subgroups_scroll->setWidget(subgroups_container);
    subgroup_search_combo = new SearchComboWidget(this, SearchMode::Subgroup);
    subgroup_add_button = new QPushButton("Добавить группу", this);
    auto subgroup_controls = new QHBoxLayout;
    subgroup_controls->addWidget(subgroup_search_combo);
    subgroup_controls->addWidget(subgroup_add_button);

    auto assignments_scroll = new QScrollArea(this);
    assignments_scroll->setWidgetResizable(true);
    assignments_scroll->setMinimumHeight(120);
    assignments_container = new QWidget(assignments_scroll);
    assignments_layout = new QVBoxLayout(assignments_container);
    assignments_scroll->setWidget(assignments_container);
    assignment_add_button = new QPushButton("Добавить преподавателя", this);

    submit_button = new QPushButton("Сохранить", this);
    remove_button = new QPushButton("Удалить", this);

    root_layout->addWidget(id_label);
    root_layout->addLayout(subject_layout);
    root_layout->addLayout(category_layout);
    root_layout->addLayout(day_layout);
    root_layout->addLayout(time_layout);
    root_layout->addLayout(repeat_layout);
    root_layout->addLayout(timetable_layout);
    root_layout->addLayout(subgroup_controls);
    root_layout->addWidget(subgroups_scroll);
    root_layout->addWidget(assignment_add_button);
    root_layout->addWidget(assignments_scroll);

    auto button_layout = new QHBoxLayout;
    button_layout->addWidget(submit_button);
    button_layout->addWidget(remove_button);
    root_layout->addLayout(button_layout);

    setup_initial_state();
    setup_connections();
}

void LessonEditorWidget::setup_initial_state() {
    if (lesson.is_subject_Set()) {
        subject_combo->setCurrentItem(lesson.getSubject().getName(), lesson.getSubject().getId(),
                                      QVariant::fromValue(lesson.getSubject()));
    }
    if (lesson.is_timetable_Set()) {
        timetable_combo->setCurrentItem(lesson.getTimetable().getName(), lesson.getTimetable().getId(),
                                        QVariant::fromValue(lesson.getTimetable()));
    }

    int category_index = category_combo->findData(lesson.getCategory());
    if (category_index >= 0) {
        category_combo->setCurrentIndex(category_index);
    }

    int day_index = day_combo->findData(lesson.getDay());
    if (day_index >= 0) {
        day_combo->setCurrentIndex(day_index);
    }

    int repeat_index = repeat_combo->findData(lesson.getRepeatRule());
    if (repeat_index >= 0) {
        repeat_combo->setCurrentIndex(repeat_index);
    }

    time_start_edit->setTime(minutes_to_time(lesson.getTimeStart()));
    time_end_edit->setTime(minutes_to_time(lesson.getTimeEnd()));

    for (const auto &subgroup: lesson.getSubgroups()) {
        add_subgroup_row(subgroup);
    }

    for (const auto &assignment: lesson.getTeacherLocationAssignments()) {
        add_assignment_row(assignment);
    }
}

void LessonEditorWidget::setup_connections() {
    connect(category_combo, &QComboBox::currentIndexChanged, this, [this](int idx) {
        if (idx < 0) {
            return;
        }
        lesson.setCategory(category_combo->itemData(idx).toString());
    });

    connect(day_combo, &QComboBox::currentIndexChanged, this, [this](int idx) {
        if (idx < 0) {
            return;
        }
        lesson.setDay(day_combo->itemData(idx).toInt());
    });

    connect(repeat_combo, &QComboBox::currentIndexChanged, this, [this](int idx) {
        if (idx < 0) {
            return;
        }
        lesson.setRepeatRule(repeat_combo->itemData(idx).toInt());
    });

    connect(time_start_edit, &QTimeEdit::timeChanged, this, [this](const QTime &time) {
        lesson.setTimeStart(time_to_minutes(time));
    });

    connect(time_end_edit, &QTimeEdit::timeChanged, this, [this](const QTime &time) {
        lesson.setTimeEnd(time_to_minutes(time));
    });

    connect(subject_combo, &SearchComboWidget::itemSelected, this, [this](int id, const QString &name) {
        Q_UNUSED(id);
        Q_UNUSED(name);
        auto obj = subject_combo->currentObject();
        if (obj.isValid()) {
            lesson.setSubject(obj.value<OpenAPI::OAISubject>());
        }
    });

    connect(timetable_combo, &SearchComboWidget::itemSelected, this, [this](int id, const QString &name) {
        Q_UNUSED(id);
        Q_UNUSED(name);
        auto obj = timetable_combo->currentObject();
        if (obj.isValid()) {
            lesson.setTimetable(obj.value<OpenAPI::OAITimetable>());
        }
    });

    connect(subgroup_add_button, &QPushButton::clicked, this, [this]() {
        auto obj = subgroup_search_combo->currentObject();
        if (!obj.isValid()) {
            return;
        }
        auto subgroup = obj.value<OpenAPI::OAISubgroup>();
        auto subgroups = lesson.getSubgroups();
        for (const auto &existing: subgroups) {
            if (existing.getId() == subgroup.getId()) {
                return;
            }
        }
        add_subgroup_row(subgroup);
        subgroups.append(subgroup);
        lesson.setSubgroups(subgroups);
    });

    connect(assignment_add_button, &QPushButton::clicked, this, [this]() {
        OpenAPI::OAITeacherLocationAssignment assignment;
        add_assignment_row(assignment);
    });

    connect(submit_button, &QPushButton::clicked, this, [this]() {
        QList<OpenAPI::OAITeacherLocationAssignment> assignments;
        for (int i = 0; i < assignments_layout->count(); i++) {
            auto item = assignments_layout->itemAt(i);
            auto row = item ? item->widget() : nullptr;
            if (!row) {
                continue;
            }
            assignments.append(build_assignment_from_row(row));
        }
        lesson.setTeacherLocationAssignments(assignments);
        api->lessonsIdPatch(lesson.getId(), lesson);
        qDebug() << lesson.asJson();
    });

    connect(remove_button, &QPushButton::clicked, this, [this]() {
        auto reply = QMessageBox::question(
            this,
            "Подтверждение",
            "Удалить?",
            QMessageBox::Yes | QMessageBox::No
        );
        if (reply == QMessageBox::Yes) {
            api->lessonsIdDelete(lesson.getId());
        }
    });
}

QTime LessonEditorWidget::minutes_to_time(int minutes) {
    int h = minutes / 60;
    int m = minutes % 60;
    return QTime(h, m);
}

int LessonEditorWidget::time_to_minutes(const QTime &time) {
    return time.hour() * 60 + time.minute();
}

void LessonEditorWidget::add_subgroup_row(const OpenAPI::OAISubgroup &subgroup) {
    auto row = new QWidget(subgroups_container);
    auto layout = new QHBoxLayout(row);
    layout->setContentsMargins(0, 0, 0, 0);

    auto label = new QLabel(subgroup.getName(), row);
    auto remove = new QPushButton("Удалить", row);

    layout->addWidget(label);
    layout->addWidget(remove);

    subgroups_layout->addWidget(row);

    connect(remove, &QPushButton::clicked, this, [this, row, subgroup]() {
        auto subgroups = lesson.getSubgroups();
        for (int i = 0; i < subgroups.size(); i++) {
            if (subgroups[i].getId() == subgroup.getId()) {
                subgroups.removeAt(i);
                break;
            }
        }
        lesson.setSubgroups(subgroups);
        row->deleteLater();
    });
}

void LessonEditorWidget::add_assignment_row(const OpenAPI::OAITeacherLocationAssignment &assignment) {
    auto row = new QWidget(assignments_container);
    auto layout = new QHBoxLayout(row);
    layout->setContentsMargins(0, 0, 0, 0);

    auto teacher_combo = new SearchComboWidget(row, SearchMode::Teacher);
    auto location_combo = new SearchComboWidget(row, SearchMode::Location);
    auto remove = new QPushButton("Удалить", row);

    layout->addWidget(teacher_combo);
    layout->addWidget(location_combo);
    layout->addWidget(remove);

    assignments_layout->addWidget(row);

    if (assignment.is_teacher_Set()) {
        teacher_combo->setCurrentItem(assignment.getTeacher().getName(), assignment.getTeacher().getId(),
                                      QVariant::fromValue(assignment.getTeacher()));
    }
    if (assignment.is_location_Set()) {
        location_combo->setCurrentItem(assignment.getLocation().getName(), assignment.getLocation().getId(),
                                       QVariant::fromValue(assignment.getLocation()));
    }

    connect(remove, &QPushButton::clicked, this, [this, row]() {
        row->deleteLater();
    });
}

OpenAPI::OAITeacherLocationAssignment LessonEditorWidget::build_assignment_from_row(QWidget *row) const {
    auto combos = row->findChildren<SearchComboWidget *>();
    std::sort(combos.begin(), combos.end(), [](const SearchComboWidget *a, const SearchComboWidget *b) {
        return a->geometry().x() < b->geometry().x();
    });
    OpenAPI::OAITeacherLocationAssignment assignment;
    if (combos.size() >= 2) {
        auto teacher_obj = combos[0]->currentObject();
        auto location_obj = combos[1]->currentObject();
        if (teacher_obj.isValid()) {
            assignment.setTeacher(teacher_obj.value<OpenAPI::OAITeacher>());
        }
        if (location_obj.isValid()) {
            assignment.setLocation(location_obj.value<OpenAPI::OAILocation>());
        }
    }
    qDebug() << "row=" << row << "combos count=" << combos.size();
    for (auto c : combos) {
        qDebug() << "  combo parent=" << c->parent() << "x=" << c->geometry().x();
    }
    return assignment;
}
