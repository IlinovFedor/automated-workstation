#include <QApplication>
#include <QPushButton>
#include <QtNetwork/QNetworkReply>

#include "MainWindow.h"
#include "api/client/OAITeacher.h"
#include "api/client/OAIHttpRequest.h"
#include "api/client/OAIDefaultApi.h"

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);
    // OpenAPI::OAIDefaultApi api;
    // QUrl url("http://localhost:8470");
    // api.setNewServerForAllOperations(url);
    // QPushButton button("kal", nullptr);
    // button.resize(200, 100);
    // button.show();
    //
    // QObject::connect(&api, &OpenAPI::OAIDefaultApi::lessonsIdGetSignal,
    //                  [&button](OpenAPI::OAILesson lesson) {
    //                      qDebug() << lesson.asJsonObject();
    //                      button.setText(lesson.asJson());
    //                      // lesson.getId(), lesson.getTitle(), etc.
    //                  });
    //
    // api.lessonsIdGet("d4a30ce8-e672-4dda-ae34-c5dae95761d5");
    MainWindow window;
    window.show();
    return QApplication::exec();
}
