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

    const QMap<QString, QColor> label_color_map = {
        {"(лек)", "#3b82f6"},
        {"(пр)", "#22c55e"},
        {"(лаб)", "#f97316"},
        {"(кср)", "#a855f7"},
    };
    const QMap<QString, QColor> box_color_map = {
        {"(лек)", "#E6EFFE"},
        {"(пр)", "#E3F8EB"},
        {"(лаб)", "#FEEDE2"},
        {"(кср)", "#E9D4FD"},
    };

    QString minutes_to_time(int minutes);
    QString elide_two_lines(const QString &text, const QFont &font, int width, int max_lines) const;
    void update_elided_texts();

protected:
    void resizeEvent(QResizeEvent *event) override;

public:
    OpenAPI::OAILesson lesson;

    UiLesson(const OpenAPI::OAILesson &new_lesson);
};


#endif //QT_CLIENT_UILESSON_H
