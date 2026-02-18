package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"
	"timetables/internal/api"
	"timetables/internal/application"
	"timetables/internal/config"
	"timetables/internal/repository"
)

type ContextHandler struct {
	slog.Handler
}

func (h ContextHandler) Handle(ctx context.Context, r slog.Record) error {
	if method, ok := ctx.Value(application.ContextKeyMethod).(string); ok {
		r.AddAttrs(slog.String("method", method))
	}
	if uri, ok := ctx.Value(application.ContextKeyURI).(string); ok {
		r.AddAttrs(slog.String("uri", uri))
	}
	if addr, ok := ctx.Value(application.ContextKeyAddr).(string); ok {
		r.AddAttrs(slog.String("addr", addr))
	}
	return h.Handler.Handle(ctx, r)
}

func main() {
	ctx := context.Background()
	base := slog.NewJSONHandler(os.Stdout, nil)
	logger := slog.New(ContextHandler{base})
	slog.SetDefault(logger)

	cfg, err := config.NewConfig()
	if err != nil {
		slog.Error("cannot load config", "error", err.Error())
		os.Exit(1)
	}
	slog.Info("config loaded")

	repo, err := repository.NewRepo(ctx, cfg.PgURL())
	if err != nil {
		slog.Error("cannot connect to db", "error", err.Error())
		os.Exit(1)
	}
	defer func() {
		repo.Close()
		slog.Info("disconnected from db gracefully")
	}()
	slog.Info("connected to db")

	app := application.NewApplication(repo, cfg)
	serveMux := http.NewServeMux()
	middlewares := []api.StrictMiddlewareFunc{
		application.AuthMiddleware(cfg),
		application.LoggerMiddleware(),
	}
	strictHandler := api.NewStrictHandler(app, middlewares)
	api.HandlerFromMux(strictHandler, serveMux)

	server := &http.Server{
		Handler: serveMux,
		Addr:    cfg.Addr(),
	}
	defer server.Shutdown(ctx)

	go func() {
		err := server.ListenAndServe()
		if errors.Is(err, http.ErrServerClosed) {
			slog.Info("http server is closed gracefully")
			os.Exit(0)
		}

		slog.Error("http server is closed abnormally", "error", err.Error())
		os.Exit(0)
	}()
	slog.Info("start http server")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)

	select {
	case sig := <-stop:
		slog.Info("shutdown signal received", "signal", sig.String())
	}
}
