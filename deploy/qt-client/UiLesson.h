//
// Created by localuser on 5/18/26.
//

#ifndef QT_CLIENT_UILESSON_H
#define QT_CLIENT_UILESSON_H
#include <QGraphicsItem>
#include <QHash>
#include <QLabel>
#include <QVBoxLayout>
#include <QWidget>

#include "OAILesson.h"


class UiLesson : public QWidget {
    Q_OBJECT

    QVBoxLayout* vertical_layout;
    std::vector<QHBoxLayout*> teacher_layouts;
    QLabel* line_time;
    QLabel* line_subject;
    QLabel* line_subgroups;
    std::vector<std::pair<QLabel*, QLabel*>> teacher_location_assignments;
    QHash<QLabel*, QString> label_full_texts;

    QString minutes_to_time(int minutes);

public:
    OpenAPI::OAILesson lesson;

    UiLesson(const OpenAPI::OAILesson &new_lesson);

signals:
    void lessonClicked(OpenAPI::OAILesson lesson);

protected:
    void mousePressEvent(QMouseEvent *event) override;
};


#endif //QT_CLIENT_UILESSON_H
