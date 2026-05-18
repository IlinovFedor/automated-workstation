//
// Created by localuser on 5/18/26.
//

#ifndef QT_CLIENT_TIMETABLERENDERER_H
#define QT_CLIENT_TIMETABLERENDERER_H
#include <QComboBox>
#include <QDate>
#include <QAbstractItemView>
#include <QHBoxLayout>
#include <QPushButton>
#include <QTimer>
#include <QVBoxLayout>
#include <QWidget>

#include "OAIDefaultApi.h"
#include "OAILesson.h"
#include "TimetablePainter.h"

enum class SearchMode {
    Subgroup,
    Teacher,
    Subject,
    Location
};
Q_DECLARE_METATYPE(SearchMode)

const QString subgroups_table("subgroups");
const QString teachers_table("teachers");
const QString locations_table("locations");
const QString subjects_table("subjects");

class TimetableRenderer : public QWidget {
    Q_OBJECT
    QHBoxLayout *toolbar_layout;
    QVBoxLayout *root_layout;

    QComboBox *table_combo;
    QComboBox *search_combo;
    QPushButton *prev_week_button;
    QPushButton *next_week_button;
    QPushButton *today_button;
    QPushButton *calendar_button;

    TimetablePainter *painter;
    OpenAPI::OAIDefaultApi *api;

    QDate current_date;

    SearchMode search_mode;
    QList<OpenAPI::OAILesson> raw_lessons;

    QTimer *search_timer;

    void setup_connections();

    void request_search(const QString &text);

    void request_lessons(qint32 id);

    void update_painter();

    void shift_week(int weeks);

    bool is_week_even(const QDate &date) const;

    QString table_name_for_mode() const;

private slots:
    void combobox_request();

    void get_lessons(int i);

    void show_subgroups_lessons(OpenAPI::OAIListSubgroups summary);

    void show_teachers_lessons(OpenAPI::OAIListTeachers summary);

    void show_subjects_lessons(OpenAPI::OAIListSubjects summary);

    void show_locations_lessons(OpenAPI::OAIListLocations summary);

    void setSearchMode(SearchMode mode);

public:
    explicit TimetableRenderer(QWidget *parent = nullptr);

};

#endif //QT_CLIENT_TIMETABLERENDERER_H
