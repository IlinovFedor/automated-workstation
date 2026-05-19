//
// Created by localuser on 5/18/26.
//

#include "PaginationWidget.h"

#include <QLabel>

#include "EditorWidgets/LocationsEditorWidget.h"
#include "EditorWidgets/SubgroupEditorWidget.h"
#include "EditorWidgets/SubjectsEditorWidget.h"
#include "EditorWidgets/TeachersEditorWidget.h"
#include "EditorWidgets/TimetablesEditorWidget.h"

void PaginationWidget::setup_connections() {
    connect(search_line_edit, &QLineEdit::returnPressed, this, [this]() {
        page = 1;
        get_data();
    });

    connect(page_combo, &QComboBox::currentIndexChanged, this, [this](int idx) {
        if (idx < 0) return;
        page = idx + 1;
        get_data();
    });
    connect(prev_page_button, &QPushButton::clicked, this, [this]() {
        page--;
        get_data();
    });
    connect(next_page_button, &QPushButton::clicked, this, [this]() {
        page++;
        get_data();
    });

    connect(new_item_button, &QPushButton::clicked, this, &PaginationWidget::create_new_item);

    connect(api, &OpenAPI::OAIDefaultApi::subgroupsGetSignal, this, &PaginationWidget::show_subgroups);
    connect(api, &OpenAPI::OAIDefaultApi::subgroupsPostSignal, this, [this](OpenAPI::OAISubgroup summary) {
        items_layout->addWidget(new SubgroupEditorWidget(this, api, summary));
    });

    connect(api, &OpenAPI::OAIDefaultApi::teachersGetSignal, this, &PaginationWidget::show_teachers);
    connect(api, &OpenAPI::OAIDefaultApi::teachersPostSignal, this, [this](OpenAPI::OAITeacher summary) {
        items_layout->addWidget(new TeachersEditorWidget(this, api, summary));
    });

    connect(api, &OpenAPI::OAIDefaultApi::locationsGetSignal, this, &PaginationWidget::show_locations);
    connect(api, &OpenAPI::OAIDefaultApi::locationsPostSignal, this, [this](OpenAPI::OAILocation summary) {
        items_layout->addWidget(new LocationsEditorWidget(this, api, summary));
    });

    connect(api, &OpenAPI::OAIDefaultApi::subjectsGetSignal, this, &PaginationWidget::show_subjects);
    connect(api, &OpenAPI::OAIDefaultApi::subjectsPostSignal, this, [this](OpenAPI::OAISubject summary) {
        items_layout->addWidget(new SubjectsEditorWidget(this, api, summary));
    });

    connect(api, &OpenAPI::OAIDefaultApi::timetablesGetSignal, this, &PaginationWidget::show_timetables);
    connect(api, &OpenAPI::OAIDefaultApi::timetablesPostSignal, this, [this](OpenAPI::OAITimetable summary) {
        items_layout->addWidget(new TimetablesEditorWidget(this, api, summary));
    });
}

PaginationWidget::PaginationWidget(QWidget *parent, SearchMode new_mode, OpenAPI::OAIDefaultApi *new_api)
    : QWidget(parent) {
    mode = new_mode;
    api = new_api;
    page = 1;
    total_pages = 1;

    vertical_layout = new QVBoxLayout(this);
    search_line_edit = new QLineEdit(this);
    search_line_edit->setPlaceholderText("Поиск");

    items_widget = new QWidget(this);
    items_layout = new QVBoxLayout(items_widget);

    pages_navigation_layout = new QHBoxLayout;
    prev_page_button = new QPushButton("<", this);
    page_combo = new QComboBox(this);
    next_page_button = new QPushButton(">", this);

    new_item_button = new QPushButton("+", this);

    pages_navigation_layout->addWidget(prev_page_button);
    pages_navigation_layout->addWidget(page_combo, 1);
    pages_navigation_layout->addWidget(next_page_button);

    vertical_layout->addWidget(search_line_edit);
    vertical_layout->addWidget(items_widget);
    vertical_layout->addWidget(new_item_button);
    vertical_layout->addLayout(pages_navigation_layout);

    setup_connections();
    get_data();
}

void PaginationWidget::show_subgroups(OpenAPI::OAIListSubgroups summary) {
    while (QLayoutItem *item = items_layout->takeAt(0)) {
        delete item->widget();
        delete item;
    }

    total_pages = summary.getPagination().getTotalPages();

    page_combo->blockSignals(true);
    page_combo->clear();
    static int cnt = 0;
    for (int i = 1; i <= total_pages; i++) {
        page_combo->addItem("Страница " + QString::number(i), i);
    }
    page_combo->setCurrentIndex(page - 1);
    page_combo->blockSignals(false);

    for (auto subgroup: summary.getSubgroups())
        items_layout->addWidget(new SubgroupEditorWidget(this, api, subgroup));

    prev_page_button->setEnabled(page > 1);
    next_page_button->setEnabled(page < total_pages);
}
void PaginationWidget::show_teachers(OpenAPI::OAIListTeachers summary) {
    while (QLayoutItem *item = items_layout->takeAt(0)) {
        delete item->widget();
        delete item;
    }

    total_pages = summary.getPagination().getTotalPages();

    page_combo->blockSignals(true);
    page_combo->clear();
    static int cnt = 0;
    for (int i = 1; i <= total_pages; i++) {
        page_combo->addItem("Страница " + QString::number(i), i);
    }
    page_combo->setCurrentIndex(page - 1);
    page_combo->blockSignals(false);

    for (auto teacher: summary.getTeachers())
        items_layout->addWidget(new TeachersEditorWidget(this, api, teacher));

    prev_page_button->setEnabled(page > 1);
    next_page_button->setEnabled(page < total_pages);
}

void PaginationWidget::show_subjects(OpenAPI::OAIListSubjects summary) {
    while (QLayoutItem *item = items_layout->takeAt(0)) {
        delete item->widget();
        delete item;
    }

    total_pages = summary.getPagination().getTotalPages();

    page_combo->blockSignals(true);
    page_combo->clear();
    static int cnt = 0;
    for (int i = 1; i <= total_pages; i++) {
        page_combo->addItem("Страница " + QString::number(i), i);
    }
    page_combo->setCurrentIndex(page - 1);
    page_combo->blockSignals(false);

    for (auto subject: summary.getSubjects())
        items_layout->addWidget(new SubjectsEditorWidget(this, api, subject));

    prev_page_button->setEnabled(page > 1);
    next_page_button->setEnabled(page < total_pages);
}

void PaginationWidget::show_locations(OpenAPI::OAIListLocations summary) {
    while (QLayoutItem *item = items_layout->takeAt(0)) {
        delete item->widget();
        delete item;
    }

    total_pages = summary.getPagination().getTotalPages();

    page_combo->blockSignals(true);
    page_combo->clear();
    static int cnt = 0;
    for (int i = 1; i <= total_pages; i++) {
        page_combo->addItem("Страница " + QString::number(i), i);
    }
    page_combo->setCurrentIndex(page - 1);
    page_combo->blockSignals(false);

    for (auto location: summary.getLocations())
        items_layout->addWidget(new LocationsEditorWidget(this, api, location));

    prev_page_button->setEnabled(page > 1);
    next_page_button->setEnabled(page < total_pages);
}

void PaginationWidget::show_timetables(OpenAPI::OAIListTimetables summary) {
    while (QLayoutItem *item = items_layout->takeAt(0)) {
        delete item->widget();
        delete item;
    }

    total_pages = summary.getPagination().getTotalPages();

    page_combo->blockSignals(true);
    page_combo->clear();
    static int cnt = 0;
    for (int i = 1; i <= total_pages; i++) {
        page_combo->addItem("Страница " + QString::number(i), i);
    }
    page_combo->setCurrentIndex(page - 1);
    page_combo->blockSignals(false);

    for (auto timetable: summary.getTimetables())
        items_layout->addWidget(new TimetablesEditorWidget(this, api, timetable));

    prev_page_button->setEnabled(page > 1);
    next_page_button->setEnabled(page < total_pages);
}

void PaginationWidget::get_data() {
    switch (mode) {
        case SearchMode::Subgroup:
            api->subgroupsGet(10, page, search_line_edit->text());
            break;
        case SearchMode::Teacher:
            api->teachersGet(10, page, search_line_edit->text());
            break;
        case SearchMode::Subject:
            api->subjectsGet(10, page, search_line_edit->text());
            break;
        case SearchMode::Location:
            api->locationsGet(10, page, search_line_edit->text());
            break;
        case SearchMode::Timetables:
            api->timetablesGet(10, page, search_line_edit->text());
            break;
    }
}

void PaginationWidget::create_new_item() {
    switch (mode) {
        case SearchMode::Subgroup:
            api->subgroupsPost(OpenAPI::OAISubgroup());
            break;
        case SearchMode::Teacher:
            api->teachersPost(OpenAPI::OAITeacher());
            break;
        case SearchMode::Subject:
            api->subjectsPost(OpenAPI::OAISubject());
            break;
        case SearchMode::Location:
            api->locationsPost(OpenAPI::OAILocation());
            break;
        case SearchMode::Timetables:
            api->timetablesPost(OpenAPI::OAITimetable());
            break;
    }
}
