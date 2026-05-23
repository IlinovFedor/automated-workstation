//
// Created by localuser on 5/19/26.
//

#include "SubgroupEditorWidget.h"
#include <QMessageBox>

SubgroupEditorWidget::SubgroupEditorWidget(QWidget *parent, OpenAPI::OAIDefaultApi *new_api,
                                           const OpenAPI::OAISubgroup &new_subgroup) : QWidget(parent) {
    api = new OpenAPI::OAIDefaultApi;
    api->setParent(this);
    api->setNewServerForAllOperations(QUrl(basePath));
    api->addHeaders("Cookie", "apiKey=" + apiKey);
    subgroup = new_subgroup;

    id_label = new QLabel(QString::number(subgroup.getId()), this);
    id_label->setMinimumWidth(50);
    id_label->setMaximumWidth(50);

    name_line_edit = new QLineEdit(subgroup.getName(), this);
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

void SubgroupEditorWidget::setup_connections() {
    connect(name_line_edit, &QLineEdit::textEdited, this, [this]() {
        subgroup.setName(name_line_edit->text());
        submit_button->setDisabled(false);
    });

    connect(submit_button, &QPushButton::clicked, this, [this]() {
        api->subgroupsIdPatch(subgroup.getId(), subgroup);
        submit_button->setDisabled(true);
    });
    connect(api, &OpenAPI::OAIDefaultApi::subgroupsIdPatchSignal, this, [this]() {
        submit_button->setDisabled(true);
    });
    connect(api, &OpenAPI::OAIDefaultApi::subgroupsIdPatchSignalErrorFull, this,
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
            api->subgroupsIdDelete(subgroup.getId());
    });

    connect(api, &OpenAPI::OAIDefaultApi::subgroupsIdDeleteSignal, this, [this]() {
        deleteLater();
    });
    connect(api, &OpenAPI::OAIDefaultApi::subgroupsIdDeleteSignalErrorFull, this,
            [this](OpenAPI::OAIHttpRequestWorker *_t1, QNetworkReply::NetworkError _t2, const QString &_t3) {
                ErrorWidget(_t1, _t2, _t3, this);
            });
}
