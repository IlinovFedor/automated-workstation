//
// Created by localuser on 5/17/26.
//

#include "CustomButton.h"
#include <QResizeEvent>
#include <QLayout>


CustomButton::CustomButton(QString label, QWidget *parent) : QWidget(parent) {
    qbutton = new QPushButton(this);

    auto* buttonLayout = new QVBoxLayout(qbutton);

    button_label = new QLabel(label, qbutton);
    button_label->setWordWrap(true);
    button_label->setAlignment(Qt::AlignCenter);
    button_label->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);

    buttonLayout->addWidget(button_label);

    qbutton->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
    setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Preferred);
}

void CustomButton::resizeEvent(QResizeEvent* event) {
    QWidget::resizeEvent(event);
    qbutton->resize(event->size());
}