package application

import (
	"timetables/internal/config"
	"timetables/internal/repository"
)

type Application struct {
	repo *repository.Repo
	cfg  *config.Config
}

func NewApplication(repo *repository.Repo, cfg *config.Config) *Application {
	return &Application{repo: repo, cfg: cfg}
}
