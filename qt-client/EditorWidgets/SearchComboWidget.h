//
// Created by localuser on 5/19/26.
//

#ifndef QT_CLIENT_SEARCHCOMBOWIDGET_H
#define QT_CLIENT_SEARCHCOMBOWIDGET_H

#include <QComboBox>
#include <QLineEdit>
#include <QTimer>
#include <QVariant>
#include <QWidget>

#include "../api/api-consts.h"
#include "OAIDefaultApi.h"

class SearchComboWidget : public QWidget {
    Q_OBJECT
    OpenAPI::OAIDefaultApi *api;
    SearchMode mode;
    QComboBox *combo;
    QTimer *search_timer;
    QString last_query;

    void setup_connections();

    void request_search();

    bool should_show_popup() const;

    void add_subgroups(OpenAPI::OAIListSubgroups summary);

    void add_teachers(OpenAPI::OAIListTeachers summary);

    void add_subjects(OpenAPI::OAIListSubjects summary);

    void add_locations(OpenAPI::OAIListLocations summary);

    void add_timetables(OpenAPI::OAIListTimetables summary);

public:
    SearchComboWidget(QWidget *parent, SearchMode new_mode);

    void setMode(SearchMode new_mode);

    SearchMode getMode() const;

    QComboBox *comboBox() const;

    void clearSelection();

    void setCurrentItem(const QString &name, int id, const QVariant &object);

    int currentId() const;

    QString currentName() const;

    QVariant currentObject() const;

signals:
    void itemSelected(int id, const QString &name);
};

#endif //QT_CLIENT_SEARCHCOMBOWIDGET_H
