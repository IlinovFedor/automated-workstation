package main

import (
	"archive/zip"
	"context"
	"fmt"
	"log/slog"
	_ "net/http/pprof"
	"time"
	"timetables/internal/lib"
	"timetables/internal/repository"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

func main() {
	ctx := context.Background()
	repo, err := repository.NewRepo(ctx)
	if err != nil {
		slog.Error("cannot connect to db", "err", err.Error())
	}
	_ = repo
	reader, err := zip.OpenReader("2025.02.02-timetables.zip")
	if err != nil {
		panic(err)
	}
	updater := lib.NewXlsxUpdater()
	for _, file := range reader.File {
		/*		if file.Name != "2025-2026 Raspisanie zanyatijj EHTF RIS -25-2b (vesennijj  do smeny).xlsx" {
				continue
			}*/
		open, err := file.Open()
		if err != nil {
			panic(err)
		}

		xlsxFile, err := excelize.OpenReader(open)
		if err != nil {
			panic(err)
		}

		err = updater.ParseLessonsFromFile(xlsxFile)
		if err != nil {
			continue
		}

	}
	fmt.Printf("Lessons: %d\nSubgroups: %d\nTeachers: %d\nLocations: %d\nSubjects: %d\nTimetables: %d\n",
		len(updater.GetLessonsInsertParams()),
		len(updater.GetSubgroups()),
		len(updater.GetTeachers()),
		len(updater.GetLocations()),
		len(updater.GetSubjects()),
		len(updater.GetTimetables()))
	fmt.Print(updater.GetTimetables())
	lessons := updater.GetLessonsInsertParams()
	assignments := updater.GetSubgroupsAssignments()

	// Собираем все staging_id уроков
	lessonIDs := make(map[uuid.UUID]struct{})
	for _, l := range lessons {
		lessonIDs[l.StagingID] = struct{}{}
	}

	// Ищем assignments без урока
	for _, a := range assignments {
		if _, ok := lessonIDs[a.StagingID]; !ok && a.Subgroup == "РИС-25-2б(2пг)" {
			fmt.Printf("ORPHAN assignment: staging_id=%s subgroup=%s\n", a.StagingID, a.Subgroup)
		}
	}

	tx, err := repo.Pool.Begin(ctx)
	if err != nil {
		panic(err)
	}
	defer tx.Rollback(ctx)

	qtx := repo.WithTx(tx)

	if err := qtx.CreateStagingTables(ctx); err != nil {
		panic(err)
	}

	if _, err := qtx.InsertStagingSubgroups(ctx, updater.GetSubgroups()); err != nil {
		panic(err)
	}

	if _, err := qtx.InsertStagingTeachers(ctx, updater.GetTeachers()); err != nil {
		panic(err)
	}

	if _, err := qtx.InsertStagingSubjects(ctx, updater.GetSubjects()); err != nil {
		panic(err)
	}

	if _, err := qtx.InsertStagingLocations(ctx, updater.GetLocations()); err != nil {
		panic(err)
	}

	if _, err := qtx.InsertStagingTimetables(ctx, updater.GetTimetables()); err != nil {
		panic(err)
	}

	start := time.Now()
	if _, err := qtx.InsertStagingLessons(ctx, updater.GetLessonsInsertParams()); err != nil {
		panic(err)
	}
	fmt.Println("InsertStagingLessons:", time.Since(start))

	start = time.Now()
	if _, err := qtx.InsertStagingSubgroupsAssignments(ctx, updater.GetSubgroupsAssignments()); err != nil {
		panic(err)
	}
	fmt.Println("InsertStagingSubgroupsAssignments:", time.Since(start))

	start = time.Now()
	if _, err := qtx.InsertStagingTeacherLocationAssignments(ctx, updater.GetTeacherLocationAssignments()); err != nil {
		panic(err)
	}
	fmt.Println("InsertStagingTeacherLocationAssignments:", time.Since(start))

	start = time.Now()
	if err := qtx.UpdateStagingHash(ctx); err != nil {
		panic(err)
	}
	fmt.Println("UpdateStagingHash:", time.Since(start))

	start = time.Now()
	if err := qtx.FlushStagingToMain(ctx); err != nil {
		panic(err)
	}
	fmt.Println("FlushStagingToMain:", time.Since(start))

	if err := tx.Commit(ctx); err != nil {
		panic(err)
	}
	end := time.Now()
	delta := end.Unix() - start.Unix()
	fmt.Println("delta: ", delta)

	/*	ctx := context.Background()

		repo, err := repository.NewRepo(ctx)
		if err != nil {
			slog.Error("cannot connect to db", "err", err.Error())
		}

		server := application.NewServer(repo)

		r := http.NewServeMux()

		// get an `http.Handler` that we can use
		sh := api.NewStrictHandler(server, nil)
		h := api.HandlerFromMux(sh, r)
		s := &http.Server{
			Handler: h,
			Addr:    "0.0.0.0:81",
		}

		// And we serve HTTP until the world ends.
		log.Fatal(s.ListenAndServe())*/

}
