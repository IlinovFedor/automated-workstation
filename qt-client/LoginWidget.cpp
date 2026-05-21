//
// Created by localuser on 5/21/26.
//

#include "LoginWidget.h"

#include <QDialog>
#include <qdialogbuttonbox.h>

#include "ErrorWidget.h"
#include "api/BasePath.h"

LoginWidget::LoginWidget(QWidget *parent) : QWidget(parent) {
    dispatcher_key_line_edit = new QLineEdit("Введите код диспетчера", this);
    QString status_string = "";
    if (user_role == RoleUnauthorized)
        status_string = "Не авторизован";
    if (user_role == RoleUser)
        status_string = "Пользователь";
    if (user_role == RoleAdmin)
        status_string = "Администратор";
    status_label = new QLabel(status_string, this);
    login_button = new QPushButton("Войти", this);
    logout_button = new QPushButton("Выйти", this);

    vertical_layout = new QVBoxLayout(this);
    vertical_layout->addWidget(dispatcher_key_line_edit);
    vertical_layout->addWidget(status_label);
    vertical_layout->addWidget(login_button);
    vertical_layout->addWidget(logout_button);

    api = new OpenAPI::OAIDefaultApi;
    api->setParent(this);
    api->setNewServerForAllOperations(QUrl(basePath));

    connect(login_button, &QPushButton::clicked, this, [this]() {
        api->addHeaders("Cookie", "apiKey=" + dispatcher_key_line_edit->text());
        apiKey = dispatcher_key_line_edit->text();
        api->getmeGet();
    });

    connect(api, &OpenAPI::OAIDefaultApi::getmeGetSignal, this, [this](OpenAPI::OAIUser user) {
        user_role = user.getRole();
        QString new_status_string;
        if (user_role == RoleUnauthorized)
            new_status_string = "Не авторизован";
        if (user_role == RoleUser)
            new_status_string = "Пользователь";
        if (user_role == RoleAdmin)
            new_status_string = "Администратор";
        status_label->setText(new_status_string);
    });

    connect(api, &OpenAPI::OAIDefaultApi::getmeGetSignalErrorFull, this,
            [this](OpenAPI::OAIHttpRequestWorker * _t1, QNetworkReply::NetworkError _t2, const QString & _t3) {
                auto err = new ErrorWidget(_t1, _t2, _t3, this);
    });

    connect(logout_button, &QPushButton::clicked, this, [this]() {
        api->addHeaders("Cookie", "");
        api->getmeGet();
        apiKey = "";
    });
}
