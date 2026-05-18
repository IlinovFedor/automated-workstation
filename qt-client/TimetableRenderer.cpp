//
// Created by localuser on 5/18/26.
//

#include "TimetableRenderer.h"

#include <QCalendarWidget>
#include <QLineEdit>
#include <QMenu>
#include <QUrl>
#include <QVBoxLayout>
#include <QWidgetAction>
#include <QCompleter>

const QString basePath = "http://localhost:8466";

TimetableRenderer::TimetableRenderer(QWidget *parent) : QWidget(parent) {
    qRegisterMetaType<SearchMode>();

    root_layout = new QVBoxLayout(this);
    toolbar_layout = new QHBoxLayout;
    toolbar_layout->setContentsMargins(0, 0, 0, 0);
    toolbar_layout->setSpacing(8);

    search_combo = new QComboBox(this);
    search_combo->setEditable(true);
    search_combo->setInsertPolicy(QComboBox::NoInsert);
    search_combo->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
    search_combo->setCompleter(nullptr);

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

    toolbar_layout->addWidget(table_combo);
    toolbar_layout->addWidget(search_combo);
    toolbar_layout->addWidget(prev_week_button);
    toolbar_layout->addWidget(next_week_button);
    toolbar_layout->addWidget(today_button);
    toolbar_layout->addWidget(calendar_button);
    toolbar_layout->addWidget(ics_export_button);

    painter = new TimetablePainter(this, true);

    root_layout->addLayout(toolbar_layout);
    root_layout->addWidget(painter);

    api = new OpenAPI::OAIDefaultApi;
    current_date = QDate::currentDate();
    search_mode = SearchMode::Subgroup;

    api->setParent(this);
    api->setNewServerForAllOperations(QUrl(basePath));

    search_timer = new QTimer(this);
    search_timer->setSingleShot(true);
    search_timer->setInterval(500);

    clipboard = QApplication::clipboard();

    setup_connections();
}

void TimetableRenderer::setSearchMode(SearchMode mode) {
    search_mode = mode;
    search_combo->clear();
    search_combo->setEditText(QString());
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

    connect(search_combo, &QComboBox::editTextChanged, this, [this](const QString &search) {
        search_timer->start();
    });

    connect(search_timer, &QTimer::timeout, this, &TimetableRenderer::combobox_request);

    connect(search_combo, &QComboBox::activated, this, &TimetableRenderer::get_lessons);

    connect(api, &OpenAPI::OAIDefaultApi::subgroupsGetSignal, this, &TimetableRenderer::add_subgroups_to_combo);
    connect(api, &OpenAPI::OAIDefaultApi::teachersGetSignal, this, &TimetableRenderer::add_teachers_to_combo);
    connect(api, &OpenAPI::OAIDefaultApi::locationsGetSignal, this, &TimetableRenderer::add_locations_to_combo);
    connect(api, &OpenAPI::OAIDefaultApi::subjectsGetSignal, this, &TimetableRenderer::add_subjects_to_combo);

    connect(api, &OpenAPI::OAIDefaultApi::lessonsTableIdGetSignal, this, [this](QList<OpenAPI::OAILesson> summary) {
        raw_lessons = summary;
        update_painter();
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
}

void TimetableRenderer::request_search(const QString &text) {
    if (text.isEmpty())
        return;
    switch (search_mode) {
        case SearchMode::Subgroup:
            api->subgroupsGet(OpenAPI::OptionalParam<qint32>(), OpenAPI::OptionalParam<qint32>(),
                              OpenAPI::OptionalParam<QString>(text));
            break;
        case SearchMode::Teacher:
            api->teachersGet(OpenAPI::OptionalParam<qint32>(), OpenAPI::OptionalParam<qint32>(),
                             OpenAPI::OptionalParam<QString>(text));
            break;
        case SearchMode::Subject:
            api->subjectsGet(OpenAPI::OptionalParam<qint32>(), OpenAPI::OptionalParam<qint32>(),
                             OpenAPI::OptionalParam<QString>(text));
            break;
        case SearchMode::Location:
            api->locationsGet(OpenAPI::OptionalParam<qint32>(), OpenAPI::OptionalParam<qint32>(),
                              OpenAPI::OptionalParam<QString>(text));
            break;
    }
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

void TimetableRenderer::combobox_request() {
    QString search = search_combo->currentText();
    switch (search_mode) {
        case SearchMode::Location: api->locationsGet(20, 0, search);
            break;
        case SearchMode::Subgroup: api->subgroupsGet(20, 0, search);
            break;
        case SearchMode::Teacher: api->teachersGet(20, 0, search);
            break;
        case SearchMode::Subject: api->subjectsGet(20, 0, search);
            break;
    }
}

void TimetableRenderer::get_lessons(int i) {
    auto id = this->search_combo->itemData(i).toInt();
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
    ics_url = basePath + "/lessons/" + table_name + "/"  + QString::number(id) + "?format=ics";
    painter->set_selected_date(current_date);
}

void TimetableRenderer::add_subgroups_to_combo(OpenAPI::OAIListSubgroups summary) {
    auto search = search_combo->currentText();
    search_combo->blockSignals(true);
    search_combo->clear();
    for (auto subgroup: summary.getSubgroups())
        search_combo->addItem(subgroup.getName(), subgroup.getId());
    search_combo->setCurrentText(search);
    search_combo->blockSignals(false);
    search_combo->showPopup();
}

void TimetableRenderer::add_teachers_to_combo(OpenAPI::OAIListTeachers summary) {
    auto search = search_combo->currentText();
    search_combo->blockSignals(true);
    search_combo->clear();
    for (auto subgroup: summary.getTeachers())
        search_combo->addItem(subgroup.getName(), subgroup.getId());
    search_combo->setCurrentText(search);
    search_combo->blockSignals(false);
    search_combo->showPopup();
}

void TimetableRenderer::add_subjects_to_combo(OpenAPI::OAIListSubjects summary) {
    auto search = search_combo->currentText();
    search_combo->blockSignals(true);
    search_combo->clear();
    for (auto subgroup: summary.getSubjects())
        search_combo->addItem(subgroup.getName(), subgroup.getId());
    search_combo->setCurrentText(search);
    search_combo->blockSignals(false);
    search_combo->showPopup();
}

void TimetableRenderer::add_locations_to_combo(OpenAPI::OAIListLocations summary) {
    auto search = search_combo->currentText();
    search_combo->blockSignals(true);
    search_combo->clear();
    for (auto subgroup: summary.getLocations())
        search_combo->addItem(subgroup.getName(), subgroup.getId());
    search_combo->setCurrentText(search);
    search_combo->blockSignals(false);
    search_combo->showPopup();
}
