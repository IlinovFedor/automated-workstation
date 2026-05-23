# АРМ диспетчера по расписанию.

Переменные окружения (```.env```)
```
NGINX_PORT=8470
ADMIN_COOKIE=admin
POSTGRES_DB=timetables
POSTGRES_HOST=postgres
POSTGRES_PASSWORD=password
POSTGRES_PORT=5432
POSTGRES_USER=postgres
BACKEND_PORT=8466
```

Поднять сервер
```
docker compose up
```

При текущем ```.env```, клиент собирается как
```
cd qt-client
cmake -B build -DAPI_BASE_URL="http://0.0.0.0:8470/api" && cmake --build build
```

Сбора oapi-codegen файлов
```
make oapi-codegen
```