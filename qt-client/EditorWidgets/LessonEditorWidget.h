//
// Created by localuser on 5/19/26.
//

#ifndef QT_CLIENT_LESSONEDITORWIDGET_H
#define QT_CLIENT_LESSONEDITORWIDGET_H

#include <QComboBox>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QTimeEdit>
#include <QVBoxLayout>
#include <QScrollArea>

#include "../api/BasePath.h"
#include "OAIDefaultApi.h"
#include "OAILesson.h"
#include "OAITeacherLocationAssignment.h"

#include "SearchComboWidget.h"

class LessonEditorWidget : public QWidget {
    Q_OBJECT
    OpenAPI::OAIDefaultApi *api;
    OpenAPI::OAILesson lesson;

    QLabel *id_label;
    SearchComboWidget *subject_combo;
    QComboBox *category_combo;
    QComboBox *day_combo;
    QTimeEdit *time_start_edit;
    QTimeEdit *time_end_edit;
    QComboBox *repeat_combo;
    SearchComboWidget *timetable_combo;

    QWidget *subgroups_container;
    QVBoxLayout *subgroups_layout;
    SearchComboWidget *subgroup_search_combo;
    QPushButton *subgroup_add_button;

    QWidget *assignments_container;
    QVBoxLayout *assignments_layout;
    QPushButton *assignment_add_button;

    QPushButton *submit_button;
    QPushButton *remove_button;

    QVBoxLayout *root_layout;

    void setup_connections();
    void setup_initial_state();

    static QTime minutes_to_time(int minutes);
    static int time_to_minutes(const QTime &time);

    void add_subgroup_row(const OpenAPI::OAISubgroup &subgroup);
    void add_assignment_row(const OpenAPI::OAITeacherLocationAssignment &assignment);
    OpenAPI::OAITeacherLocationAssignment build_assignment_from_row(QWidget *row) const;

public:
    LessonEditorWidget(QWidget *parent, OpenAPI::OAIDefaultApi *new_api, const OpenAPI::OAILesson &new_lesson);
signals:
    void NewLessonData(OpenAPI::OAILesson lesson);
};

#endif //QT_CLIENT_LESSONEDITORWIDGET_H
