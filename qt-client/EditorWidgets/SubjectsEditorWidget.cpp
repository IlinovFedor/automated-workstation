//
// Created by localuser on 5/19/26.
//

#include "SubjectsEditorWidget.h"
#include <QMessageBox>

SubjectsEditorWidget::SubjectsEditorWidget(QWidget *parent, OpenAPI::OAIDefaultApi *new_api,
                                           const OpenAPI::OAISubject &new_subject) : QWidget(parent) {
    api = new_api;
    subject = new_subject;

    id_label = new QLabel(QString::number(subject.getId()), this);
    id_label->setMinimumWidth(50);
    id_label->setMaximumWidth(50);

    name_line_edit = new QLineEdit(subject.getName(), this);
    submit_button = new QPushButton("Сохранить", this);
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
    });

    connect(submit_button, &QPushButton::clicked, this, [this]() {
        api->subjectsIdPatch(subject.getId(), subject);
    });

    connect(remove_button, &QPushButton::clicked, this, [this]() {
        auto reply = QMessageBox::question(
            this,
            "Подтверждение",
            "Удалить?",
            QMessageBox::Yes | QMessageBox::No
        );
        if (reply == QMessageBox::Yes) {
            api->subjectsIdDelete(subject.getId());
            deleteLater();
        }
    });
}
