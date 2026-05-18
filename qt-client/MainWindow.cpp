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

    painter_button = new QPushButton("Расписание", this);
    subgroups_button = new QPushButton("Группы", this);
    teachers_button = new QPushButton("Преподаватели", this);
    subjects_button = new QPushButton("Предметы", this);
    locations_button = new QPushButton("Аудитории", this);
    timetables_button = new QPushButton("Смена расписания", this);
    dispatcher_button = new QPushButton("Авторизация", this);

    buttons_layout->addWidget(painter_button);
    buttons_layout->addWidget(subgroups_button);
    buttons_layout->addWidget(teachers_button);
    buttons_layout->addWidget(subjects_button);
    buttons_layout->addWidget(locations_button);
    buttons_layout->addWidget(timetables_button);
    buttons_layout->addWidget(dispatcher_button);

    renderer = new TimetableRenderer(this);
    horizontal_layout->addWidget(buttons_container);
    horizontal_layout->addWidget(renderer);
}
