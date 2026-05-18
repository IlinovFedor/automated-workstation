//
// Created by localuser on 5/17/26.
//

#include "MainWindow.h"

#include "OAIDefaultApi.h"
#include "OAIHttpRequest.h"

MainWindow::MainWindow() {
    horizontal_layout = new QHBoxLayout(this);

    QWidget* buttons_container = new QWidget;
    buttons_container->setMaximumWidth(200);
    buttons_layout = new QVBoxLayout(buttons_container);

    viewer_layout = new QVBoxLayout(this);

    dispatcher_button = new CustomButton("Авторизация", this);

    lessons_by_locations_button = new CustomButton("Поиск по аудиториям", this);
    lessons_by_subgroups_button = new CustomButton("Поиск по группам", this);
    lessons_by_subjects_button = new CustomButton("Поиск по предметам", this);
    lessons_by_teachers_button = new CustomButton("Поиск по преподавателям", this);

    buttons_layout->addWidget(lessons_by_subgroups_button);
    buttons_layout->addWidget(lessons_by_teachers_button);
    buttons_layout->addWidget(lessons_by_subjects_button);
    buttons_layout->addWidget(lessons_by_locations_button);
    buttons_layout->addWidget(dispatcher_button);

    painter = new TimetablePainter(this);
    horizontal_layout->addWidget(buttons_container);
    horizontal_layout->addWidget(painter);

    OpenAPI::OAIDefaultApi* api = new OpenAPI::OAIDefaultApi;
    QUrl url("http://localhost:8470");
    api->setNewServerForAllOperations(url);
    api->lessonsTableIdGet(50, "subgroups");
    connect(api, &OpenAPI::OAIDefaultApi::lessonsTableIdGetSignal,
            painter, &TimetablePainter::set_lessons);
}
