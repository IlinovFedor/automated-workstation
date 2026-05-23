//
// Created by localuser on 5/19/26.
//

#ifndef QT_CLIENT_SubjectsEditorWidget_H
#define QT_CLIENT_SubjectsEditorWidget_H
#include "../PaginationWidget.h"
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>

class SubjectsEditorWidget : public QWidget{
    Q_OBJECT
    OpenAPI::OAIDefaultApi* api;
    OpenAPI::OAISubject subject;
    QLabel* id_label;
    QLineEdit* name_line_edit;
    QPushButton* submit_button;
    QPushButton* remove_button;
    QHBoxLayout* horizontal_layout;
public:
    SubjectsEditorWidget(QWidget* parent, OpenAPI::OAIDefaultApi* new_api, const OpenAPI::OAISubject& new_subject);

    void setup_connections();
};


#endif //QT_CLIENT_SubjectsEditorWidget_H
