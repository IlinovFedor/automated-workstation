-- +goose Up
-- +goose StatementBegin
CREATE TABLE subgroups (
                           id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                           name TEXT NOT NULL UNIQUE
);

CREATE TABLE teachers (
                          id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          name TEXT NOT NULL UNIQUE
);

CREATE TABLE locations (
                           id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                           name TEXT NOT NULL UNIQUE
);

CREATE TABLE subjects (
                          id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          name TEXT NOT NULL UNIQUE
);

CREATE TABLE timetables (
                            id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                            name       TEXT        NOT NULL UNIQUE,
                            date_start TIMESTAMPTZ NOT NULL DEFAULT to_timestamp(0),
                            date_end   TIMESTAMPTZ NOT NULL DEFAULT to_timestamp(0),
                            week       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE lessons (
                         id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         subject_id   INTEGER NOT NULL,
                         category     TEXT    NOT NULL,
                         day          INTEGER NOT NULL,
                         time_start   INTEGER NOT NULL,
                         time_end     INTEGER NOT NULL,
                         repeat_rule  INTEGER NOT NULL,
                         timetable_id INTEGER NOT NULL,
                         hash         TEXT    NOT NULL UNIQUE,
                         FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
                         FOREIGN KEY (timetable_id) REFERENCES timetables (id) ON DELETE CASCADE
);

CREATE TABLE subgroups_assignments (
                                       lesson_id   UUID    NOT NULL,
                                       subgroup_id INTEGER NOT NULL,
                                       FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
                                       FOREIGN KEY (subgroup_id) REFERENCES subgroups (id) ON DELETE CASCADE,
                                       UNIQUE (lesson_id, subgroup_id)
);

CREATE TABLE teacher_location_assignments (
                                              lesson_id   UUID    NOT NULL,
                                              teacher_id  INTEGER NOT NULL,
                                              location_id INTEGER NOT NULL,
                                              FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
                                              FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
                                              FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE,
                                              UNIQUE (lesson_id, teacher_id, location_id)
);

CREATE INDEX idx_lessons_hash ON lessons (hash);

CREATE FUNCTION create_staging_tables() RETURNS void AS $$
BEGIN
    DROP TABLE IF EXISTS teacher_location_assignments_staging;
    DROP TABLE IF EXISTS subgroups_assignments_staging;
    DROP TABLE IF EXISTS lessons_staging;
    DROP TABLE IF EXISTS timetables_staging;
    DROP TABLE IF EXISTS subjects_staging;
    DROP TABLE IF EXISTS locations_staging;
    DROP TABLE IF EXISTS teachers_staging;
    DROP TABLE IF EXISTS subgroups_staging;

    CREATE TEMP TABLE subgroups_staging (name TEXT NOT NULL UNIQUE);
    CREATE TEMP TABLE teachers_staging (name TEXT NOT NULL UNIQUE);
    CREATE TEMP TABLE locations_staging (name TEXT NOT NULL UNIQUE);
    CREATE TEMP TABLE subjects_staging (name TEXT NOT NULL UNIQUE);
    CREATE TEMP TABLE timetables_staging (name TEXT NOT NULL UNIQUE);
    CREATE TEMP TABLE lessons_staging (
        staging_id  UUID PRIMARY KEY,
        subject     TEXT    NOT NULL,
        category    TEXT    NOT NULL,
        day         INTEGER NOT NULL,
        time_start  INTEGER NOT NULL,
        time_end    INTEGER NOT NULL,
        repeat_rule INTEGER NOT NULL,
        timetable   TEXT    NOT NULL,
        hash        TEXT
    );
    CREATE TEMP TABLE subgroups_assignments_staging (
        staging_id UUID NOT NULL,
        subgroup   TEXT    NOT NULL,
        FOREIGN KEY (staging_id) REFERENCES lessons_staging (staging_id) ON DELETE CASCADE
    );
    CREATE TEMP TABLE teacher_location_assignments_staging (
        staging_id UUID NOT NULL,
        teacher    TEXT    NOT NULL,
        location   TEXT    NOT NULL,
        FOREIGN KEY (staging_id) REFERENCES lessons_staging (staging_id) ON DELETE CASCADE
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_staging_hash() RETURNS void AS $$
BEGIN
UPDATE lessons_staging ls
SET hash = md5(
        ls.subject || '|' ||
        ls.category || '|' ||
        ls.day::TEXT || '|' ||
        ls.time_start::TEXT || '|' ||
        ls.time_end::TEXT || '|' ||
        ls.repeat_rule::TEXT || '|' ||
        ls.timetable || '|' ||
        COALESCE(tla.tla_hash, ''))
    FROM (
        SELECT
            staging_id,
            string_agg(teacher || ':' || location, ',' ORDER BY teacher, location) AS tla_hash
        FROM teacher_location_assignments_staging
        GROUP BY staging_id
    ) tla
    RIGHT JOIN lessons_staging ls2 ON ls2.staging_id = tla.staging_id
WHERE ls.staging_id = ls2.staging_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION flush_staging_to_main() RETURNS void AS $$
BEGIN
ALTER TABLE teacher_location_assignments DISABLE TRIGGER trigger_tla_hash;
ALTER TABLE lessons DISABLE TRIGGER trigger_lesson_hash;

INSERT INTO subgroups (name)
SELECT name FROM subgroups_staging
    ON CONFLICT (name) DO NOTHING;

INSERT INTO teachers (name)
SELECT name FROM teachers_staging
    ON CONFLICT (name) DO NOTHING;

INSERT INTO locations (name)
SELECT name FROM locations_staging
    ON CONFLICT (name) DO NOTHING;

INSERT INTO subjects (name)
SELECT name FROM subjects_staging
    ON CONFLICT (name) DO NOTHING;

INSERT INTO timetables (name)
SELECT name FROM timetables_staging
    ON CONFLICT (name) DO NOTHING;

INSERT INTO lessons (subject_id, category, day, time_start, time_end, repeat_rule, timetable_id, hash)
SELECT s.id, ls.category, ls.day, ls.time_start, ls.time_end, ls.repeat_rule, tt.id, ls.hash
FROM lessons_staging ls
         JOIN subjects s ON s.name = ls.subject
         JOIN timetables tt ON tt.name = ls.timetable
    ON CONFLICT (hash) DO NOTHING;

INSERT INTO subgroups_assignments (lesson_id, subgroup_id)
SELECT l.id, s.id
FROM subgroups_assignments_staging sas
         JOIN subgroups s ON s.name = sas.subgroup
         JOIN lessons_staging ls ON ls.staging_id = sas.staging_id
         JOIN lessons l ON l.hash = ls.hash
    ON CONFLICT (lesson_id, subgroup_id) DO NOTHING;

INSERT INTO teacher_location_assignments (lesson_id, teacher_id, location_id)
SELECT l.id, t.id, loc.id
FROM teacher_location_assignments_staging tlas
         JOIN teachers t ON t.name = tlas.teacher
         JOIN locations loc ON loc.name = tlas.location
         JOIN lessons_staging ls ON ls.staging_id = tlas.staging_id
         JOIN lessons l ON l.hash = ls.hash
    ON CONFLICT (lesson_id, teacher_id, location_id) DO NOTHING;

ALTER TABLE teacher_location_assignments ENABLE TRIGGER trigger_tla_hash;
ALTER TABLE lessons ENABLE TRIGGER trigger_lesson_hash;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_lesson_hash(p_lesson_id UUID)
RETURNS TEXT AS $$
BEGIN
RETURN (
    SELECT md5(
                   s.name || '|' ||
                   l.category || '|' ||
                   l.day::TEXT || '|' ||
            l.time_start::TEXT || '|' ||
            l.time_end::TEXT || '|' ||
            l.repeat_rule::TEXT || '|' ||
            tt.name || '|' ||
            COALESCE(
                (
                    SELECT string_agg(
                        t.name || ':' || loc.name,
                        ','
                        ORDER BY t.name, loc.name
                    )
                    FROM teacher_location_assignments tla
                    JOIN teachers t ON t.id = tla.teacher_id
                    JOIN locations loc ON loc.id = tla.location_id
                    WHERE tla.lesson_id = p_lesson_id
                ),
                ''
            )
           )
    FROM lessons l
             JOIN subjects s ON s.id = l.subject_id
             JOIN timetables tt ON tt.id = l.timetable_id
    WHERE l.id = p_lesson_id
);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_lesson_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.hash = calculate_lesson_hash(NEW.id);
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lesson_hash
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION trg_lesson_hash();

CREATE OR REPLACE FUNCTION trg_tla_hash()
RETURNS TRIGGER AS $$
DECLARE
v_lesson_id UUID;
BEGIN
    v_lesson_id = CASE WHEN TG_OP = 'DELETE' THEN OLD.lesson_id ELSE NEW.lesson_id END;
UPDATE lessons SET hash = calculate_lesson_hash(v_lesson_id) WHERE id = v_lesson_id;
RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tla_hash
    AFTER INSERT OR UPDATE OR DELETE ON teacher_location_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trg_tla_hash();

CREATE OR REPLACE FUNCTION delete_lesson_assignments(p_lesson_id UUID) RETURNS void AS $$
    BEGIN
        ALTER TABLE teacher_location_assignments DISABLE TRIGGER trigger_tla_hash;
        ALTER TABLE lessons DISABLE TRIGGER trigger_lesson_hash;

        DELETE FROM subgroups_assignments WHERE lesson_id = p_lesson_id;
        DELETE FROM teacher_location_assignments WHERE lesson_id = p_lesson_id;

        ALTER TABLE teacher_location_assignments ENABLE TRIGGER trigger_tla_hash;
        ALTER TABLE lessons ENABLE TRIGGER trigger_lesson_hash;
    END;
    $$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS trigger_tla_hash ON teacher_location_assignments;
DROP TRIGGER IF EXISTS trigger_lesson_hash ON lessons;
DROP FUNCTION IF EXISTS trg_tla_hash();
DROP FUNCTION IF EXISTS trg_lesson_hash();
DROP FUNCTION IF EXISTS calculate_lesson_hash(UUID);
DROP FUNCTION IF EXISTS flush_staging_to_main();
DROP FUNCTION IF EXISTS update_staging_hash();
DROP FUNCTION IF EXISTS create_staging_tables();
DROP FUNCTION IF EXISTS delete_lesson_assignments(UUID);
DROP TABLE teacher_location_assignments;
DROP TABLE subgroups_assignments;
DROP TABLE lessons;
DROP TABLE timetables;
DROP TABLE subjects;
DROP TABLE locations;
DROP TABLE teachers;
DROP TABLE subgroups;
-- +goose StatementEnd