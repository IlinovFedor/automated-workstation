//
// Created by localuser on 5/17/26.
//

#ifndef QT_CLIENT_TIMETABLEPAINTER_H
#define QT_CLIENT_TIMETABLEPAINTER_H
#include <QApplication>
#include <QWidget>
#include <QDate>
#include <QGraphicsView>
#include <QVBoxLayout>

#include "OAILesson.h"

class TimetablePainter : public QWidget {
    Q_OBJECT
    QGraphicsScene *scene;
    QGraphicsView *view;
    QVBoxLayout *layout;

    bool is_cur_date_active = false;
    QDate selected_date;

    QList<OpenAPI::OAILesson> lessons;
    QDate week_date;

    void draw_days();

    void draw_hours();

    void draw_lessons();
    void draw_day_highlight();

public:
    TimetablePainter(QWidget *parent, bool cur_date_status);

    void clear_lessons();
    void refresh();
    void set_week_date(const QDate &date);
    void set_selected_date(const QDate &date);
    void clear_selected_date();

    void resizeEvent(QResizeEvent *event) override;

    float get_col_width();

    float get_row_height();

public slots:
    void set_lessons(QList<OpenAPI::OAILesson> new_lessons);

signals:
    void lessonClicked(OpenAPI::OAILesson lesson);
};


#endif //QT_CLIENT_TIMETABLEPAINTER_H
