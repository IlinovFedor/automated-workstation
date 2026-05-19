//
// Created by localuser on 5/18/26.
//

#ifndef QT_CLIENT_SUBGROUPSWIDGET_H
#define QT_CLIENT_SUBGROUPSWIDGET_H
#include <QLineEdit>
#include <QPushButton>
#include <QVBoxLayout>
#include <QWidget>
#include <QComboBox>

#include "OAIDefaultApi.h"
#include "api/BasePath.h"


class PaginationWidget : public QWidget {
    Q_OBJECT
    QVBoxLayout *vertical_layout;
    QLineEdit *search_line_edit;
    QPushButton *new_item_button;

    QHBoxLayout *pages_navigation_layout;
    QPushButton *prev_page_button;
    QPushButton *next_page_button;
    QComboBox *page_combo;

    SearchMode mode;
    uint page = 1;
    uint total_pages = 1;
    OpenAPI::OAIDefaultApi *api;
    QWidget *items_widget;
    QVBoxLayout *items_layout;

    void setup_connections();
signals:
    void itemSelected(int id, const QString &name);
public:
    PaginationWidget(QWidget *parent, SearchMode mode, OpenAPI::OAIDefaultApi *new_api);

    void show_subgroups(OpenAPI::OAIListSubgroups summary);

    void show_teachers(OpenAPI::OAIListTeachers summary);

    void show_subjects(OpenAPI::OAIListSubjects summary);

    void show_locations(OpenAPI::OAIListLocations summary);

    void show_timetables(OpenAPI::OAIListTimetables summary);

public slots:
    void get_data();

    void create_new_item();
};


#endif //QT_CLIENT_SUBGROUPSWIDGET_H
