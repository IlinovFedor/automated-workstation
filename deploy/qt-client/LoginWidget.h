//
// Created by localuser on 5/21/26.
//

#ifndef QT_CLIENT_LOGINWIDGET_H
#define QT_CLIENT_LOGINWIDGET_H
#include <QLineEdit>
#include <QPushButton>
#include <QLabel>
#include <QVBoxLayout>

#include "OAIDefaultApi.h"


class LoginWidget : public QWidget{
    Q_OBJECT;
    OpenAPI::OAIDefaultApi* api;
    QVBoxLayout* vertical_layout;

    QLineEdit* dispatcher_key_line_edit;
    QLabel* status_label;
    QPushButton* login_button;
    QPushButton* logout_button;
public:
    LoginWidget(QWidget* parent);
};


#endif //QT_CLIENT_LOGINWIDGET_H
