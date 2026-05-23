//
// Created by localuser on 5/19/26.
//

#include "SubjectsEditorWidget.h"
#include <QMessageBox>

SubjectsEditorWidget::SubjectsEditorWidget(QWidget *parent, OpenAPI::OAIDefaultApi *new_api,
                                           const OpenAPI::OAISubject &new_subject) : QWidget(parent) {
    api = new OpenAPI::OAIDefaultApi;
    api->setParent(this);
    api->setNewServerForAllOperations(QUrl(basePath));
    api->addHeaders("Cookie", "apiKey=" + apiKey);
    subject = new_subject;

    id_label = new QLabel(QString::number(subject.getId()), this);
    id_label->setMinimumWidth(50);
    id_label->setMaximumWidth(50);

    name_line_edit = new QLineEdit(subject.getName(), this);
    submit_button = new QPushButton("Сохранить", this);
    submit_button->setDisabled(true);
    remove_button = new QPushButton("Удалить", this);
    horizontal_layout = new QHBoxLayout(this);

    horizontal_layout->addWidget(id_label);
    horizontal_layout->addWidget(name_line_edit);
    horizontal_layout->addWidget(submit_button);
    horizontal_layout->addWidget(remove_button);

    setup_connections();
}

void SubjectsEditorWidget::setup_connections() {
    connect(name_line_edit, &QLineEdit::textEdited, this, [this]() {
        subject.setName(name_line_edit->text());
        submit_button->setDisabled(false);
    });

    connect(submit_button, &QPushButton::clicked, this, [this]() {
        api->subjectsIdPatch(subject.getId(), subject);
        submit_button->setDisabled(true);
    });
    connect(api, &OpenAPI::OAIDefaultApi::subjectsIdPatchSignal, this, [this]() {
        submit_button->setDisabled(true);
    });
    connect(api, &OpenAPI::OAIDefaultApi::subjectsIdPatchSignalErrorFull, this,
            [this](OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3) {
                ErrorWidget(_t1, _t2, _t3, this);
            });

    connect(remove_button, &QPushButton::clicked, this, [this]() {
        auto reply = QMessageBox::question(
            this,
            "Подтверждение",
            "Удалить?",
            QMessageBox::Yes | QMessageBox::No
        );
        if (reply == QMessageBox::Yes)
            api->subjectsIdDelete(subject.getId());
    });

    connect(api, &OpenAPI::OAIDefaultApi::subjectsIdDeleteSignal, this, [this]() {
        deleteLater();
    });
    connect(api, &OpenAPI::OAIDefaultApi::subjectsIdDeleteSignalErrorFull, this,
            [this](OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3) {
                ErrorWidget(_t1, _t2, _t3, this);
            });
}
