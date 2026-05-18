//
// Created by localuser on 5/17/26.
//

#include "TimetablePainter.h"

#include <iostream>
#include <QLayout>
#include <QResizeEvent>
#include <QGraphicsTextItem>
#include <QPushButton>
#include <QGraphicsProxyWidget>

#include "OAIDefaultApi.h"
#include "UiLesson.h"

const uint time_col_width = 75;
const uint day_row_height = 50;
const uchar hour_start = 7;
const uchar hour_end = 24;

const uint row_height_px = 100;

TimetablePainter::TimetablePainter(QWidget *parent) : QWidget(parent), line_color("#D9D9D9"){
    scene = new QGraphicsScene(this);
    view = new QGraphicsView(scene, this);

    layout = new QVBoxLayout(this);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->addWidget(view);

    setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Expanding);
}

void TimetablePainter::clear_lessons() { lessons.clear(); }

void TimetablePainter::resizeEvent(QResizeEvent *event) {
    QWidget::resizeEvent(event);
    scene->setSceneRect(0, 0,
                        event->size().width(),
                        day_row_height + (hour_end - hour_start) * row_height_px);
    scene->clear();

    draw_days();
    draw_hours();
    draw_lessons();
}

void TimetablePainter::set_lessons(QList<OpenAPI::OAILesson> new_lessons) {
    lessons = new_lessons;
}


void TimetablePainter::draw_days() {
    auto r = scene->sceneRect();
    std::string labels[] = {"Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"};
    for (uchar i = 0; i < 7; i++) {
        auto x = i * (r.width() - time_col_width) / 7 + time_col_width;
        auto *time_item = new QGraphicsTextItem;
        time_item->setParent(this);
        time_item->setPlainText(labels[i].data());
        time_item->setPos(x, 0);

        scene->addItem(time_item);
        scene->addLine(x, 0, x, r.height(), QPen(line_color));
    }
}

void TimetablePainter::draw_hours() {
    auto r = scene->sceneRect();
    
    for (uchar i = hour_start; i < hour_end; i++) {
        int y = (i - hour_start) * (r.height() - day_row_height) / (hour_end - hour_start) + day_row_height;
        std::string time_string = std::to_string(i) + ":00";
        auto *time_item = new QGraphicsTextItem;
        time_item->setParent(this);
        time_item->setPlainText(time_string.data());
        time_item->setPos(0, y);
        scene->addItem(time_item);
        scene->addLine(0, y, r.width(), y, QPen(line_color));
    }
}

void TimetablePainter::draw_lessons() {
    for (auto &api_lesson: lessons) {
        auto col_width = get_col_width();
        auto row_height = get_row_height();

        auto x = time_col_width + (api_lesson.getDay() - 1) * col_width + 1;
        auto y = day_row_height + (api_lesson.getTimeStart() - hour_start * 60) / 60.0f * row_height;

        QRectF rect(x, y,
                    col_width - 2,
                    (api_lesson.getTimeEnd() - api_lesson.getTimeStart()) / 60.0f * row_height);

        UiLesson *ui_lesson = new UiLesson(api_lesson);
        auto proxy = scene->addWidget(ui_lesson);
        proxy->setGeometry(rect);
        proxy->setMinimumSize(rect.size().toSize());
        proxy->setMaximumSize(rect.size().toSize());
    }
}

float TimetablePainter::get_col_width() {
    return (scene->sceneRect().width() - time_col_width) / 7;
}

float TimetablePainter::get_row_height() {
    return (scene->sceneRect().height() - day_row_height) / (hour_end - hour_start);
}
