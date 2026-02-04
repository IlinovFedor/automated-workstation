package repository

import (
	"context"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"os"
	repository "timetables/internal/repository/sqlc"
)

type Repo struct {
	*repository.Queries
	Pool *pgxpool.Pool
}

func NewRepo(ctx context.Context) (*Repo, error) {
	port, ok := os.LookupEnv("POSTGRES_PORT")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_PORT EV")
	}
	host, ok := os.LookupEnv("POSTGRES_HOST")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_HOST EV")
	}
	dbname, ok := os.LookupEnv("POSTGRES_DB")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_DB EV")
	}
	user, ok := os.LookupEnv("POSTGRES_USER")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_USER EV")
	}
	pwd, ok := os.LookupEnv("POSTGRES_PASSWORD")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_PASSWORD EV")
	}

	connUrl := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=%s", user, pwd, host, port, dbname, "disable")
	pool, err := pgxpool.New(ctx, connUrl)

	if err != nil {
		return nil, fmt.Errorf("cannot create Pool %w", err)
	}

	if err = pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("cannot ping Pool %w", err)
	}

	return &Repo{
		Queries: repository.New(pool),
		Pool:    pool,
	}, nil
}

func (r Repo) Close() {
	r.Pool.Close()
}
