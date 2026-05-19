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
#include <QClipboard>
#include "OAIDefaultApi.h"
#include "OAILesson.h"
#include "TimetablePainter.h"
#include "../api/BasePath.h"

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
    QPushButton *ics_export_button;

    QString ics_url;
    QClipboard *clipboard;

    TimetablePainter *painter;
    OpenAPI::OAIDefaultApi *api;

    QDate current_date;

    SearchMode search_mode;
    QList<OpenAPI::OAILesson> raw_lessons;

    QTimer *search_timer;

    void setup_connections();

    void request_search(const QString &text);

    void update_painter();

    void shift_week(int weeks);

    bool is_week_even(const QDate &date) const;

private slots:
    void combobox_request();

    void get_lessons(int i);

    void add_subgroups_to_combo(OpenAPI::OAIListSubgroups summary);

    void add_teachers_to_combo(OpenAPI::OAIListTeachers summary);

    void add_subjects_to_combo(OpenAPI::OAIListSubjects summary);

    void add_locations_to_combo(OpenAPI::OAIListLocations summary);

    void setSearchMode(SearchMode mode);

public:
    TimetableRenderer(QWidget *parent, OpenAPI::OAIDefaultApi *new_api);
};

#endif //QT_CLIENT_TIMETABLERENDERER_H
