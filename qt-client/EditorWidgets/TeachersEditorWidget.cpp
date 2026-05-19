//
// Created by localuser on 5/19/26.
//

#include "TeachersEditorWidget.h"
#include <QMessageBox>

TeachersEditorWidget::TeachersEditorWidget(QWidget *parent, OpenAPI::OAIDefaultApi *new_api,
                                           const OpenAPI::OAITeacher &new_teacher) : QWidget(parent) {
    api = new_api;
    teacher = new_teacher;

    id_label = new QLabel(QString::number(teacher.getId()), this);
    id_label->setMinimumWidth(50);
    id_label->setMaximumWidth(50);

    name_line_edit = new QLineEdit(teacher.getName(), this);
    submit_button = new QPushButton("Сохранить", this);
    remove_button = new QPushButton("Удалить", this);
    horizontal_layout = new QHBoxLayout(this);

    horizontal_layout->addWidget(id_label);
    horizontal_layout->addWidget(name_line_edit);
    horizontal_layout->addWidget(submit_button);
    horizontal_layout->addWidget(remove_button);

    setup_connections();
}

void TeachersEditorWidget::setup_connections() {
    connect(name_line_edit, &QLineEdit::textEdited, this, [this]() {
        teacher.setName(name_line_edit->text());
    });

    connect(submit_button, &QPushButton::clicked, this, [this]() {
        api->teachersIdPatch(teacher.getId(), teacher);
    });

    connect(remove_button, &QPushButton::clicked, this, [this]() {
        auto reply = QMessageBox::question(
            this,
            "Подтверждение",
            "Удалить?",
            QMessageBox::Yes | QMessageBox::No
        );
        if (reply == QMessageBox::Yes) {
            api->teachersIdDelete(teacher.getId());
            deleteLater();
        }
    });
}
