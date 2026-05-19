//
// Created by localuser on 5/17/26.
//

#ifndef QT_CLIENT_MAINWINDOW_H
#define QT_CLIENT_MAINWINDOW_H
#include <QWidget>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include "TimetableViewer/TimetablePainter.h"
#include "TimetableViewer/TimetableRenderer.h"

class MainWindow : public QWidget {
    Q_OBJECT
    QHBoxLayout *horizontal_layout;
    QVBoxLayout *buttons_layout;

    QPushButton *painter_button;
    QPushButton *locations_button;
    QPushButton *subgroups_button;
    QPushButton *subjects_button;
    QPushButton *teachers_button;
    QPushButton *timetables_button;
    QPushButton *dispatcher_button;

    QWidget *current_widget;

    OpenAPI::OAIDefaultApi *api;

    void set_view(QWidget *new_widget);
public:
    MainWindow();
};


#endif //QT_CLIENT_MAINWINDOW_H
