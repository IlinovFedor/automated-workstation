//
// Created by localuser on 5/17/26.
//

#include "MainWindow.h"

#include <qdialog.h>
#include <qdialogbuttonbox.h>
#include <QFileDialog>
#include <QFileInfo>
#include <QMessageBox>

#include "OAIDefaultApi.h"
#include "OAIHttpRequest.h"
#include "PaginationWidget.h"
#include "api/BasePath.h"

MainWindow::MainWindow() {
    api = new OpenAPI::OAIDefaultApi;
    api->setParent(this);
    api->setNewServerForAllOperations(QUrl(basePath));
    // api->addHeaders("Cookie", "apiKey=admin");

    horizontal_layout = new QHBoxLayout(this);

    QWidget *buttons_container = new QWidget;
    buttons_container->setMaximumWidth(200);
    buttons_layout = new QVBoxLayout(buttons_container);

    painter_button = new QPushButton("Расписание", this);
    subgroups_button = new QPushButton("Группы", this);
    teachers_button = new QPushButton("Преподаватели", this);
    subjects_button = new QPushButton("Предметы", this);
    locations_button = new QPushButton("Аудитории", this);
    timetables_button = new QPushButton("Смена расписания", this);
    import_button = new QPushButton("Импорт", this);
    dispatcher_button = new QPushButton("Авторизация", this);

    buttons_layout->addWidget(painter_button);
    buttons_layout->addWidget(subgroups_button);
    buttons_layout->addWidget(teachers_button);
    buttons_layout->addWidget(subjects_button);
    buttons_layout->addWidget(locations_button);
    buttons_layout->addWidget(timetables_button);
    buttons_layout->addWidget(import_button);
    buttons_layout->addWidget(dispatcher_button);

    horizontal_layout->addWidget(buttons_container);

    current_widget = new TimetableRenderer(this, api);
    horizontal_layout->addWidget(current_widget);

    connect(painter_button, &QPushButton::clicked, this, [this]() {
        set_view(new TimetableRenderer(this, api));
    });

    connect(subgroups_button, &QPushButton::clicked, this, [this]() {
        set_view(new PaginationWidget(this, SearchMode::Subgroup, api));
    });

    connect(teachers_button, &QPushButton::clicked, this, [this]() {
        set_view(new PaginationWidget(this, SearchMode::Teacher, api));
    });

    connect(locations_button, &QPushButton::clicked, this, [this]() {
        set_view(new PaginationWidget(this, SearchMode::Location, api));
    });

    connect(subjects_button, &QPushButton::clicked, this, [this]() {
        set_view(new PaginationWidget(this, SearchMode::Subject, api));
    });

    connect(timetables_button, &QPushButton::clicked, this, [this]() {
        set_view(new PaginationWidget(this, SearchMode::Timetables, api));
    });

    connect(import_button, &QPushButton::clicked, this, &MainWindow::import_dialog);
    connect(dispatcher_button, &QPushButton::clicked, this, &MainWindow::login_dialog);

    setup_api_connections();
}

void MainWindow::set_view(QWidget *new_widget) {
    if (current_widget) {
        horizontal_layout->removeWidget(current_widget);
        delete current_widget;
    }
    current_widget = new_widget;
    horizontal_layout->addWidget(current_widget, 1);
}

void MainWindow::login_dialog() {
    QDialog dialog(this);
    dialog.setWindowTitle("Авторизация");
    auto layout = new QVBoxLayout(&dialog);
    auto key_edit = new QLineEdit(&dialog);
    key_edit->setPlaceholderText("API Key");
    auto buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel, &dialog);
    layout->addWidget(key_edit);
    layout->addWidget(buttons);
    connect(buttons, &QDialogButtonBox::accepted, &dialog, &QDialog::accept);
    connect(buttons, &QDialogButtonBox::rejected, &dialog, &QDialog::reject);
    if (dialog.exec() == QDialog::Accepted) {
        horizontal_layout->removeWidget(current_widget);
        delete current_widget;

        delete api;
        api = new OpenAPI::OAIDefaultApi;
        api->setParent(this);
        api->setNewServerForAllOperations(QUrl(basePath));
        api->addHeaders("Cookie", "apiKey=" + key_edit->text());
        setup_api_connections();

        current_widget = new TimetableRenderer(this, api);
        horizontal_layout->addWidget(current_widget, 1);
    }
}

void MainWindow::import_dialog() {
    QString file_path = QFileDialog::getOpenFileName(this, "Импорт", QString(), "ZIP (*.zip)");
    if (file_path.isEmpty()) {
        return;
    }

    OpenAPI::OAIHttpFileElement file;
    QFileInfo file_info(file_path);
    file.setVariableName("file");
    file.setFileName(file_path);
    file.setRequestFileName(file_info.fileName());
    file.setMimeType("application/zip");

    api->importPost(file);
}

void MainWindow::setup_api_connections() {
    connect(api, &OpenAPI::OAIDefaultApi::importPostSignal, this, [this](const OpenAPI::OAIListErrors &summary) {
        Q_UNUSED(summary);
        QMessageBox::information(this, "Импорт", "Импорт завершен");
        set_view(new TimetableRenderer(this, api));
    });

    connect(api, &OpenAPI::OAIDefaultApi::importPostSignalError, this,
            [this](const OpenAPI::OAIListErrors &summary, QNetworkReply::NetworkError error_type, const QString &error_str) {
        Q_UNUSED(summary);
        Q_UNUSED(error_type);
        QMessageBox::warning(this, "Импорт", error_str.isEmpty() ? "Ошибка импорта" : error_str);
    });
}
