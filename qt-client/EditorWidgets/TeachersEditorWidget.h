//
// Created by localuser on 5/19/26.
//

#ifndef QT_CLIENT_TeachersEditorWidget_H
#define QT_CLIENT_TeachersEditorWidget_H
#include "../PaginationWidget.h"
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>

class TeachersEditorWidget : public QWidget{
    Q_OBJECT
    OpenAPI::OAIDefaultApi* api;
    OpenAPI::OAITeacher teacher;
    QLabel* id_label;
    QLineEdit* name_line_edit;
    QPushButton* submit_button;
    QPushButton* remove_button;
    QHBoxLayout* horizontal_layout;
public:
    TeachersEditorWidget(QWidget* parent, OpenAPI::OAIDefaultApi* new_api, const OpenAPI::OAITeacher& new_teacher);

    void setup_connections();
};


#endif //QT_CLIENT_TeachersEditorWidget_H
