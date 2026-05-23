oapi-codegen:
	CURRENT_UID=$(shell id -u) CURRENT_GID=$(shell id -g) docker compose run --rm oapi-gen-cpp
	CURRENT_UID=$(shell id -u) CURRENT_GID=$(shell id -g) docker compose run --rm oapi-gen-go