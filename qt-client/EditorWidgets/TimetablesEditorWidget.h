//
// Created by localuser on 5/19/26.
//

#ifndef QT_CLIENT_TimetablesEditorWidget_H
#define QT_CLIENT_TimetablesEditorWidget_H
#include "../PaginationWidget.h"
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>

class TimetablesEditorWidget : public QWidget{
    Q_OBJECT
    OpenAPI::OAIDefaultApi* api;
    OpenAPI::OAITimetable timetable;
    QLabel* id_label;
    QLineEdit* name_line_edit;
    QPushButton* start_date_button;
    QPushButton* end_date_button;
    QPushButton* submit_button;
    QPushButton* remove_button;
    QHBoxLayout* horizontal_layout;
public:
    TimetablesEditorWidget(QWidget* parent, OpenAPI::OAIDefaultApi* new_api, const OpenAPI::OAITimetable& new_timetable);

    void setup_connections();
};


#endif //QT_CLIENT_TimetablesEditorWidget_H
