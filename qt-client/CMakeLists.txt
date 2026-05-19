cmake_minimum_required(VERSION 4.2)
project(qt_client)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)


find_package(Qt6 COMPONENTS
        Core
        Gui
        Widgets
        REQUIRED)

add_subdirectory(api/client)
add_executable(qt_client main.cpp
        MainWindow.cpp
        MainWindow.h
        CustomButton.cpp
        CustomButton.h
        TimetablePainter.cpp
        TimetablePainter.h
        TimetableRenderer.cpp
        TimetableRenderer.h
        UiLesson.cpp
        UiLesson.h
        resources.qrc
        TimetableRenderer.cpp
        TimetableRenderer.h
        PaginationWidget.cpp
        PaginationWidget.h
        EditorWidgets/SubgroupEditorWidget.cpp
        EditorWidgets/SubgroupEditorWidget.h
        EditorWidgets/TeachersEditorWidget.cpp
        EditorWidgets/TeachersEditorWidget.h
        EditorWidgets/LocationsEditorWidget.cpp
        EditorWidgets/LocationsEditorWidget.h
        EditorWidgets/SubjectsEditorWidget.cpp
        EditorWidgets/SubjectsEditorWidget.h)

target_link_libraries(qt_client
        Qt::Core
        Qt::Gui
        Qt::Widgets
        QtOpenAPIClient
)
