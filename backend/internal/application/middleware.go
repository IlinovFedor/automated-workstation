package application

import (
	"context"
	"net/http"
	"timetables/internal/api"
	"timetables/internal/config"

	strictnethttp "github.com/oapi-codegen/runtime/strictmiddleware/nethttp"
)

const (
	ContextKeyMethod = "method"
	ContextKeyURI    = "uri"
	ContextKeyAddr   = "addr"
)

const cookieApiKey = "apiKey"
const apiRole = "apiRole"

const (
	roleUnauthorized = iota
	roleUser
	roleAdmin
)

func LoggerMiddleware() api.StrictMiddlewareFunc {
	return func(f strictnethttp.StrictHTTPHandlerFunc, operationID string) strictnethttp.StrictHTTPHandlerFunc {
		return func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (response interface{}, err error) {
			ctx = context.WithValue(ctx, ContextKeyMethod, r.Method)
			ctx = context.WithValue(ctx, ContextKeyURI, r.URL.RequestURI())
			ctx = context.WithValue(ctx, ContextKeyAddr, r.RemoteAddr)
			return f(ctx, w, r, request)
		}
	}
}

func AuthMiddleware(cfg *config.Config) api.StrictMiddlewareFunc {
	return func(f strictnethttp.StrictHTTPHandlerFunc, operationID string) strictnethttp.StrictHTTPHandlerFunc {
		return func(ctx context.Context, w http.ResponseWriter, r *http.Request, request interface{}) (interface{}, error) {
			ctx = context.WithValue(ctx, apiRole, getRole(r, cfg))
			return f(ctx, w, r, request)
		}
	}
}

func getRole(r *http.Request, cfg *config.Config) int {
	cookie, err := r.Cookie(cookieApiKey)
	if err != nil {
		return roleUnauthorized
	}
	if cookie.Value == cfg.AdminCookie() {
		return roleAdmin
	}
	return roleUser
}
