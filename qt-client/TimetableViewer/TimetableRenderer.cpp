//
// Created by localuser on 5/18/26.
//

#include "TimetableRenderer.h"
#include "../api/BasePath.h"
#include <QCalendarWidget>
#include <QLineEdit>
#include <QMenu>
#include <QUrl>
#include <QVBoxLayout>
#include <QWidgetAction>
#include <QCompleter>
#include <QDialog>
#include "../../ErrorWidget.h"

TimetableRenderer::TimetableRenderer(QWidget *parent, OpenAPI::OAIDefaultApi *new_api) : QWidget(parent) {
    api = new OpenAPI::OAIDefaultApi();
    api->setParent(this);
    api->setNewServerForAllOperations(basePath);
    api->addHeaders("Cookie", "apiKey=" + apiKey);

    qRegisterMetaType<SearchMode>();

    root_layout = new QVBoxLayout(this);
    toolbar_layout = new QHBoxLayout;
    toolbar_layout->setContentsMargins(0, 0, 0, 0);
    toolbar_layout->setSpacing(8);

    search_combo = new SearchComboWidget(this, SearchMode::Subgroup);

    table_combo = new QComboBox(this);
    table_combo->addItem("Группы", QVariant::fromValue(SearchMode::Subgroup));
    table_combo->addItem("Преподаватели", QVariant::fromValue(SearchMode::Teacher));
    table_combo->addItem("Аудитории", QVariant::fromValue(SearchMode::Location));
    table_combo->addItem("Предметы", QVariant::fromValue(SearchMode::Subject));

    prev_week_button = new QPushButton("<", this);
    next_week_button = new QPushButton(">", this);
    today_button = new QPushButton("Сегодня", this);
    calendar_button = new QPushButton("Календарь", this);
    ics_export_button = new QPushButton("Экспорт ICS", this);
    new_lesson_button = new QPushButton("+", this);

    toolbar_layout->addWidget(table_combo);
    toolbar_layout->addWidget(search_combo);
    toolbar_layout->addWidget(prev_week_button);
    toolbar_layout->addWidget(next_week_button);
    toolbar_layout->addWidget(today_button);
    toolbar_layout->addWidget(calendar_button);
    toolbar_layout->addWidget(ics_export_button);
    toolbar_layout->addWidget(new_lesson_button);

    painter = new TimetablePainter(this, true);

    root_layout->addLayout(toolbar_layout);
    root_layout->addWidget(painter);

    current_date = QDate::currentDate();
    search_mode = SearchMode::Subgroup;

    clipboard = QApplication::clipboard();

    setup_connections();
}

void TimetableRenderer::setSearchMode(SearchMode mode) {
    search_mode = mode;
    search_combo->setMode(mode);
    raw_lessons.clear();
    update_painter();
}

void TimetableRenderer::setup_connections() {
    connect(prev_week_button, &QPushButton::clicked, this, [this]() { shift_week(-1); });
    connect(next_week_button, &QPushButton::clicked, this, [this]() { shift_week(1); });
    connect(today_button, &QPushButton::clicked, this, [this]() {
        current_date = QDate::currentDate();
        painter->set_selected_date(current_date);
        update_painter();
    });

    connect(table_combo, &QComboBox::activated, this, [this]() {
        SearchMode mode = table_combo->currentData().value<SearchMode>();
        setSearchMode(mode);
    });

    connect(search_combo, &SearchComboWidget::itemSelected, this, &TimetableRenderer::get_lessons);

    connect(api, &OpenAPI::OAIDefaultApi::lessonsTableIdGetSignal, this, [this](QList<OpenAPI::OAILesson> summary) {
        raw_lessons = summary;
        update_painter();
    });

    connect(painter, &TimetablePainter::lessonClicked, this, [this](const OpenAPI::OAILesson &lesson) {
        auto lesson_api = new OpenAPI::OAIDefaultApi();
        lesson_api->setParent(this);
        lesson_api->setNewServerForAllOperations(basePath);
        lesson_api->addHeaders("Cookie", "apiKey=" + apiKey);

        QDialog dialog(this);
        dialog.setWindowTitle("Редактирование урока");
        auto layout = new QVBoxLayout(&dialog);
        auto editor = new LessonEditorWidget(&dialog, lesson_api, lesson);

        connect(editor, &LessonEditorWidget::LessonDataEditedSignal, this,
                [this, &lesson, &lesson_api](OpenAPI::OAILesson new_lesson_data) {
                    lesson_api->lessonsIdPatch(new_lesson_data.getId(), new_lesson_data);
                });
        connect(lesson_api, &OpenAPI::OAIDefaultApi::lessonsIdPatchSignal, this,
                [this](OpenAPI::OAILesson new_lesson_data) {
                    for (int i = 0; i < raw_lessons.size(); i++)
                        if (raw_lessons[i].getId() == new_lesson_data.getId())
                            raw_lessons[i] = new_lesson_data;
                    update_painter();
                });
        connect(lesson_api, &OpenAPI::OAIDefaultApi::lessonsIdPatchSignalErrorFull, this,
                [this](OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3) {
                    ErrorWidget(_t1, _t2, _t3, this);
                });

        connect(editor, &LessonEditorWidget::LessonDeleteSignal, this,
                [this, &lesson, &lesson_api](OpenAPI::OAILesson new_lesson_data) {
                    lesson_api->lessonsIdDelete(new_lesson_data.getId());
                });

        connect(lesson_api, &OpenAPI::OAIDefaultApi::lessonsIdDeleteSignal, this,
                [this, lesson]() {
                    for (int i = 0; i < raw_lessons.size(); i++)
                        if (raw_lessons[i].getId() == lesson.getId())
                            raw_lessons.remove(i);
                    update_painter();
                });
        connect(lesson_api, &OpenAPI::OAIDefaultApi::lessonsIdDeleteSignalErrorFull, this,
                [this](OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3) {
                    ErrorWidget(_t1, _t2, _t3, this);
                });
        layout->addWidget(editor);
        dialog.exec();
    });

    auto calendar_menu = new QMenu(this);
    auto calendar = new QCalendarWidget(calendar_menu);
    auto *calendar_action = new QWidgetAction(calendar_menu);
    calendar_action->setDefaultWidget(calendar);
    calendar_menu->addAction(calendar_action);

    connect(calendar, &QCalendarWidget::clicked, this, [this, calendar_menu](const QDate &date) {
        current_date = date;
        painter->set_selected_date(current_date);
        update_painter();
        calendar_menu->hide();
    });

    connect(calendar_button, &QPushButton::clicked, this, [this, calendar_menu]() {
        calendar_menu->exec(calendar_button->mapToGlobal(QPoint(0, calendar_button->height())));
    });

    connect(ics_export_button, &QPushButton::clicked, this, [this]() {
        clipboard->setText(ics_url);
    });

    connect(new_lesson_button, &QPushButton::clicked, this, [this]() {
        auto lesson_api = new OpenAPI::OAIDefaultApi();
        lesson_api->setParent(this);
        lesson_api->setNewServerForAllOperations(basePath);
        lesson_api->addHeaders("Cookie", "apiKey=" + apiKey);

        OpenAPI::OAILesson lesson;
        lesson.setCategory("(лек)");
        lesson.setDay(1);
        lesson.setRepeatRule(0);
        if (raw_lessons.size() != 0)
            lesson.setTimetable(raw_lessons[0].getTimetable());
        lesson.setTimeStart(480);
        lesson.setTimeEnd(570);
        OpenAPI::OAISubgroup subgroup;
        subgroup.setId(search_combo->currentId());
        subgroup.setName(search_combo->currentName());
        auto tmp = lesson.getSubgroups();
        if (subgroup.getId() > 0)
            tmp.push_back(subgroup);
        lesson.setSubgroups(tmp);

        QDialog dialog(this);
        dialog.setWindowTitle("Создание");
        auto layout = new QVBoxLayout(&dialog);
        auto editor = new LessonEditorWidget(&dialog, lesson_api, lesson);
        connect(editor, &LessonEditorWidget::LessonDataEditedSignal, this,
                [this, &lesson, &lesson_api](OpenAPI::OAILesson new_lesson_data) {
                    new_lesson_data.setId("00000000-0000-0000-0000-000000000000");
                    lesson_api->lessonsPost(new_lesson_data);
                });
        connect(lesson_api, &OpenAPI::OAIDefaultApi::lessonsPostSignal, this,
                [this](OpenAPI::OAILesson recieved_lesson) {
                    raw_lessons.push_back(recieved_lesson);
                    update_painter();
                });
        connect(lesson_api, &OpenAPI::OAIDefaultApi::lessonsPostSignalErrorFull, this,
                [this](OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3) {
                    ErrorWidget(_t1, _t2, _t3, this);
                });

        layout->addWidget(editor);
        dialog.exec();
    });
}

void TimetableRenderer::update_painter() {
    if (raw_lessons.isEmpty()) {
        painter->set_lessons({});
        painter->set_week_date(current_date);
        return;
    }

    QList<OpenAPI::OAILesson> filtered;
    const bool is_even = is_week_even(current_date);

    for (const auto &lesson: raw_lessons) {
        auto date_time = QDateTime(current_date, QTime(0, 0));
        if (lesson.getTimetable().getDateStart() <= date_time && date_time <= lesson.getTimetable().getDateEnd()) {
            const int rule = lesson.getRepeatRule();
            if (rule == 1 && is_even)
                continue;
            if (rule == 2 && !is_even)
                continue;
            filtered.append(lesson);
        }
    }

    painter->set_week_date(current_date);
    painter->set_lessons(filtered);
}

void TimetableRenderer::shift_week(int weeks) {
    current_date = current_date.addDays(weeks * 7);
    update_painter();
}

bool TimetableRenderer::is_week_even(const QDate &date) const {
    const int year = date.month() >= 9 ? date.year() : date.year() - 1;
    const QDate start(year, 9, 1);
    const int days = start.daysTo(date);
    const int week_index = days >= 0 ? days / 7 : 0;
    const bool first_week_is_even = false;
    return first_week_is_even ? (week_index % 2 == 0) : (week_index % 2 == 1);
}

void TimetableRenderer::get_lessons(int id, const QString &name) {
    Q_UNUSED(name);
    QString table_name;
    switch (search_mode) {
        case SearchMode::Location:
            api->lessonsTableIdGet(id, locations_table);
            table_name = locations_table;
            break;
        case SearchMode::Subgroup:
            api->lessonsTableIdGet(id, subgroups_table);
            table_name = subgroups_table;
            break;
        case SearchMode::Teacher:
            api->lessonsTableIdGet(id, teachers_table);
            table_name = teachers_table;
            break;
        case SearchMode::Subject:
            api->lessonsTableIdGet(id, subjects_table);
            table_name = subjects_table;
            break;
    }
    ics_url = basePath + "/lessons/" + table_name + "/" + QString::number(id) + "?format=ics";
    painter->set_selected_date(current_date);
}
