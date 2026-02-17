package application

import (
	"context"
	"errors"
	"time"
	"timetables/internal/api"
	repository "timetables/internal/repository"
)

const multipartMaxMemory = 128 * 1024 * 1024

var (
	errFileNotProvided = errors.New("file not provided")
)

var (
	defaultDateStart = time.Unix(0, 0)
	defaultDateEnd   = time.Unix(0, 0)
)

type Server struct {
	repo *repository.Repo
}

func (s Server) GetErrors(ctx context.Context, request api.GetErrorsRequestObject) (api.GetErrorsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetErrorsId(ctx context.Context, request api.GetErrorsIdRequestObject) (api.GetErrorsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PostImport(ctx context.Context, request api.PostImportRequestObject) (api.PostImportResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PostLessons(ctx context.Context, request api.PostLessonsRequestObject) (api.PostLessonsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLessonsLocationsId(ctx context.Context, request api.GetLessonsLocationsIdRequestObject) (api.GetLessonsLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLessonsSubgroupsId(ctx context.Context, request api.GetLessonsSubgroupsIdRequestObject) (api.GetLessonsSubgroupsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLessonsSubjectsId(ctx context.Context, request api.GetLessonsSubjectsIdRequestObject) (api.GetLessonsSubjectsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLessonsTeachersId(ctx context.Context, request api.GetLessonsTeachersIdRequestObject) (api.GetLessonsTeachersIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) DeleteLessonsId(ctx context.Context, request api.DeleteLessonsIdRequestObject) (api.DeleteLessonsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLessonsId(ctx context.Context, request api.GetLessonsIdRequestObject) (api.GetLessonsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PatchLessonsId(ctx context.Context, request api.PatchLessonsIdRequestObject) (api.PatchLessonsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLocations(ctx context.Context, request api.GetLocationsRequestObject) (api.GetLocationsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PostLocations(ctx context.Context, request api.PostLocationsRequestObject) (api.PostLocationsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) DeleteLocationsId(ctx context.Context, request api.DeleteLocationsIdRequestObject) (api.DeleteLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLocationsId(ctx context.Context, request api.GetLocationsIdRequestObject) (api.GetLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PatchLocationsId(ctx context.Context, request api.PatchLocationsIdRequestObject) (api.PatchLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetSubgroups(ctx context.Context, request api.GetSubgroupsRequestObject) (api.GetSubgroupsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PostSubgroups(ctx context.Context, request api.PostSubgroupsRequestObject) (api.PostSubgroupsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) DeleteSubgroupsId(ctx context.Context, request api.DeleteSubgroupsIdRequestObject) (api.DeleteSubgroupsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetSubgroupsId(ctx context.Context, request api.GetSubgroupsIdRequestObject) (api.GetSubgroupsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PatchSubgroupsId(ctx context.Context, request api.PatchSubgroupsIdRequestObject) (api.PatchSubgroupsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetSubjects(ctx context.Context, request api.GetSubjectsRequestObject) (api.GetSubjectsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PostSubjects(ctx context.Context, request api.PostSubjectsRequestObject) (api.PostSubjectsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) DeleteSubjectsId(ctx context.Context, request api.DeleteSubjectsIdRequestObject) (api.DeleteSubjectsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetSubjectsId(ctx context.Context, request api.GetSubjectsIdRequestObject) (api.GetSubjectsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PatchSubjectsId(ctx context.Context, request api.PatchSubjectsIdRequestObject) (api.PatchSubjectsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetTeachers(ctx context.Context, request api.GetTeachersRequestObject) (api.GetTeachersResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PostTeachers(ctx context.Context, request api.PostTeachersRequestObject) (api.PostTeachersResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) DeleteTeachersId(ctx context.Context, request api.DeleteTeachersIdRequestObject) (api.DeleteTeachersIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetTeachersId(ctx context.Context, request api.GetTeachersIdRequestObject) (api.GetTeachersIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PatchTeachersId(ctx context.Context, request api.PatchTeachersIdRequestObject) (api.PatchTeachersIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetTimetables(ctx context.Context, request api.GetTimetablesRequestObject) (api.GetTimetablesResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PostTimetables(ctx context.Context, request api.PostTimetablesRequestObject) (api.PostTimetablesResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) DeleteTimetablesId(ctx context.Context, request api.DeleteTimetablesIdRequestObject) (api.DeleteTimetablesIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetTimetablesId(ctx context.Context, request api.GetTimetablesIdRequestObject) (api.GetTimetablesIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) PatchTimetablesId(ctx context.Context, request api.PatchTimetablesIdRequestObject) (api.PatchTimetablesIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func NewServer(repo *repository.Repo) *Server {
	return &Server{
		repo: repo,
	}
}
