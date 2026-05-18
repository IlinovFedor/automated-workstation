QT += network

HEADERS += \
# Models
    $${PWD}/OAIError.h \
    $${PWD}/OAILesson.h \
    $${PWD}/OAIListErrors.h \
    $${PWD}/OAIListLocations.h \
    $${PWD}/OAIListSubgroups.h \
    $${PWD}/OAIListSubjects.h \
    $${PWD}/OAIListTeachers.h \
    $${PWD}/OAIListTimetables.h \
    $${PWD}/OAILocation.h \
    $${PWD}/OAIPagination.h \
    $${PWD}/OAISubgroup.h \
    $${PWD}/OAISubject.h \
    $${PWD}/OAITeacher.h \
    $${PWD}/OAITeacherLocationAssignment.h \
    $${PWD}/OAITimetable.h \
# APIs
    $${PWD}/OAIDefaultApi.h \
# Others
    $${PWD}/OAIHelpers.h \
    $${PWD}/OAIHttpRequest.h \
    $${PWD}/OAIObject.h \
    $${PWD}/OAIEnum.h \
    $${PWD}/OAIHttpFileElement.h \
    $${PWD}/OAIServerConfiguration.h \
    $${PWD}/OAIServerVariable.h \
    $${PWD}/OAIOauth.h

SOURCES += \
# Models
    $${PWD}/OAIError.cpp \
    $${PWD}/OAILesson.cpp \
    $${PWD}/OAIListErrors.cpp \
    $${PWD}/OAIListLocations.cpp \
    $${PWD}/OAIListSubgroups.cpp \
    $${PWD}/OAIListSubjects.cpp \
    $${PWD}/OAIListTeachers.cpp \
    $${PWD}/OAIListTimetables.cpp \
    $${PWD}/OAILocation.cpp \
    $${PWD}/OAIPagination.cpp \
    $${PWD}/OAISubgroup.cpp \
    $${PWD}/OAISubject.cpp \
    $${PWD}/OAITeacher.cpp \
    $${PWD}/OAITeacherLocationAssignment.cpp \
    $${PWD}/OAITimetable.cpp \
# APIs
    $${PWD}/OAIDefaultApi.cpp \
# Others
    $${PWD}/OAIHelpers.cpp \
    $${PWD}/OAIHttpRequest.cpp \
    $${PWD}/OAIHttpFileElement.cpp \
    $${PWD}/OAIOauth.cpp
