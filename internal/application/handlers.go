package application

import (
	"archive/zip"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"timetables/internal/api"
	"timetables/internal/lib"
	repository "timetables/internal/repository"
)

const multipartMaxMemory = 128 * 1024 * 1024

func (a *Application) GetErrors(ctx context.Context, request api.GetErrorsRequestObject) (api.GetErrorsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetErrorsId(ctx context.Context, request api.GetErrorsIdRequestObject) (api.GetErrorsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PostImport(ctx context.Context, request api.PostImportRequestObject) (api.PostImportResponseObject, error) {
	switch ctx.Value(apiRole) {
	case roleUnauthorized:
		message := "unauthorized"
		return api.PostImport401JSONResponse{
			Message: &message,
		}, nil
	case roleUser:
		message := "forbidden"
		return api.PostImport403JSONResponse{
			Message: &message,
		}, nil
	case roleAdmin:
		break
	}

	files, err := unarchive(request)
	if err != nil {
		message := fmt.Sprintf("cannot read archive: %s", err.Error())
		slog.ErrorContext(ctx, "cannot read archive", "error", err.Error())
		return api.PostImport400JSONResponse{Message: &message}, nil
	}
	parser := lib.NewParser()

	parseErrors := make([]api.Error, 0)
	page := 0
	totalPages := 1
	pagination := api.Pagination{
		Page:       page,
		TotalPages: totalPages,
	}
	for fileName, file := range files {
		err := parser.ParseLessonsFromBytes(file)
		if err != nil {
			message := fmt.Sprintf("cannot parse file \"%s\" with error: %s", fileName, err.Error())
			slog.ErrorContext(ctx, "cannot parse file", "fileName", fileName, "error", err.Error())
			parseErrors = append(parseErrors, api.Error{Message: &message})
			continue
		}
	}
	if err := insertIntoDB(ctx, a.repo, parser); err != nil {
		message := fmt.Sprintf("cannot insert data to db: %s", err)
		slog.ErrorContext(ctx, "cannot insert data to db", "error", err.Error())
		return api.PostImport500JSONResponse{
			Message: &message,
		}, err
	}

	slog.InfoContext(ctx, "import successful")
	return api.PostImport200JSONResponse{
		Errors:     &parseErrors,
		Pagination: &pagination,
	}, nil
}

func unarchive(request api.PostImportRequestObject) (map[string][]byte, error) {
	files := make(map[string][]byte, 0)

	form, err := request.Body.ReadForm(multipartMaxMemory)
	if err != nil {
		return nil, err
	}

	archive := form.File["file"]
	if len(archive) == 0 {
		return nil, errors.New("file not provided")
	}

	fileHeader := archive[0]
	src, err := fileHeader.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	reader, err := zip.NewReader(src, fileHeader.Size)
	if err != nil {
		return nil, err
	}
	for _, file := range reader.File {
		open, err := file.Open()
		if err != nil {
			return nil, err
		}
		bytes, err := io.ReadAll(open)
		if err != nil {
			return nil, err
		}

		files[file.Name] = bytes
	}

	return files, nil
}

func insertIntoDB(ctx context.Context, repo *repository.Repo, updater *lib.Parser) error {
	tx, err := repo.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := repo.WithTx(tx)
	if err := qtx.CreateStagingTables(ctx); err != nil {
		return err
	}

	if _, err := qtx.InsertStagingSubgroups(ctx, updater.Subgroups()); err != nil {
		return err
	}
	if _, err := qtx.InsertStagingTeachers(ctx, updater.Teachers()); err != nil {
		return err
	}
	if _, err := qtx.InsertStagingSubjects(ctx, updater.Subjects()); err != nil {
		return err
	}
	if _, err := qtx.InsertStagingLocations(ctx, updater.Locations()); err != nil {
		return err
	}
	if _, err := qtx.InsertStagingTimetables(ctx, updater.Timetables()); err != nil {
		return err
	}
	if _, err := qtx.InsertStagingLessons(ctx, updater.GetLessonsInsertParams()); err != nil {
		return err
	}
	if _, err := qtx.InsertStagingSubgroupsAssignments(ctx, updater.GetSubgroupsAssignments()); err != nil {
		return err
	}
	if _, err := qtx.InsertStagingTeacherLocationAssignments(ctx, updater.GetTeacherLocationAssignments()); err != nil {
		return err
	}
	if err := qtx.UpdateStagingHash(ctx); err != nil {
		return err
	}
	if err := qtx.FlushStagingToMain(ctx); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return nil
}

func (a *Application) PostLessons(ctx context.Context, request api.PostLessonsRequestObject) (api.PostLessonsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) DeleteLessonsId(ctx context.Context, request api.DeleteLessonsIdRequestObject) (api.DeleteLessonsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetLessonsId(ctx context.Context, request api.GetLessonsIdRequestObject) (api.GetLessonsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PatchLessonsId(ctx context.Context, request api.PatchLessonsIdRequestObject) (api.PatchLessonsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetLessonsTableId(ctx context.Context, request api.GetLessonsTableIdRequestObject) (api.GetLessonsTableIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetLocations(ctx context.Context, request api.GetLocationsRequestObject) (api.GetLocationsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PostLocations(ctx context.Context, request api.PostLocationsRequestObject) (api.PostLocationsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) DeleteLocationsId(ctx context.Context, request api.DeleteLocationsIdRequestObject) (api.DeleteLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetLocationsId(ctx context.Context, request api.GetLocationsIdRequestObject) (api.GetLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PatchLocationsId(ctx context.Context, request api.PatchLocationsIdRequestObject) (api.PatchLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetSubgroups(ctx context.Context, request api.GetSubgroupsRequestObject) (api.GetSubgroupsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PostSubgroups(ctx context.Context, request api.PostSubgroupsRequestObject) (api.PostSubgroupsResponseObject, error) {
	//TODO implement me
	//panic("implement me")
	return nil, nil
}

func (a *Application) DeleteSubgroupsId(ctx context.Context, request api.DeleteSubgroupsIdRequestObject) (api.DeleteSubgroupsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetSubgroupsId(ctx context.Context, request api.GetSubgroupsIdRequestObject) (api.GetSubgroupsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PatchSubgroupsId(ctx context.Context, request api.PatchSubgroupsIdRequestObject) (api.PatchSubgroupsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetSubjects(ctx context.Context, request api.GetSubjectsRequestObject) (api.GetSubjectsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PostSubjects(ctx context.Context, request api.PostSubjectsRequestObject) (api.PostSubjectsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) DeleteSubjectsId(ctx context.Context, request api.DeleteSubjectsIdRequestObject) (api.DeleteSubjectsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetSubjectsId(ctx context.Context, request api.GetSubjectsIdRequestObject) (api.GetSubjectsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PatchSubjectsId(ctx context.Context, request api.PatchSubjectsIdRequestObject) (api.PatchSubjectsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetTeachers(ctx context.Context, request api.GetTeachersRequestObject) (api.GetTeachersResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PostTeachers(ctx context.Context, request api.PostTeachersRequestObject) (api.PostTeachersResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) DeleteTeachersId(ctx context.Context, request api.DeleteTeachersIdRequestObject) (api.DeleteTeachersIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetTeachersId(ctx context.Context, request api.GetTeachersIdRequestObject) (api.GetTeachersIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PatchTeachersId(ctx context.Context, request api.PatchTeachersIdRequestObject) (api.PatchTeachersIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetTimetables(ctx context.Context, request api.GetTimetablesRequestObject) (api.GetTimetablesResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PostTimetables(ctx context.Context, request api.PostTimetablesRequestObject) (api.PostTimetablesResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) DeleteTimetablesId(ctx context.Context, request api.DeleteTimetablesIdRequestObject) (api.DeleteTimetablesIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) GetTimetablesId(ctx context.Context, request api.GetTimetablesIdRequestObject) (api.GetTimetablesIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (a *Application) PatchTimetablesId(ctx context.Context, request api.PatchTimetablesIdRequestObject) (api.PatchTimetablesIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}
