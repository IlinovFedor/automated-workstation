//
// Created by localuser on 5/19/26.
//

#ifndef QT_CLIENT_LocationsEditorWidget_H
#define QT_CLIENT_LocationsEditorWidget_H
#include "../PaginationWidget.h"
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>

class LocationsEditorWidget : public QWidget{
    Q_OBJECT
    OpenAPI::OAIDefaultApi* api;
    OpenAPI::OAILocation location;
    QLabel* id_label;
    QLineEdit* name_line_edit;
    QPushButton* submit_button;
    QPushButton* remove_button;
    QHBoxLayout* horizontal_layout;
public:
    LocationsEditorWidget(QWidget* parent, OpenAPI::OAIDefaultApi* new_api, const OpenAPI::OAILocation& new_location);

    void setup_connections();
};


#endif //QT_CLIENT_LocationsEditorWidget_H
