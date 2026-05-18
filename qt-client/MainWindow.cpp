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

    dispatcher_button = new QPushButton("Авторизация", this);
    buttons_layout->addWidget(dispatcher_button);

    renderer = new TimetableRenderer(this);
    horizontal_layout->addWidget(buttons_container);
    horizontal_layout->addWidget(renderer);
}
