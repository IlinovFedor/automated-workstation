#ifndef QT_CLIENT_APICONSTS_H
#define QT_CLIENT_APICONSTS_H

#include <QString>
const QString basePath = "http://localhost:8466";
const QString RoleUnauthorized = "unauthorized";
const QString RoleUser = "user";
const QString RoleAdmin = "admin";

inline QString user_role = RoleUnauthorized;

inline QString apiKey = "";

// enum: [ CODE_BAD_REQUEST, CODE_UNAUTHORIZED, CODE_FORBIDDEN, CODE_WRONG_ARCHIVE, CODE_WRONG_XLSX, CODE_CANNOT_SERIALIZE_ICS, CODE_DB_ERROR ]


const QMap<QString, QString> ApiErrors = {
    {"CODE_BAD_REQUEST", "Неверный запрос. Обратитесь к системному администратору."},
    {"CODE_UNAUTHORIZED", "Пожалуйста, авторизуйтесь."},
    {"CODE_FORBIDDEN", "Доступ запрещён.."},
    {"CODE_WRONG_ARCHIVE", "Неверный формат архива."},
    {"CODE_WRONG_XLSX", "Неверный формат XLSX."},
    {"CODE_CANNOT_SERIALIZE_ICS", "Не удалось создать ICS. Обратитесь к системному администратору."},
    {"CODE_DB_ERROR", "Ошибка базы данных. Обратитесь к системному администратору."},
};

enum class SearchMode {
    Subgroup,
    Teacher,
    Subject,
    Location,
    Timetables
};

Q_DECLARE_METATYPE(SearchMode)
#endif // QT_CLIENT_APICONSTS_H