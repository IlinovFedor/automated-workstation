CREATE TEMP TABLE subgroups_staging (name TEXT NOT NULL UNIQUE);
CREATE TEMP TABLE teachers_staging (name TEXT NOT NULL UNIQUE);
CREATE TEMP TABLE locations_staging (name TEXT NOT NULL UNIQUE);
CREATE TEMP TABLE subjects_staging (name TEXT NOT NULL UNIQUE);
CREATE TEMP TABLE timetables_staging (name TEXT NOT NULL UNIQUE);
CREATE TEMP TABLE lessons_staging
(
    staging_id   UUID PRIMARY KEY,
    subject      TEXT NOT NULL,
    category     TEXT    NOT NULL,
    day          INTEGER NOT NULL,
    time_start   INTEGER NOT NULL,
    time_end     INTEGER NOT NULL,
    repeat_rule  INTEGER NOT NULL,
    timetable    TEXT NOT NULL,
    hash         TEXT
);
CREATE TEMP TABLE subgroups_assignments_staging
(
    staging_id   UUID    NOT NULL,
    subgroup     TEXT NOT NULL,
    FOREIGN KEY (staging_id) REFERENCES lessons_staging (staging_id) ON DELETE CASCADE
);

CREATE TEMP TABLE teacher_location_assignments_staging
(
    staging_id   UUID    NOT NULL,
    teacher      TEXT NOT NULL,
    location     TEXT NOT NULL,
    FOREIGN KEY (staging_id) REFERENCES lessons_staging (staging_id) ON DELETE CASCADE
);