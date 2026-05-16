package lib

import (
	"bytes"
	"fmt"
	"maps"
	"regexp"
	"slices"
	"strings"
	"time"
	repo "timetables/internal/repository/sqlc"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

const (
	sheetName         = "Лист1"
	timetableCellName = "C2"
	lessonDuration    = 90 * time.Minute
	lessonsPerDay     = 12
	unknownValue      = "Unknown"
)

const (
	firstSubgroupCol  = 3
	secondSubgroupCol = 4
	firstLessonRow    = 4
	lastLessonRow     = 75
	subgroupRow       = 3
	timeColumnIndex   = 2
)

var (
	regexTimeNameType    = regexp.MustCompile(`([0-9]{1,2}:[0-9]{1,2})* *(.+?) (\(лек\)|\(пр\)|\(лаб\)|\(кср\)) (.*)`)
	regexTeacherRole     = regexp.MustCompile(`(асс\.)|(доц\.)|(зав\.)|(куратор)|(научный руководитель)|(ст\. *пр\.)|(пр\.)|(преп\.)|(проф\.)|(профессор)|(тренер-преподаватель)`)
	regexTeacherLocation = regexp.MustCompile(`(.*?(?:[А-Я]\.)+) *(.*)`)
)

type Lesson struct {
	rawName      string
	insertParams repo.InsertStagingLessonsParams
}

func (l *Lesson) RawName() string {
	return l.rawName
}

func (l *Lesson) InsertParams() repo.InsertStagingLessonsParams {
	return l.insertParams
}

type pendingData struct {
	subgroupsAssignments       []repo.InsertStagingSubgroupsAssignmentsParams
	teacherLocationAssignments []repo.InsertStagingTeacherLocationAssignmentsParams
}

type Parser struct {
	subgroups                  map[string]struct{}
	teachers                   map[string]struct{}
	locations                  map[string]struct{}
	subjects                   map[string]struct{}
	timetables                 map[string]struct{}
	lessons                    []Lesson
	subgroupsAssignments       []repo.InsertStagingSubgroupsAssignmentsParams
	teacherLocationAssignments []repo.InsertStagingTeacherLocationAssignmentsParams
}

func NewParser() *Parser {
	return &Parser{
		subgroups:                  make(map[string]struct{}),
		teachers:                   make(map[string]struct{}),
		locations:                  make(map[string]struct{}),
		subjects:                   make(map[string]struct{}),
		timetables:                 make(map[string]struct{}),
		lessons:                    make([]Lesson, 0),
		subgroupsAssignments:       make([]repo.InsertStagingSubgroupsAssignmentsParams, 0),
		teacherLocationAssignments: make([]repo.InsertStagingTeacherLocationAssignmentsParams, 0),
	}
}

func (x *Parser) addSubgroup(name string) { x.subgroups[name] = struct{}{} }
func (x *Parser) Subgroups() []string     { return slices.Collect(maps.Keys(x.subgroups)) }

func (x *Parser) addTeacher(name string) { x.teachers[name] = struct{}{} }
func (x *Parser) Teachers() []string     { return slices.Collect(maps.Keys(x.teachers)) }

func (x *Parser) addLocation(name string) { x.locations[name] = struct{}{} }
func (x *Parser) Locations() []string     { return slices.Collect(maps.Keys(x.locations)) }

func (x *Parser) addSubject(name string) { x.subjects[name] = struct{}{} }
func (x *Parser) Subjects() []string     { return slices.Collect(maps.Keys(x.subjects)) }

func (x *Parser) addTimetable(name string) { x.timetables[name] = struct{}{} }
func (x *Parser) Timetables() []string     { return slices.Collect(maps.Keys(x.timetables)) }

func (x *Parser) GetLessonsInsertParams() []repo.InsertStagingLessonsParams {
	params := make([]repo.InsertStagingLessonsParams, len(x.lessons))
	for i, lesson := range x.lessons {
		params[i] = lesson.InsertParams()
	}
	return params
}

func (x *Parser) GetSubgroupsAssignments() []repo.InsertStagingSubgroupsAssignmentsParams {
	return x.subgroupsAssignments
}

func (x *Parser) GetTeacherLocationAssignments() []repo.InsertStagingTeacherLocationAssignmentsParams {
	return x.teacherLocationAssignments
}

func (x *Parser) ParseLessonsFromBytes(b []byte) error {
	file, err := excelize.OpenReader(bytes.NewReader(b))
	if err != nil {
		return err
	}
	defer file.Close()

	timetableName, err := getTimetableTitle(file)
	if err != nil {
		return err
	}

	mergeCells, err := file.GetMergeCells(sheetName)
	if err != nil {
		return err
	}

	allLessons := make([]Lesson, 0)

	endOfGroups, err := getEndOfGroups(file)
	if err != nil {
		return err
	}

	for colIndex := firstSubgroupCol; colIndex < endOfGroups; colIndex += 2 {
		subgroupsCount := 1
		isDuplicate, err := isDuplicateSubgroup(file, colIndex)
		if err != nil {
			return err
		}
		if isDuplicate {
			subgroupsCount++
		}

		for i := 0; i < subgroupsCount; i++ {
			subgroup, err := getSubgroupName(file, colIndex+i, subgroupsCount)
			if err != nil {
				return err
			}
			pending := &pendingData{}
			lessons, err := x.parseSubgroupLessons(file, mergeCells, colIndex+i, subgroup, timetableName, pending)
			if err != nil {
				return err
			}

			allLessons = append(allLessons, lessons...)
			x.addSubgroup(subgroup)
			x.subgroupsAssignments = append(x.subgroupsAssignments, pending.subgroupsAssignments...)
			x.teacherLocationAssignments = append(x.teacherLocationAssignments, pending.teacherLocationAssignments...)
		}
	}

	x.lessons = append(x.lessons, allLessons...)
	x.addTimetable(timetableName)
	return nil
}

func getEndOfGroups(file *excelize.File) (int, error) {
	for col := firstSubgroupCol; ; col++ {
		cell, err := excelize.CoordinatesToCellName(col, subgroupRow)
		if err != nil {
			return 0, err
		}
		value, err := file.GetCellValue(sheetName, cell)
		if err != nil {
			return 0, err
		}

		if value == "" {
			return col, nil
		}
	}
}

func isDuplicateSubgroup(file *excelize.File, colIndex int) (bool, error) {
	for row := firstLessonRow; row <= lastLessonRow; row++ {
		cell1, err := excelize.CoordinatesToCellName(colIndex, row)
		if err != nil {
			return false, err
		}
		value1, err := file.GetCellValue(sheetName, cell1)
		if err != nil {
			return false, err
		}
		cell2, err := excelize.CoordinatesToCellName(colIndex+1, row)
		if err != nil {
			return false, err
		}
		value2, err := file.GetCellValue(sheetName, cell2)
		if err != nil {
			return false, err
		}
		if value1 != value2 {
			return true, nil
		}
	}
	return false, nil
}

func getTimetableTitle(file *excelize.File) (string, error) {
	timetable, err := file.GetCellValue(sheetName, timetableCellName)
	if err != nil {
		return "", fmt.Errorf("failed to get timetable title: %w", err)
	}
	return timetable, nil
}

func getSubgroupName(file *excelize.File, colIndex, subgroupCount int) (string, error) {
	cellName, err := excelize.CoordinatesToCellName(colIndex, subgroupRow)
	if err != nil {
		return "", fmt.Errorf("failed to get subgroup cell name: %w", err)
	}

	subgroup, err := file.GetCellValue(sheetName, cellName)
	if err != nil {
		return "", fmt.Errorf("failed to get subgroup value: %w", err)
	}

	subgroup = removeAllSpaces(subgroup)

	if !strings.Contains(subgroup, "пг") && subgroupCount != 1 {
		subgroupNumber := 2 - colIndex%2
		subgroup += fmt.Sprintf("(%dпг)", subgroupNumber)
	}

	return subgroup, nil
}

func (x *Parser) parseSubgroupLessons(
	file *excelize.File,
	mergeCells []excelize.MergeCell,
	colIndex int,
	subgroupName, timetableName string,
	pending *pendingData,
) ([]Lesson, error) {
	day := 0
	lessons := make([]Lesson, 0)

	for rowIndex := firstLessonRow; rowIndex <= lastLessonRow; rowIndex++ {
		if (rowIndex-firstLessonRow)%lessonsPerDay == 0 {
			day++
		}

		lessonData, err := x.parseLessonCell(file, mergeCells, colIndex, rowIndex, subgroupName, timetableName, day, pending)
		if err != nil {
			return nil, err
		}

		lessons = append(lessons, lessonData...)
	}

	return lessons, nil
}

func (x *Parser) parseLessonCell(
	file *excelize.File,
	mergeCells []excelize.MergeCell,
	colIndex, rowIndex int,
	subgroupName, timetableName string,
	day int,
	pending *pendingData,
) ([]Lesson, error) {
	cellName, err := excelize.CoordinatesToCellName(colIndex, rowIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get cell coordinates: %w", err)
	}

	rawValue, err := file.GetCellValue(sheetName, cellName)
	if err != nil || rawValue == "" {
		return nil, nil
	}

	rawValue = normalizeSpaces(rawValue)

	repeatRule, shouldSkip := determineRepeatRule(mergeCells, colIndex, rowIndex)
	if shouldSkip {
		return nil, nil
	}

	timeStart, err := getLessonStartTime(file, rowIndex)
	if err != nil {
		return nil, err
	}

	lessonNames := strings.Split(rawValue, " / ")
	lessons := make([]Lesson, 0, len(lessonNames))

	for _, lessonName := range lessonNames {
		lesson, err := x.parseLesson(lessonName, subgroupName, timetableName, day, timeStart, repeatRule, pending)
		if err != nil {
			return nil, err
		}
		lessons = append(lessons, *lesson)
	}

	return lessons, nil
}

func (x *Parser) parseLesson(
	rawName, subgroupName, timetableName string,
	day int,
	defaultStartTime time.Time,
	repeatRule int,
	pending *pendingData,
) (*Lesson, error) {
	stagingID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	insertParams := repo.InsertStagingLessonsParams{
		StagingID:  stagingID,
		Subject:    rawName,
		Category:   unknownValue,
		Day:        int32(day),
		TimeStart:  timeToMinutes(defaultStartTime),
		TimeEnd:    timeToMinutes(defaultStartTime) + int32(lessonDuration.Minutes()),
		RepeatRule: int32(repeatRule),
		Timetable:  timetableName,
	}

	pending.subgroupsAssignments = append(pending.subgroupsAssignments, repo.InsertStagingSubgroupsAssignmentsParams{
		StagingID: stagingID,
		Subgroup:  subgroupName,
	})

	matches := regexTimeNameType.FindStringSubmatch(rawName)
	if matches == nil {
		x.addSubject(rawName)
		x.addLocation(unknownValue)
		x.addTeacher(unknownValue)
		pending.teacherLocationAssignments = append(pending.teacherLocationAssignments, repo.InsertStagingTeacherLocationAssignmentsParams{
			StagingID: stagingID,
			Teacher:   unknownValue,
			Location:  unknownValue,
		})
		return &Lesson{rawName: rawName, insertParams: insertParams}, nil
	}

	startTime := defaultStartTime
	if matches[1] != "" {
		startTime, err = time.Parse("15:04", matches[1])
		if err != nil {
			return nil, fmt.Errorf("failed to parse lesson time: %w", err)
		}
	}

	insertParams.Subject = matches[2]
	x.addSubject(matches[2])
	insertParams.Category = matches[3]
	insertParams.TimeStart = timeToMinutes(startTime)
	insertParams.TimeEnd = timeToMinutes(startTime) + int32(lessonDuration.Minutes())

	for _, assignment := range parseTeacherLocations(matches[4]) {
		x.addTeacher(assignment.Teacher())
		x.addLocation(assignment.Location())
		pending.teacherLocationAssignments = append(pending.teacherLocationAssignments, repo.InsertStagingTeacherLocationAssignmentsParams{
			StagingID: stagingID,
			Teacher:   assignment.Teacher(),
			Location:  assignment.Location(),
		})
	}

	return &Lesson{rawName: rawName, insertParams: insertParams}, nil
}

func getLessonStartTime(file *excelize.File, rowIndex int) (time.Time, error) {
	cellName, err := excelize.CoordinatesToCellName(timeColumnIndex, rowIndex)
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to get time cell name: %w", err)
	}

	cellValue, err := file.GetCellValue(sheetName, cellName)
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to get time value: %w", err)
	}

	timeStart, err := time.Parse("15:04", cellValue)
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to parse time '%s': %w", cellValue, err)
	}

	return timeStart, nil
}

func determineRepeatRule(mergeCells []excelize.MergeCell, colIndex, rowIndex int) (repeatRule int, shouldSkip bool) {
	mergeHeight := getCellMergeHeight(mergeCells, colIndex, rowIndex)

	if mergeHeight == 2 {
		if rowIndex%2 != 0 {
			return 0, true
		}
		return 0, false
	}

	return rowIndex%2 + 1, false
}

func getCellMergeHeight(mergeCells []excelize.MergeCell, colIndex, rowIndex int) int {
	for _, mergeCell := range mergeCells {
		if isCellInMergeRange(mergeCell, colIndex, rowIndex) {
			_, y1, _ := excelize.CellNameToCoordinates(mergeCell.GetStartAxis())
			_, y2, _ := excelize.CellNameToCoordinates(mergeCell.GetEndAxis())
			return y2 - y1 + 1
		}
	}
	return 1
}

func isCellInMergeRange(mergeCell excelize.MergeCell, colIndex, rowIndex int) bool {
	x1, y1, err := excelize.CellNameToCoordinates(mergeCell.GetStartAxis())
	if err != nil {
		return false
	}

	x2, y2, err := excelize.CellNameToCoordinates(mergeCell.GetEndAxis())
	if err != nil {
		return false
	}

	return x1 <= colIndex && colIndex <= x2 && y1 <= rowIndex && rowIndex <= y2
}

type TeacherLocationAssignment struct {
	teacher  string
	location string
}

func NewTeacherLocationAssignment(teacher, location string) *TeacherLocationAssignment {
	return &TeacherLocationAssignment{
		teacher:  strings.TrimSpace(teacher),
		location: strings.TrimSpace(location),
	}
}

func (t *TeacherLocationAssignment) Teacher() string      { return t.teacher }
func (t *TeacherLocationAssignment) Location() string     { return t.location }
func (t *TeacherLocationAssignment) SetTeacher(v string)  { t.teacher = strings.TrimSpace(v) }
func (t *TeacherLocationAssignment) SetLocation(v string) { t.location = strings.TrimSpace(v) }

func parseTeacherLocations(teachersLocationString string) []TeacherLocationAssignment {
	roleMatches := regexTeacherRole.FindAllStringSubmatchIndex(teachersLocationString, -1)

	if roleMatches == nil {
		return []TeacherLocationAssignment{*NewTeacherLocationAssignment(unknownValue, unknownValue)}
	}

	assignments := make([]TeacherLocationAssignment, 0, len(roleMatches))

	for i, roleMatch := range roleMatches {
		startIdx := roleMatch[0]
		endIdx := len(teachersLocationString)
		if i < len(roleMatches)-1 {
			endIdx = roleMatches[i+1][0]
		}

		teacher, location := extractTeacherAndLocation(teachersLocationString[startIdx:endIdx])
		assignments = append(assignments, *NewTeacherLocationAssignment(teacher, location))
	}

	slices.SortFunc(assignments, func(a, b TeacherLocationAssignment) int {
		if a.teacher != b.teacher {
			return strings.Compare(a.teacher, b.teacher)
		}
		return strings.Compare(a.location, b.location)
	})

	return assignments
}

func extractTeacherAndLocation(segment string) (teacher, location string) {
	matches := regexTeacherLocation.FindStringSubmatch(segment)
	if matches == nil || len(matches) < 3 {
		return unknownValue, unknownValue
	}

	teacher = strings.TrimSpace(matches[1])
	location = strings.TrimSpace(matches[2])
	if teacher == "" {
		teacher = unknownValue
	}
	if location == "" {
		location = unknownValue
	}
	return
}

func normalizeSpaces(s string) string {
	return strings.Join(strings.Fields(s), " ")
}

func removeAllSpaces(s string) string {
	return strings.Map(func(r rune) rune {
		if strings.ContainsRune(" \t\n\r", r) {
			return -1
		}
		return r
	}, s)
}

func timeToMinutes(t time.Time) int32 {
	return int32(t.Hour()*60 + t.Minute())
}
