//
// Created by localuser on 5/17/26.
//

#ifndef QT_CLIENT_MAINWINDOW_H
#define QT_CLIENT_MAINWINDOW_H
#include <QWidget>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include "CustomButton.h"
#include "TimetablePainter.h"

class MainWindow : public QWidget {
    Q_OBJECT
    QHBoxLayout *horizontal_layout;
    QVBoxLayout *buttons_layout;

    QVBoxLayout *viewer_layout;

    CustomButton *dispatcher_button;

    CustomButton *lessons_by_locations_button;
    CustomButton *lessons_by_subgroups_button;
    CustomButton *lessons_by_subjects_button;
    CustomButton *lessons_by_teachers_button;

    TimetablePainter *painter;

public:
    MainWindow();
};


#endif //QT_CLIENT_MAINWINDOW_H
