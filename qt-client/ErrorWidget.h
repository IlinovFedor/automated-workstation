//
// Created by localuser on 5/21/26.
//

#ifndef QT_CLIENT_ERRORWIDGET_H
#define QT_CLIENT_ERRORWIDGET_H
#include <QDialog>
#include <QNetworkReply>
#include "api/client/OAIHttpRequest.h"

class ErrorWidget : public QDialog{
    Q_OBJECT
public:
    ErrorWidget(OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3, QWidget* parent);
};


#endif //QT_CLIENT_ERRORWIDGET_H
