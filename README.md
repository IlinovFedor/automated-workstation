# АРМ диспетчера по расписанию
РИС-25-2Б Ильинов Фёдор Михайлович
- [Видеопрезентация](https://disk.yandex.ru/i/VeI31il4lbWIKQ)
- [Отчёт](latex/rpz-cmake-xelatex.pdf)

Клиент-серверное приложение для управления учебным расписанием высшего учебного заведения. Сервер на Go (REST API), десктопный клиент на C++/Qt6, веб-интерфейс на React.

## Требования

- Docker и Docker Compose
- Для сборки десктопного клиента: Qt 6.11+, CMake 4.2+

## Быстрый старт (Docker)

```bash
docker compose up
```

После запуска приложение доступно по адресу http://localhost:8470 (порт задаётся в .env).

При запуске поднимаются следующие сервисы:
- **postgres** — база данных PostgreSQL 16 для хранения расписания и справочных данных
- **migrations** — однократное применение goose-миграций для инициализации схемы БД
- **backend** — Go-сервер, обрабатывающий REST API на порту 8466
- **frontend-build** — сборка React-приложения в отдельный том
- **nginx** — обратный прокси на порту 8470, раздаёт статику фронтенда и проксирует запросы /api на backend

## Конфигурация

Переменные окружения задаются в файле `.env`:

| Переменная | По умолчанию | Описание |
|---|---|---|
| NGINX_PORT | 8470 | Порт, на котором доступно приложение |
| BACKEND_PORT | 8466 | Внутренний порт Go-сервера |
| POSTGRES_DB | timetables | Имя базы данных |
| POSTGRES_HOST | postgres | Хост PostgreSQL (имя сервиса в compose) |
| POSTGRES_PORT | 5432 | Порт PostgreSQL |
| POSTGRES_USER | postgres | Пользователь БД |
| POSTGRES_PASSWORD | password | Пароль БД |
| ADMIN_COOKIE | admin | Значение cookie для административного доступа |

## Генерация кода по OpenAPI-спецификации

```bash
make oapi-codegen
```

или вручную через Docker Compose:

```bash
docker compose run --rm --profile codegen oapi-gen-go
docker compose run --rm --profile codegen oapi-gen-cpp
```

Спецификация REST API находится в файле `openapi/openapi.yaml`. По ней автоматически генерируются:
- Go-серверный код в `backend/internal/api/` (инструмент oapi-codegen)
- C++ Qt-клиент в `qt-client/api/client/` (инструмент OpenAPI Generator)

## Десктопный клиент (Qt 6.11+)

```bash
cd qt-client
cmake -B build -DAPI_BASE_URL="http://localhost:8470/api"
cmake --build build
```

Параметр `API_BASE_URL` указывает на запущенный экземпляр сервера. При стандартном запуске через Docker Compose сервер доступен через nginx на порту 8470.

## Структура проекта

| Директория | Назначение |
|---|---|
| `backend/` | Go-сервер с реализацией REST API |
| `qt-client/` | Десктопный клиент на C++20 с Qt 6 |
| `frontend/` | Веб-интерфейс на React с TypeScript |
| `openapi/` | OpenAPI 3.0 спецификация и конфигурация генерации |
| `nginx/` | Конфигурация nginx для обратного прокси |
| `compose.yaml` | Описание сервисов для Docker Compose |
| `Makefile` | Команды для генерации кода |
