//
// Created by localuser on 5/19/26.
//

#include "SearchComboWidget.h"
#include "../api/api-consts.h"
#include <QHBoxLayout>

SearchComboWidget::SearchComboWidget(QWidget *parent, SearchMode new_mode)
    : QWidget(parent) {

    api = new OpenAPI::OAIDefaultApi();
    api->setParent(this);
    api->setNewServerForAllOperations(basePath);
    api->addHeaders("Cookie", "apiKey=" + apiKey);

    mode = new_mode;

    combo = new QComboBox(this);
    combo->setEditable(true);
    combo->setInsertPolicy(QComboBox::NoInsert);
    combo->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
    combo->setCompleter(nullptr);

    auto layout = new QHBoxLayout(this);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->addWidget(combo);

    search_timer = new QTimer(this);
    search_timer->setSingleShot(true);
    search_timer->setInterval(500);

    setup_connections();
}

void SearchComboWidget::setup_connections() {
    connect(combo, &QComboBox::editTextChanged, this, [this](const QString &text) {
        last_query = text;
        search_timer->start();
    });

    connect(search_timer, &QTimer::timeout, this, &SearchComboWidget::request_search);

    connect(combo, &QComboBox::activated, this, [this](int index) {
        if (index < 0) {
            return;
        }
        emit itemSelected(combo->itemData(index).toInt(), combo->itemText(index));
    });

    connect(api, &OpenAPI::OAIDefaultApi::subgroupsGetSignal, this, &SearchComboWidget::add_subgroups);
    connect(api, &OpenAPI::OAIDefaultApi::teachersGetSignal, this, &SearchComboWidget::add_teachers);
    connect(api, &OpenAPI::OAIDefaultApi::subjectsGetSignal, this, &SearchComboWidget::add_subjects);
    connect(api, &OpenAPI::OAIDefaultApi::locationsGetSignal, this, &SearchComboWidget::add_locations);
    connect(api, &OpenAPI::OAIDefaultApi::timetablesGetSignal, this, &SearchComboWidget::add_timetables);
}

void SearchComboWidget::request_search() {
    if (last_query.isEmpty()) {
        return;
    }
    switch (mode) {
        case SearchMode::Subgroup:
            api->subgroupsGet(20, 0, last_query);
            break;
        case SearchMode::Teacher:
            api->teachersGet(20, 0, last_query);
            break;
        case SearchMode::Subject:
            api->subjectsGet(20, 0, last_query);
            break;
        case SearchMode::Location:
            api->locationsGet(20, 0, last_query);
            break;
        case SearchMode::Timetables:
            api->timetablesGet(20, 0, last_query);
            break;
    }
}

bool SearchComboWidget::should_show_popup() const {
    if (!combo->lineEdit() || !combo->lineEdit()->hasFocus()) {
        return false;
    }
    return combo->currentText() == last_query;
}

void SearchComboWidget::add_subgroups(OpenAPI::OAIListSubgroups summary) {
    if (mode != SearchMode::Subgroup) {
        return;
    }
    auto search = combo->currentText();
    combo->blockSignals(true);
    combo->clear();
    for (const auto &subgroup: summary.getSubgroups()) {
        combo->addItem(subgroup.getName(), subgroup.getId());
        combo->setItemData(combo->count() - 1, QVariant::fromValue(subgroup), Qt::UserRole + 1);
    }
    combo->setCurrentText(search);
    combo->blockSignals(false);
    if (should_show_popup()) {
        combo->showPopup();
    }
}

void SearchComboWidget::add_teachers(OpenAPI::OAIListTeachers summary) {
    if (mode != SearchMode::Teacher) {
        return;
    }
    auto search = combo->currentText();
    combo->blockSignals(true);
    combo->clear();
    for (const auto &teacher: summary.getTeachers()) {
        combo->addItem(teacher.getName(), teacher.getId());
        combo->setItemData(combo->count() - 1, QVariant::fromValue(teacher), Qt::UserRole + 1);
    }
    combo->setCurrentText(search);
    combo->blockSignals(false);
    if (should_show_popup()) {
        combo->showPopup();
    }
}

void SearchComboWidget::add_subjects(OpenAPI::OAIListSubjects summary) {
    if (mode != SearchMode::Subject) {
        return;
    }
    auto search = combo->currentText();
    combo->blockSignals(true);
    combo->clear();
    for (const auto &subject: summary.getSubjects()) {
        combo->addItem(subject.getName(), subject.getId());
        combo->setItemData(combo->count() - 1, QVariant::fromValue(subject), Qt::UserRole + 1);
    }
    combo->setCurrentText(search);
    combo->blockSignals(false);
    if (should_show_popup()) {
        combo->showPopup();
    }
}

void SearchComboWidget::add_locations(OpenAPI::OAIListLocations summary) {
    if (mode != SearchMode::Location) {
        return;
    }
    auto search = combo->currentText();
    combo->blockSignals(true);
    combo->clear();
    for (const auto &location: summary.getLocations()) {
        combo->addItem(location.getName(), location.getId());
        combo->setItemData(combo->count() - 1, QVariant::fromValue(location), Qt::UserRole + 1);
    }
    combo->setCurrentText(search);
    combo->blockSignals(false);
    if (should_show_popup()) {
        combo->showPopup();
    }
}

void SearchComboWidget::add_timetables(OpenAPI::OAIListTimetables summary) {
    if (mode != SearchMode::Timetables) {
        return;
    }
    auto search = combo->currentText();
    combo->blockSignals(true);
    combo->clear();
    for (const auto &timetable: summary.getTimetables()) {
        combo->addItem(timetable.getName(), timetable.getId());
        combo->setItemData(combo->count() - 1, QVariant::fromValue(timetable), Qt::UserRole + 1);
    }
    combo->setCurrentText(search);
    combo->blockSignals(false);
    if (should_show_popup()) {
        combo->showPopup();
    }
}

void SearchComboWidget::setMode(SearchMode new_mode) {
    mode = new_mode;
    combo->clear();
    combo->setEditText(QString());
}

SearchMode SearchComboWidget::getMode() const {
    return mode;
}

QComboBox *SearchComboWidget::comboBox() const {
    return combo;
}

void SearchComboWidget::clearSelection() {
    combo->setCurrentIndex(-1);
    combo->setEditText(QString());
}

void SearchComboWidget::setCurrentItem(const QString &name, int id, const QVariant &object) {
    combo->blockSignals(true);
    combo->clear();
    combo->addItem(name, id);
    combo->setItemData(0, object, Qt::UserRole + 1);
    combo->setCurrentIndex(0);
    combo->blockSignals(false);
}

int SearchComboWidget::currentId() const {
    return combo->currentData().toInt();
}

QString SearchComboWidget::currentName() const {
    return combo->currentText();
}

QVariant SearchComboWidget::currentObject() const {
    int index = combo->currentIndex();
    if (index < 0) {
        return {};
    }
    return combo->itemData(index, Qt::UserRole + 1);
}
