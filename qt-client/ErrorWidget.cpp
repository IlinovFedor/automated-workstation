//
// Created by localuser on 5/21/26.
//

#include "ErrorWidget.h"

#include <qdialogbuttonbox.h>
#include <QLabel>
#include <QVBoxLayout>

#include "OAIError.h"
#include "api/api-consts.h"
#include "api/client/OAIHttpRequest.h"

ErrorWidget::ErrorWidget(OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3, QWidget* parent) : QDialog(parent){
    auto layout = new QVBoxLayout(this);
    auto network_error_label = new QLabel("Код ошибки: " + QString::number(_t1->getHttpResponseCode()), this);
    OpenAPI::OAIError api_error;
    api_error.fromJson(_t1->response);
    auto error_text_label = new QLabel("Ошибка: " + ApiErrors[api_error.getCode()], this);
    auto *buttonBox = new QDialogButtonBox(QDialogButtonBox::Close);
    layout->addWidget(network_error_label);
    layout->addWidget(error_text_label);
    layout->addWidget(buttonBox);
    connect(buttonBox, &QDialogButtonBox::clicked, this, &QDialog::accept);
    if (this->exec() == QDialog::Accepted)
        this->close();
}