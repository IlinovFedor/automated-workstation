package application

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"io"
	"log/slog"
	"time"
	api "timetables/internal/api"
	"timetables/internal/lib"
	repository "timetables/internal/repository"
	sqlc "timetables/internal/repository/sqlc"

	"github.com/google/uuid"
)

const multipartMaxMemory = 128 * 1024 * 1024

var (
	errFileNotProvided = errors.New("file not provided")
)

var (
	defaultDateStart = time.Unix(0, 0)
	defaultDateEnd   = time.Unix(0, 0)
)

type importCache struct {
	locations  map[string]int32
	subgroups  map[string]int32
	subjects   map[string]int32
	teachers   map[string]int32
	timetables map[string]int32
	lessons    map[string]uuid.UUID
}

type Server struct {
	repo  *repository.Repo
	cache importCache
}

func (s Server) clearServerCache() {
	clear(s.cache.locations)
	clear(s.cache.subgroups)
	clear(s.cache.subjects)
	clear(s.cache.teachers)
	clear(s.cache.timetables)
	clear(s.cache.lessons)
}

func NewServer(repo *repository.Repo) *Server {
	return &Server{
		repo: repo,
		cache: importCache{
			locations:  make(map[string]int32),
			subgroups:  make(map[string]int32),
			subjects:   make(map[string]int32),
			teachers:   make(map[string]int32),
			timetables: make(map[string]int32),
			lessons:    make(map[string]uuid.UUID),
		},
	}
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
	files, err := unarchive(request)
	if err != nil {
		return nil, err
	}
	for fileName, file := range files {
		xlsx, err := lib.ParseXlsx(file)
		if err != nil {
			slog.Error("error in parsing xlsx", "file", fileName, "err", err.Error())
			continue
		}
		err = saveXlsx(ctx, &s, xlsx)
		if err != nil {
			return nil, err
		}

	}
	//TODO implement me
	//panic("implement me")
	return nil, nil
}

func saveXlsx(ctx context.Context, s *Server, xlsx *lib.ParsedXlsx) error {
	tx, err := s.repo.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := s.repo.WithTx(tx)
	timetableId, err := qtx.GetOrCreateTimetableByName(ctx, sqlc.GetOrCreateTimetableByNameParams{
		Name:      xlsx.Timetable(),
		DateStart: defaultDateStart,
		DateEnd:   defaultDateEnd,
	})

	if err != nil {
		return err
	}

	for _, lesson := range xlsx.Lessons() {
		subjectId, err := qtx.GetOrCreateSubjectByName(ctx, lesson.Subject())
		if err != nil {
			return err
		}
		lessonId, err := qtx.CreateLesson(ctx, sqlc.CreateLessonParams{
			SubjectID:   subjectId,
			Category:    lesson.Category(),
			Day:         int32(lesson.Day()),
			TimeStart:   int32(lesson.TimeStart()),
			TimeEnd:     int32(lesson.TimeEnd()),
			RepeatRule:  int32(lesson.RepeatRule()),
			TimetableID: timetableId,
		})
		if err != nil {
			return err
		}

		subgroupId, err := qtx.GetOrCreateSubgroupByName(ctx, lesson.Subgroup())
		if err != nil {
			return err
		}
		err = qtx.AssignSubgroupToLesson(ctx, sqlc.AssignSubgroupToLessonParams{
			LessonID:   lessonId,
			SubgroupID: subgroupId,
		})
		if err != nil {
			return err
		}
		for _, assignment := range lesson.TeacherLocationAssignments() {
			teacherId, err := qtx.GetOrCreateTeacherByName(ctx, assignment.Teacher())
			if err != nil {
				return err
			}
			locationId, err := qtx.GetOrCreateLocationByName(ctx, assignment.Location())
			if err != nil {
				return err
			}

			err = qtx.AssignTeacherLocationToLesson(ctx, sqlc.AssignTeacherLocationToLessonParams{
				LessonID:   lessonId,
				TeacherID:  teacherId,
				LocationID: locationId,
			})
			if err != nil {
				return err
			}

		}
	}

	return tx.Commit(ctx)
}

func unarchive(request api.PostImportRequestObject) (map[string][]byte, error) {
	files := make(map[string][]byte, 0)
	form, err := request.Body.ReadForm(multipartMaxMemory)
	if err != nil {
		return nil, err
	}

	archive := form.File["file"]
	if len(archive) == 0 {
		return nil, errFileNotProvided
	}

	fileHeader := archive[0]
	src, err := fileHeader.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	reader, err := zip.NewReader(src, archive[0].Size)
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

func (s Server) PostLessons(ctx context.Context, request api.PostLessonsRequestObject) (api.PostLessonsResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLessonsLocationsId(ctx context.Context, request api.GetLessonsLocationsIdRequestObject) (api.GetLessonsLocationsIdResponseObject, error) {
	//TODO implement me
	panic("implement me")
}

func (s Server) GetLessonsSubgroupsId(ctx context.Context, request api.GetLessonsSubgroupsIdRequestObject) (api.GetLessonsSubgroupsIdResponseObject, error) {
	lessons, err := assembleLessons(ctx, &s, &request)
	if err != nil {
		return nil, err
	}
	row, err := s.repo.GetSubgroupById(ctx, int32(request.Id))
	if err != nil {
		return nil, err
	}

	switch *request.Params.Format {
	case api.GetLessonsSubgroupsIdParamsFormatIcs:
		calendar, err := lib.SerializeICS(lessons, row.Name)
		if err != nil {
			return nil, err
		}

		reader := bytes.NewReader(calendar)
		return api.GetLessonsSubgroupsId200TextcalendarResponse{
			Body:          reader,
			ContentLength: int64(len(calendar)),
		}, nil
	default:
		return api.GetLessonsSubgroupsId200JSONResponse(lessons), nil
	}
}

func assembleLessons(ctx context.Context, s *Server, request *api.GetLessonsSubgroupsIdRequestObject) ([]api.Lesson, error) {
	tx, err := s.repo.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	qtx := s.repo.WithTx(tx)

	lessons := make([]api.Lesson, 0)

	rows, err := qtx.GetLessonsBySubgroupId(ctx, int32(request.Id))
	if err != nil {
		return nil, err
	}

	for _, row := range rows {
		subgroups, err := getSubgroups(ctx, qtx, row.ID)
		if err != nil {
			return nil, err
		}
		assignments, err := getAssignments(ctx, qtx, row.ID)
		if err != nil {
			return nil, err
		}

		day := int(row.Day)
		repeatRule := int(row.RepeatRule)
		subjectId := int(row.SubjectID)
		timeStart := int(row.TimeStart)
		timeEnd := int(row.TimeEnd)
		timetableId := int(row.TimetableID)

		lesson := api.Lesson{
			Category:   &row.Category,
			Day:        &day,
			Id:         &row.ID,
			RepeatRule: &repeatRule,
			Subgroups:  &subgroups,
			Subject: &api.Subject{
				Id:   &subjectId,
				Name: &row.SubjectName,
			},
			TeacherLocationAssignments: &assignments,
			TimeEnd:                    &timeEnd,
			TimeStart:                  &timeStart,
			Timetable: &api.Timetable{
				EndDate:   &row.TimetableDateEnd,
				Id:        &timetableId,
				Name:      &row.TimetableName,
				StartDate: &row.TimetableDateStart,
			},
		}

		lessons = append(lessons, lesson)
	}

	return lessons, tx.Commit(ctx)
}

func getAssignments(ctx context.Context, qtx *sqlc.Queries, id uuid.UUID) ([]api.TeacherLocationAssignment, error) {
	rows, err := qtx.GetTeacherLocationAssignmentsByLessonId(ctx, id)
	if err != nil {
		return nil, err
	}

	assignments := make([]api.TeacherLocationAssignment, 0)
	for _, row := range rows {
		locationId := int(row.LocationID)
		teacherId := int(row.TeacherID)
		assignments = append(assignments, api.TeacherLocationAssignment{
			Location: &api.Location{
				Id:   &locationId,
				Name: &row.LocationName,
			},
			Teacher: &api.Teacher{
				Id:   &teacherId,
				Name: &row.TeacherName,
			},
		})
	}
	return assignments, nil
}

func getSubgroups(ctx context.Context, qtx *sqlc.Queries, id uuid.UUID) ([]api.Subgroup, error) {
	rows, err := qtx.GetSubgroupsAssignmentByLessonId(ctx, id)
	if err != nil {
		return nil, err
	}
	subgroups := make([]api.Subgroup, 0)

	for _, row := range rows {
		subgroupId := int(row.SubgroupID)
		subgroups = append(subgroups, api.Subgroup{
			Id:   &subgroupId,
			Name: &row.SubgroupName,
		})
	}

	return subgroups, nil
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
