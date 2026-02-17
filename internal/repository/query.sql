-- name: CreateStagingTables :exec
SELECT create_staging_tables();

-- name: UpdateStagingHash :exec
SELECT update_staging_hash();

-- name: FlushStagingToMain :exec
SELECT flush_staging_to_main();

-- name: InsertStagingSubgroups :copyfrom
INSERT INTO subgroups_staging (name) VALUES (@name);

-- name: InsertStagingTeachers :copyfrom
INSERT INTO teachers_staging (name) VALUES (@name);

-- name: InsertStagingLocations :copyfrom
INSERT INTO locations_staging (name) VALUES (@name);

-- name: InsertStagingSubjects :copyfrom
INSERT INTO subjects_staging (name) VALUES (@name);

-- name: InsertStagingTimetables :copyfrom
INSERT INTO timetables_staging (name) VALUES (@name);

-- name: InsertStagingLessons :copyfrom
INSERT INTO lessons_staging (staging_id, subject, category, day, time_start, time_end, repeat_rule, timetable)
VALUES (@staging_id, @subject, @category, @day, @time_start, @time_end, @repeat_rule, @timetable);

-- name: InsertStagingSubgroupsAssignments :copyfrom
INSERT INTO subgroups_assignments_staging (staging_id, subgroup)
VALUES (@staging_id, @subgroup);

-- name: InsertStagingTeacherLocationAssignments :copyfrom
INSERT INTO teacher_location_assignments_staging (staging_id, teacher, location)
VALUES (@staging_id, @teacher, @location);