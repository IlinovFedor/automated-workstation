package config

import (
	"errors"
	"fmt"
	"os"
)

type Config struct {
	pgURL       string
	addr        string
	adminCookie string
}

func (c *Config) AdminCookie() string {
	return c.adminCookie
}

func (c *Config) PgURL() string {
	return c.pgURL
}

func (c *Config) Addr() string {
	return c.addr
}

func NewConfig() (*Config, error) {
	pgPort, ok := os.LookupEnv("POSTGRES_PORT")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_PORT ev")
	}
	pgHost, ok := os.LookupEnv("POSTGRES_HOST")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_HOST ev")
	}
	pgDB, ok := os.LookupEnv("POSTGRES_DB")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_DB ev")
	}
	pgUser, ok := os.LookupEnv("POSTGRES_USER")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_USER ev")
	}
	pgPasswd, ok := os.LookupEnv("POSTGRES_PASSWORD")
	if !ok {
		return nil, errors.New("cannot find POSTGRES_PASSWORD ev")
	}
	connUrl := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=%s", pgUser, pgPasswd, pgHost, pgPort, pgDB, "disable")

	addr, ok := os.LookupEnv("HTTP_ADDRESS")
	if !ok {
		return nil, errors.New("cannot find HTTP_ADDRESS ev")
	}
	adminCookie, ok := os.LookupEnv("ADMIN_COOKIE")
	if !ok {
		return nil, errors.New("cannot find ADMIN_COOKIE ev")
	}

	return &Config{
		pgURL:       connUrl,
		addr:        addr,
		adminCookie: adminCookie,
	}, nil
}
