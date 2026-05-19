//
// Created by localuser on 5/19/26.
//

#ifndef QT_CLIENT_SUBGROUPEDITORWIDGET_H
#define QT_CLIENT_SUBGROUPEDITORWIDGET_H
#include "../PaginationWidget.h"
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>

class SubgroupEditorWidget : public QWidget{
    Q_OBJECT
    OpenAPI::OAIDefaultApi* api;
    OpenAPI::OAISubgroup subgroup;
    QLabel* id_label;
    QLineEdit* name_line_edit;
    QPushButton* submit_button;
    QPushButton* remove_button;
    QHBoxLayout* horizontal_layout;
public:
    SubgroupEditorWidget(QWidget* parent, OpenAPI::OAIDefaultApi* new_api, const OpenAPI::OAISubgroup& new_subgroup);

    void setup_connections();
};


#endif //QT_CLIENT_SUBGROUPEDITORWIDGET_H
