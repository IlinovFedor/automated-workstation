package repository

import (
	"context"
	"fmt"
	repository "timetables/internal/repository/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct {
	*repository.Queries
	Pool *pgxpool.Pool
}

func NewRepo(ctx context.Context, connUrl string) (*Repo, error) {
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
