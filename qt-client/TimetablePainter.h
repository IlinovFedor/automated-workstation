//
// Created by localuser on 5/17/26.
//

#ifndef QT_CLIENT_TIMETABLEPAINTER_H
#define QT_CLIENT_TIMETABLEPAINTER_H
#include <QApplication>
#include <QWidget>
#include <QGraphicsView>
#include <QVBoxLayout>

#include "OAILesson.h"

class TimetablePainter : public QWidget {
    Q_OBJECT
    QGraphicsScene *scene;
    QGraphicsView *view;
    QVBoxLayout *layout;

    uchar active_day_number;

    QList<OpenAPI::OAILesson> lessons;

    void draw_days();

    void draw_hours();

    void draw_lessons();

public:
    TimetablePainter(QWidget *parent);

    void clear_lessons();

    void resizeEvent(QResizeEvent *event);

    float get_col_width();

    float get_row_height();

public slots:
    void set_lessons(QList<OpenAPI::OAILesson> new_lessons);
};


#endif //QT_CLIENT_TIMETABLEPAINTER_H
