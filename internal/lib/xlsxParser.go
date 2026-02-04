package lib

import (
	"bytes"
	"fmt"
	"regexp"
	"slices"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// Configuration constants
const (
	sheetName         = "Лист1"
	timetableCellName = "A1"
	lessonDuration    = 90 * time.Minute
	lessonsPerDay     = 12
	unknownValue      = "Unknown"
)

// Column and row boundaries
const (
	firstSubgroupCol  = 3
	secondSubgroupCol = 4
	firstLessonRow    = 4
	lastLessonRow     = 75
	subgroupRow       = 3
	timeColumnIndex   = 2
)

// Regular expression patterns
var (
	regexTimeNameType    = regexp.MustCompile(`([0-9]{1,2}:[0-9]{1,2})* *(.+?) (\(лек\)|\(пр\)|\(лаб\)|\(кср\)) (.*)`)
	regexTeacherRole     = regexp.MustCompile(`(асс\.)|(доц\.)|(зав\.)|(куратор)|(научный руководитель)|(ст\. *пр\.)|(пр\.)|(преп\.)|(проф\.)|(профессор)|(тренер-преподаватель)`)
	regexTeacherLocation = regexp.MustCompile(`(.*?(?:[А-Я]\.)+) *(.*)`)
)

// TeacherLocationAssignment represents a teacher assigned to a specific location
type TeacherLocationAssignment struct {
	teacher  string
	location string
}

func NewTeacherLocationAssignment(teacher string, location string) *TeacherLocationAssignment {
	return &TeacherLocationAssignment{teacher: strings.TrimSpace(teacher), location: strings.TrimSpace(location)}
}

func (t *TeacherLocationAssignment) Teacher() string {
	return t.teacher
}

func (t *TeacherLocationAssignment) SetTeacher(teacher string) {
	t.teacher = strings.TrimSpace(teacher)
}

func (t *TeacherLocationAssignment) Location() string {
	return t.location
}

func (t *TeacherLocationAssignment) SetLocation(location string) {
	t.location = strings.TrimSpace(location)
}

// Lesson represents a single lesson with all its properties
type Lesson struct {
	rawName                    string
	subgroup                   string
	subject                    string
	category                   string
	day                        int
	timeStart                  int // minutes from midnight
	timeEnd                    int // minutes from midnight
	repeatRule                 int // 0 = every week, 1 = odd weeks, 2 = even weeks
	teacherLocationAssignments []TeacherLocationAssignment
}

func (l *Lesson) RawName() string {
	return l.rawName
}

func (l *Lesson) SetRawName(rawName string) {
	l.rawName = strings.TrimSpace(rawName)
}

func (l *Lesson) Subgroup() string {
	return l.subgroup
}

func (l *Lesson) SetSubgroup(subgroup string) {
	l.subgroup = strings.TrimSpace(subgroup)
}

func (l *Lesson) Subject() string {
	return l.subject
}

func (l *Lesson) SetSubject(subject string) {
	l.subject = strings.TrimSpace(subject)
}

func (l *Lesson) Category() string {
	return l.category
}

func (l *Lesson) SetCategory(category string) {
	l.category = strings.TrimSpace(category)
}

func (l *Lesson) Day() int {
	return l.day
}

func (l *Lesson) SetDay(day int) {
	l.day = day
}

func (l *Lesson) TimeStart() int {
	return l.timeStart
}

func (l *Lesson) SetTimeStart(timeStart int) {
	l.timeStart = timeStart
}

func (l *Lesson) TimeEnd() int {
	return l.timeEnd
}

func (l *Lesson) SetTimeEnd(timeEnd int) {
	l.timeEnd = timeEnd
}

func (l *Lesson) RepeatRule() int {
	return l.repeatRule
}

func (l *Lesson) SetRepeatRule(repeatRule int) {
	l.repeatRule = repeatRule
}

func (l *Lesson) TeacherLocationAssignments() []TeacherLocationAssignment {
	return l.teacherLocationAssignments
}

func (l *Lesson) SetTeacherLocationAssignments(teacherLocationAssignments []TeacherLocationAssignment) {
	l.teacherLocationAssignments = teacherLocationAssignments
}

// ParsedXlsx represents the complete parsed timetable
type ParsedXlsx struct {
	lessons   []Lesson
	timetable string
}

func (p *ParsedXlsx) Lessons() []Lesson {
	return p.lessons
}

func (p *ParsedXlsx) SetLessons(lessons []Lesson) {
	p.lessons = lessons
}

func (p *ParsedXlsx) Timetable() string {
	return p.timetable
}

func (p *ParsedXlsx) SetTimetable(timetable string) {
	p.timetable = timetable
}

// XlsxParser handles parsing of Excel timetable files
type XlsxParser struct{}

// NewXlsxParser creates a new parser instance
func NewXlsxParser() *XlsxParser {
	return &XlsxParser{}
}

// ParseXlsx parses the Excel file and returns structured lesson data
func ParseXlsx(xlsxData []byte) (*ParsedXlsx, error) {
	file, err := OpenXlsxFile(xlsxData)
	if err != nil {
		return nil, err
	}

	parser := NewXlsxParser()
	return parser.Parse(file)
}

// OpenXlsxFile opens an Excel file from byte data
func OpenXlsxFile(xlsxData []byte) (*excelize.File, error) {
	reader := bytes.NewReader(xlsxData)
	file, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to open xlsx file: %w", err)
	}
	return file, nil
}

// Parse executes the parsing process for the given file
func (p *XlsxParser) Parse(file *excelize.File) (*ParsedXlsx, error) {
	timetable, err := p.getTimetableTitle(file)
	if err != nil {
		return nil, err
	}

	lessons, err := p.parseAllLessons(file)
	if err != nil {
		return nil, err
	}

	parsedXlsx := new(ParsedXlsx)
	parsedXlsx.SetLessons(lessons)
	parsedXlsx.SetTimetable(timetable)
	return parsedXlsx, nil
}

// getTimetableTitle retrieves the timetable title from the spreadsheet
func (p *XlsxParser) getTimetableTitle(file *excelize.File) (string, error) {
	timetable, err := file.GetCellValue(sheetName, timetableCellName)
	if err != nil {
		return "", fmt.Errorf("failed to get timetable title: %w", err)
	}
	return timetable, nil
}

// parseAllLessons parses lessons from all subgroups
func (p *XlsxParser) parseAllLessons(file *excelize.File) ([]Lesson, error) {
	var allLessons []Lesson

	for colIndex := firstSubgroupCol; colIndex <= secondSubgroupCol; colIndex++ {
		subgroupName, err := p.getSubgroupName(file, colIndex)
		if err != nil {
			return nil, err
		}

		lessons, err := p.parseSubgroupLessons(file, colIndex, subgroupName)
		if err != nil {
			return nil, err
		}

		// Only add lessons if they differ from already added ones
		if !p.isDuplicateSubgroup(allLessons, lessons) {
			allLessons = append(allLessons, lessons...)
		}
	}

	return allLessons, nil
}

// getSubgroupName retrieves and normalizes the subgroup name
func (p *XlsxParser) getSubgroupName(file *excelize.File, colIndex int) (string, error) {
	cellName, err := excelize.CoordinatesToCellName(colIndex, subgroupRow)
	if err != nil {
		return "", fmt.Errorf("failed to get subgroup cell name: %w", err)
	}

	subgroup, err := file.GetCellValue(sheetName, cellName)
	if err != nil {
		return "", fmt.Errorf("failed to get subgroup value: %w", err)
	}

	subgroup = removeAllSpaces(subgroup)

	// Add subgroup number if not present
	if !strings.Contains(subgroup, "пг") {
		subgroupNumber := colIndex - 2
		subgroup += fmt.Sprintf("(%dпг)", subgroupNumber)
	}

	return subgroup, nil
}

// parseSubgroupLessons parses all lessons for a specific subgroup
func (p *XlsxParser) parseSubgroupLessons(file *excelize.File, colIndex int, subgroupName string) ([]Lesson, error) {
	var lessons []Lesson
	day := 0

	for rowIndex := firstLessonRow; rowIndex <= lastLessonRow; rowIndex++ {
		// Calculate current day based on row position
		if (rowIndex-firstLessonRow)%lessonsPerDay == 0 {
			day++
		}

		lessonData, err := p.parseLessonCell(file, colIndex, rowIndex, subgroupName, day)
		if err != nil {
			return nil, err
		}

		lessons = append(lessons, lessonData...)
	}

	return lessons, nil
}

// parseLessonCell parses a single cell that may contain one or more lessons
func (p *XlsxParser) parseLessonCell(file *excelize.File, colIndex, rowIndex int, subgroupName string, day int) ([]Lesson, error) {
	cellName, err := excelize.CoordinatesToCellName(colIndex, rowIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to get cell coordinates: %w", err)
	}

	rawValue, err := file.GetCellValue(sheetName, cellName)
	if err != nil || rawValue == "" {
		return nil, nil // Empty cell is not an error
	}

	rawValue = normalizeSpaces(rawValue)

	// Determine repeat rule based on cell merge
	repeatRule, shouldSkip, err := p.determineRepeatRule(file, colIndex, rowIndex)
	if err != nil {
		return nil, err
	}
	if shouldSkip {
		return nil, nil
	}

	// Get lesson start time
	timeStart, err := p.getLessonStartTime(file, rowIndex)
	if err != nil {
		return nil, err
	}

	// Parse multiple lessons separated by " / "
	lessonNames := strings.Split(rawValue, " / ")
	var lessons []Lesson

	for _, lessonName := range lessonNames {
		lesson, err := p.parseLesson(lessonName, subgroupName, day, timeStart, repeatRule)
		if err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}

	return lessons, nil
}

// determineRepeatRule calculates the repeat rule based on cell merge height
func (p *XlsxParser) determineRepeatRule(file *excelize.File, colIndex, rowIndex int) (repeatRule int, shouldSkip bool, err error) {
	mergeHeight, err := p.getCellMergeHeight(file, colIndex, rowIndex)
	if err != nil {
		return 0, false, err
	}

	// If cell spans 2 rows, lesson repeats every week
	if mergeHeight == 2 {
		// Skip odd rows to avoid duplicates
		if rowIndex%2 != 0 {
			return 0, true, nil
		}
		return 0, false, nil
	}

	// Single-row cells alternate weekly (1 = odd, 2 = even)
	repeatRule = rowIndex%2 + 1
	return repeatRule, false, nil
}

// getLessonStartTime retrieves the start time for a lesson from the time column
func (p *XlsxParser) getLessonStartTime(file *excelize.File, rowIndex int) (time.Time, error) {
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

// parseLesson parses a single lesson string into a Lesson struct
func (p *XlsxParser) parseLesson(rawName, subgroupName string, day int, defaultStartTime time.Time, repeatRule int) (Lesson, error) {
	matches := regexTimeNameType.FindStringSubmatch(rawName)

	lesson := new(Lesson)
	lesson.SetRawName(rawName)
	lesson.SetSubgroup(subgroupName)
	lesson.SetDay(day)
	lesson.SetRepeatRule(repeatRule)

	// If regex doesn't match, create a minimal lesson
	if matches == nil {
		teacherLocationAssignment := NewTeacherLocationAssignment(unknownValue, unknownValue)
		teacherLocationAssignments := make([]TeacherLocationAssignment, 1)
		teacherLocationAssignments[0] = *teacherLocationAssignment
		lesson.SetSubject(rawName)
		lesson.SetCategory(unknownValue)
		lesson.SetTimeStart(timeToMinutes(defaultStartTime))
		lesson.SetTimeEnd(timeToMinutes(defaultStartTime) + int(lessonDuration.Minutes()))
		lesson.SetTeacherLocationAssignments(teacherLocationAssignments)

		return *lesson, nil
	}

	// Parse time if present in lesson string
	startTime := defaultStartTime
	if matches[1] != "" {
		var err error
		startTime, err = time.Parse("15:04", matches[1])
		if err != nil {
			return *lesson, fmt.Errorf("failed to parse lesson time: %w", err)
		}
	}

	lesson.SetSubject(matches[2])
	lesson.SetCategory(matches[3])
	lesson.SetTimeStart(timeToMinutes(startTime))
	lesson.SetTimeEnd(lesson.TimeStart() + int(lessonDuration.Minutes()))
	lesson.SetTeacherLocationAssignments(parseTeacherLocations(matches[4]))

	return *lesson, nil
}

// parseTeacherLocations extracts teacher and location information
func parseTeacherLocations(teachersLocationString string) []TeacherLocationAssignment {
	roleMatches := regexTeacherRole.FindAllStringSubmatchIndex(teachersLocationString, -1)

	if roleMatches == nil {
		teacherLocationAssignment := NewTeacherLocationAssignment(unknownValue, unknownValue)
		teacherLocationAssignments := make([]TeacherLocationAssignment, 1)
		teacherLocationAssignments[0] = *teacherLocationAssignment
		return teacherLocationAssignments
	}

	var assignments []TeacherLocationAssignment

	for i, roleMatch := range roleMatches {
		startIdx := roleMatch[0]
		endIdx := len(teachersLocationString)

		if i < len(roleMatches)-1 {
			endIdx = roleMatches[i+1][0]
		}

		segment := teachersLocationString[startIdx:endIdx]
		teacher, location := extractTeacherAndLocation(segment)

		teacherLocationAssignment := NewTeacherLocationAssignment(teacher, location)
		assignments = append(assignments, *teacherLocationAssignment)
	}

	return assignments
}

// extractTeacherAndLocation splits a segment into teacher and location
func extractTeacherAndLocation(segment string) (teacher, location string) {
	matches := regexTeacherLocation.FindStringSubmatch(segment)
	if matches == nil || len(matches) < 3 {
		return unknownValue, unknownValue
	}

	teacher = matches[1]
	location = matches[2]
	if teacher == "" {
		teacher = unknownValue
	}
	if location == "" {
		location = unknownValue
	}
	return
}

// getCellMergeHeight returns the height of a merged cell region
func (p *XlsxParser) getCellMergeHeight(file *excelize.File, colIndex, rowIndex int) (int, error) {
	mergeCells, err := file.GetMergeCells(sheetName)
	if err != nil {
		return 0, fmt.Errorf("failed to get merged cells: %w", err)
	}

	for _, mergeCell := range mergeCells {
		if p.isCellInMergeRange(mergeCell, colIndex, rowIndex) {
			_, y1, _ := excelize.CellNameToCoordinates(mergeCell.GetStartAxis())
			_, y2, _ := excelize.CellNameToCoordinates(mergeCell.GetEndAxis())
			return y2 - y1 + 1, nil
		}
	}

	return 1, nil
}

// isCellInMergeRange checks if a cell is within a merge range
func (p *XlsxParser) isCellInMergeRange(mergeCell excelize.MergeCell, colIndex, rowIndex int) bool {
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

// isDuplicateSubgroup checks if lessons are duplicates
func (p *XlsxParser) isDuplicateSubgroup(existing, new []Lesson) bool {
	return slices.EqualFunc(existing, new, func(a, b Lesson) bool {
		return a.RawName() == b.RawName()
	})
}

// Utility functions

// normalizeSpaces replaces all whitespace characters with regular spaces
func normalizeSpaces(s string) string {
	return strings.Join(strings.Fields(s), " ")
}

// removeAllSpaces removes all whitespace characters from a string
func removeAllSpaces(s string) string {
	return strings.Map(func(r rune) rune {
		if strings.ContainsRune(" \t\n\r", r) {
			return -1
		}
		return r
	}, s)
}

// timeToMinutes converts a time.Time to minutes since midnight
func timeToMinutes(t time.Time) int {
	return t.Hour()*60 + t.Minute()
}
