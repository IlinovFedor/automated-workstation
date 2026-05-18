//
// Created by localuser on 5/17/26.
//

#ifndef QT_CLIENT_CUSTOMBUTTON_H
#define QT_CLIENT_CUSTOMBUTTON_H
#include <QPushButton>
#include <QWidget>
#include <QLabel>


class CustomButton : public QWidget{
    Q_OBJECT
    QPushButton* qbutton;
    QLabel* button_label;
public:
    CustomButton(QString label, QWidget* parent);

    void resizeEvent(QResizeEvent *event);
};


#endif //QT_CLIENT_CUSTOMBUTTON_H
