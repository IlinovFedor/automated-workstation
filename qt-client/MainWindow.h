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
#include "TimetableRenderer.h"

class MainWindow : public QWidget {
    Q_OBJECT
    QHBoxLayout *horizontal_layout;
    QVBoxLayout *buttons_layout;

    QVBoxLayout *viewer_layout;

    QPushButton *dispatcher_button;

    TimetableRenderer *renderer;

public:
    MainWindow();
};


#endif //QT_CLIENT_MAINWINDOW_H
