//
// Created by localuser on 5/19/26.
//

#include "TimetablesEditorWidget.h"
#include <QMessageBox>
#include <QDateTimeEdit>

TimetablesEditorWidget::TimetablesEditorWidget(QWidget *parent, OpenAPI::OAIDefaultApi *new_api,
                                           const OpenAPI::OAITimetable &new_timetable) : QWidget(parent) {
    api = new_api;
    timetable = new_timetable;

    id_label = new QLabel(QString::number(timetable.getId()), this);
    id_label->setMinimumWidth(50);
    id_label->setMaximumWidth(50);

    name_line_edit = new QLineEdit(timetable.getName(), this);
    start_date_button = new QPushButton(timetable.getDateStart().toLocalTime().toString(), this);
    end_date_button = new QPushButton(timetable.getDateEnd().toLocalTime().toString(), this);

    submit_button = new QPushButton("Сохранить", this);
    remove_button = new QPushButton("Удалить", this);
    horizontal_layout = new QHBoxLayout(this);

    horizontal_layout->addWidget(id_label);
    horizontal_layout->addWidget(name_line_edit);
    horizontal_layout->addWidget(start_date_button);
    horizontal_layout->addWidget(end_date_button);

    horizontal_layout->addWidget(submit_button);
    horizontal_layout->addWidget(remove_button);

    setup_connections();
}

void TimetablesEditorWidget::setup_connections() {
    connect(name_line_edit, &QLineEdit::textEdited, this, [this]() {
        timetable.setName(name_line_edit->text());
    });

    connect(submit_button, &QPushButton::clicked, this, [this]() {
        api->timetablesIdPatch(timetable.getId(), timetable);
    });
    connect(remove_button, &QPushButton::clicked, this, [this]() {
        auto reply = QMessageBox::question(
            this,
            "Подтверждение",
            "Удалить?",
            QMessageBox::Yes | QMessageBox::No
        );
        if (reply == QMessageBox::Yes) {
            api->locationsIdDelete(timetable.getId());
            deleteLater();
        }
    });

    connect(start_date_button, &QPushButton::clicked, this, [this]() {
        QDialog dialog(this);
        dialog.setWindowTitle("Дата начала");
        auto layout = new QVBoxLayout(&dialog);
        auto date_edit = new QDateTimeEdit(timetable.getDateStart().toLocalTime(), &dialog);
        date_edit->setCalendarPopup(true);
        auto buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel, &dialog);
        layout->addWidget(date_edit);
        layout->addWidget(buttons);
        connect(buttons, &QDialogButtonBox::accepted, &dialog, &QDialog::accept);
        connect(buttons, &QDialogButtonBox::rejected, &dialog, &QDialog::reject);
        if (dialog.exec() == QDialog::Accepted) {
            timetable.setDateStart(date_edit->dateTime().toUTC());
            start_date_button->setText(date_edit->dateTime().toLocalTime().toString());
        }
    });

    connect(end_date_button, &QPushButton::clicked, this, [this]() {
        QDialog dialog(this);
        dialog.setWindowTitle("Дата конца");
        auto layout = new QVBoxLayout(&dialog);
        auto date_edit = new QDateTimeEdit(timetable.getDateEnd().toLocalTime(), &dialog);
        date_edit->setCalendarPopup(true);
        auto buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel, &dialog);
        layout->addWidget(date_edit);
        layout->addWidget(buttons);
        connect(buttons, &QDialogButtonBox::accepted, &dialog, &QDialog::accept);
        connect(buttons, &QDialogButtonBox::rejected, &dialog, &QDialog::reject);
        if (dialog.exec() == QDialog::Accepted) {
            timetable.setDateEnd(date_edit->dateTime().toUTC());
            end_date_button->setText(date_edit->dateTime().toLocalTime().toString());
        }
    });
}
