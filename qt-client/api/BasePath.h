#ifndef QT_CLIENT_APICONSTS_H
#define QT_CLIENT_APICONSTS_H

#include <QString>
const QString basePath = "http://localhost:8466";

enum class SearchMode {
    Subgroup,
    Teacher,
    Subject,
    Location,
    Timetables
};

Q_DECLARE_METATYPE(SearchMode)
#endif // QT_CLIENT_APICONSTS_H