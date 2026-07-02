import {
  useCallback, useEffect, useMemo, useState,
} from 'react';

import { Spinner } from '@openedx/paragon';

import { fetchGateCallsApi, fetchOraDetailsApi } from '../data/api';
import type {
  ApiCourse,
  ApiGateCall,
  ApiPracticeAssignment,
  ApiStudent,
} from '../data/analyticsData';
import {
  buildFallbackGateCalls,
  formatGateCallTimeRange,
  formatResidencyRange,
  getCourseDrawerTabStatus,
  mapGateCallRecordToDrawer,
  mapOraDetailRecordToAssignment,
  pickPrimaryCoursesForDrawer,
  studentDisplayName,
  sumPracticeAssignmentScores,
} from '../data/analyticsData';
import StudentOverviewBar from './StudentOverviewBar';

export type StudentDetailViewProps = {
  student: ApiStudent;
  initialCourseCode?: string | null;
  variant?: 'drawer' | 'page';
  onClose?: () => void;
};

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path
      d="M4.2 4.2 13.8 13.8M13.8 4.2 4.2 13.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const CALL_STATUS_LABELS: Record<string, string> = {
  cancelled: 'Cancelled',
  mentor_absent: 'Mentor Absent',
  student_absent: 'Student Absent',
  rescheduled: 'Rescheduled',
  reschedule_needed: 'Reschedule Needed',
  good_to_proceed: 'Good to Proceed',
  scheduled: 'Scheduled',
  completed: 'Completed',
};

const callStatusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'scheduled') {
    return 'call-status--scheduled';
  }
  if (normalized === 'reschedule_needed' || normalized === 'good_to_proceed' || normalized === 'completed') {
    return 'call-status--positive';
  }
  return 'call-status--neutral';
};

const callStatusLabel = (status: string) => (
  CALL_STATUS_LABELS[status.toLowerCase()] ?? status.replace(/_/g, ' ')
);

type CourseDetailState = {
  assignments: ApiPracticeAssignment[];
  gateCalls: ApiGateCall[];
  loading: boolean;
  fetched: boolean;
};

const getCourseKey = (course: ApiCourse) => course.course_id ?? course.course_code;

const PracticeAssignmentRow = ({
  assignment,
  index,
}: {
  assignment: ApiPracticeAssignment;
  index: number;
}) => {
  const score = assignment.score != null && assignment.max_score != null
    ? `${assignment.score}/${assignment.max_score}`
    : null;

  return (
    <div className="drawer-list-row">
      <div className="drawer-list-row-main">
        <strong>{assignment.title || `Practice ${index + 1}`}</strong>
        <div className="drawer-status-row">
          {assignment.submitted && <span className="drawer-status-chip drawer-status-chip--submitted">Submitted</span>}
          {assignment.reviewed && <span className="drawer-status-chip drawer-status-chip--reviewed">Reviewed</span>}
        </div>
      </div>
      {score && <span className="drawer-score">{score}</span>}
    </div>
  );
};

const GateCallRow = ({ call }: { call: ApiGateCall }) => {
  const timeLabel = formatGateCallTimeRange(call.start_time, call.end_time);
  return (
    <div className="drawer-list-row drawer-list-row--call">
      <div className="drawer-list-row-main">
        <strong>{call.title}</strong>
        {timeLabel && <span className="drawer-call-time">{timeLabel}</span>}
      </div>
      <span className={`drawer-call-status ${callStatusClass(call.status)}`}>
        {callStatusLabel(call.status)}
      </span>
    </div>
  );
};

type CourseDetailContentProps = {
  course: ApiCourse;
  detail?: CourseDetailState;
  layout?: 'page' | 'drawer';
};

const CourseDetailContent = ({ course, detail, layout = 'drawer' }: CourseDetailContentProps) => {
  const isPageLayout = layout === 'page';
  const assignments = detail?.assignments ?? course.assignments ?? [];
  const gateCalls = (() => {
    const fromDetail = detail?.gateCalls ?? course.gate_calls ?? [];
    if (fromDetail.length > 0) {
      return fromDetail;
    }
    return buildFallbackGateCalls(course);
  })();

  const ora = course.ora;
  const assignmentScore = assignments.length > 0
    ? sumPracticeAssignmentScores(assignments)
    : null;
  const practiceScore = assignmentScore && assignmentScore.possible > 0
    ? `${assignmentScore.earned}/${assignmentScore.possible}`
    : (ora && ora.points_total > 0 ? `${ora.points_obtained}/${ora.points_total}` : null);

  const tabStatus = getCourseDrawerTabStatus(course);
  const courseCode = course.course_code.toUpperCase();
  const mentorLabel = course.mentor && course.mentor !== '-'
    ? `Mentor: ${course.mentor}`
    : 'No mentor assigned';

  return (
    <article className={[
      'student-detail-course-block',
      isPageLayout ? 'student-detail-course-block--page' : `student-detail-course-block--${tabStatus}`,
    ].join(' ')}>
      <div className="drawer-course-heading">
        {isPageLayout ? (
          <>
            <h3>{course.course_name ?? course.course_code}</h3>
            <p>{mentorLabel}</p>
          </>
        ) : (
          <>
            <div className="drawer-course-heading-top">
              <span className={`drawer-course-code drawer-course-code--${tabStatus}`}>{courseCode}</span>
              <h3>{course.course_name ?? course.course_code}</h3>
            </div>
            <p>{mentorLabel}</p>
          </>
        )}
      </div>

      {detail?.loading && (
        <div className="drawer-loading" aria-live="polite">
          <Spinner animation="border" screenReaderText={`Loading ${courseCode} details`} />
        </div>
      )}

      <section className="drawer-section drawer-section--practice">
        <div className="drawer-section-header">
          <h4>Practice Questions</h4>
          {!isPageLayout && practiceScore && (
            <span className="drawer-section-score">{practiceScore}</span>
          )}
        </div>
        <div className="drawer-section-card">
          {assignments.length > 0 ? (
            assignments.map((assignment, index) => (
              <PracticeAssignmentRow
                key={assignment.id ?? `${assignment.title}-${index}`}
                assignment={assignment}
                index={index}
              />
            ))
          ) : (
            <div className={isPageLayout ? 'drawer-empty-copy drawer-empty-copy--centered' : 'drawer-summary-row'}>
              {!isPageLayout && ora && ora.total > 0 ? (
                <>
                  <span>{`${ora.submitted} submitted · ${ora.graded} reviewed · ${ora.total} total`}</span>
                  {practiceScore && <span className="drawer-score">{practiceScore}</span>}
                </>
              ) : isPageLayout && ora && ora.total > 0 ? (
                <span>{`${ora.submitted} submitted · ${ora.graded} reviewed · ${ora.total} total`}</span>
              ) : (
                'No practice questions for this course yet.'
              )}
            </div>
          )}
        </div>
      </section>

      <section className="drawer-section drawer-section--calls">
        <div className="drawer-section-header">
          <h4>Calls</h4>
          {course.gate.total > 0 && (
            <span className="drawer-section-meta">
              {`${course.gate.completed}/${course.gate.total} completed`}
            </span>
          )}
        </div>
        <div className="drawer-section-card">
          {gateCalls.length > 0 ? (
            gateCalls.map((call, index) => (
              <GateCallRow key={call.id ?? `${call.title}-${index}`} call={call} />
            ))
          ) : (
            <div className="drawer-empty-copy">No calls recorded for this course yet.</div>
          )}
        </div>
      </section>
    </article>
  );
};

const StudentDetailView = ({
  student,
  initialCourseCode = null,
  variant = 'drawer',
  onClose,
}: StudentDetailViewProps) => {
  const isPage = variant === 'page';
  const courses = useMemo(() => pickPrimaryCoursesForDrawer(student.courses), [student.courses]);
  const [activeCourseCode, setActiveCourseCode] = useState(() => {
    const preferred = initialCourseCode?.toUpperCase();
    if (preferred && courses.some((course) => course.course_code.toUpperCase() === preferred)) {
      return preferred;
    }
    return courses[0]?.course_code.toUpperCase() ?? '';
  });
  const [detailByCourseId, setDetailByCourseId] = useState<Record<string, CourseDetailState>>({});

  const activeCourse = useMemo(
    () => courses.find((course) => course.course_code.toUpperCase() === activeCourseCode) ?? courses[0] ?? null,
    [activeCourseCode, courses],
  );

  useEffect(() => {
    if (isPage) {
      return;
    }
    const preferred = initialCourseCode?.toUpperCase();
    const nextCode = preferred && courses.some((course) => course.course_code.toUpperCase() === preferred)
      ? preferred
      : courses[0]?.course_code.toUpperCase() ?? '';
    setActiveCourseCode(nextCode);
    setDetailByCourseId({});
  }, [student.id, courses, initialCourseCode, isPage]);

  useEffect(() => {
    if (!onClose) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadCourseDetail = useCallback(async (course: ApiCourse) => {
    const courseKey = getCourseKey(course);
    if (!courseKey) {
      return;
    }

    setDetailByCourseId((prev) => {
      const cached = prev[courseKey];
      if (cached?.fetched || cached?.loading) {
        return prev;
      }
      return {
        ...prev,
        [courseKey]: {
          assignments: cached?.assignments ?? course.assignments ?? [],
          gateCalls: cached?.gateCalls ?? course.gate_calls ?? [],
          loading: true,
          fetched: false,
        },
      };
    });

    let assignments = course.assignments ?? [];
    let gateCalls = course.gate_calls ?? [];

    if (course.course_id) {
      const detailRequests: Promise<void>[] = [];

      detailRequests.push(
        fetchOraDetailsApi({
          studentId: student.id,
          courseId: course.course_id,
        })
          .then((records) => {
            assignments = records.map(mapOraDetailRecordToAssignment);
          })
          .catch(() => {
            // Keep list/fallback data when ora-details fetch fails.
          }),
      );

      if (course.mentor_id) {
        detailRequests.push(
          fetchGateCallsApi({
            studentId: student.id,
            courseId: course.course_id,
            mentorId: course.mentor_id,
          })
            .then((records) => {
              gateCalls = records.map(mapGateCallRecordToDrawer);
            })
            .catch(() => {
              // Keep list/fallback data when gate-calls fetch fails.
            }),
        );
      }

      await Promise.all(detailRequests);
    }

    setDetailByCourseId((prev) => ({
      ...prev,
      [courseKey]: {
        assignments,
        gateCalls,
        loading: false,
        fetched: true,
      },
    }));
  }, [student.id]);

  const coursesToLoad = isPage ? courses : (activeCourse ? [activeCourse] : []);

  useEffect(() => {
    coursesToLoad.forEach((course) => {
      const courseKey = getCourseKey(course);
      const cached = detailByCourseId[courseKey];
      if (!cached?.fetched && !cached?.loading) {
        loadCourseDetail(course);
      }
    });
  }, [coursesToLoad, detailByCourseId, loadCourseDetail]);

  const residencyRange = formatResidencyRange(
    student.residency.start_date,
    student.residency.end_date,
  );

  const rootClassName = [
    'student-detail-view',
    isPage ? 'student-detail-view--page' : 'student-detail-drawer',
  ].join(' ');

  const activeDetail = activeCourse
    ? detailByCourseId[getCourseKey(activeCourse)]
    : undefined;

  const studentHeaderContent = (
    <>
      <h2>{studentDisplayName(student)}</h2>
      {student.residency.name && <p className="drawer-cohort">{student.residency.name}</p>}
      {residencyRange && <p className="drawer-cohort-dates">{residencyRange}</p>}
    </>
  );

  return (
    <aside className={rootClassName} aria-label={`Details for ${studentDisplayName(student)}`}>
      {!isPage && (
        <div className="student-detail-drawer-header">
          {onClose && (
            <button
              type="button"
              className="student-detail-drawer-close"
              onClick={onClose}
              aria-label="Close student details"
            >
              <CloseIcon />
            </button>
          )}
          {studentHeaderContent}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="student-detail-drawer-empty">No course enrollments found for this student.</div>
      ) : isPage ? (
        <>
          <div className="student-detail-page-header">
            <StudentOverviewBar student={student} />
          </div>
          <div className="student-detail-page-scroll" role="region" aria-label="Student courses">
            <div className="student-detail-page-track">
              {courses.map((course) => (
                <CourseDetailContent
                  key={getCourseKey(course)}
                  course={course}
                  detail={detailByCourseId[getCourseKey(course)]}
                  layout="page"
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="student-detail-drawer-tabs" role="tablist" aria-label="Courses">
            {courses.map((course) => {
              const code = course.course_code.toUpperCase();
              const isActive = code === activeCourseCode;
              const tabStatus = getCourseDrawerTabStatus(course);
              return (
                <button
                  key={getCourseKey(course)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={[
                    'drawer-course-tab',
                    `drawer-course-tab--${tabStatus}`,
                    isActive ? 'active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setActiveCourseCode(code)}
                >
                  {code}
                </button>
              );
            })}
          </div>

          {activeCourse && (
            <div className="student-detail-drawer-body">
              <CourseDetailContent course={activeCourse} detail={activeDetail} layout="drawer" />
            </div>
          )}
        </>
      )}
    </aside>
  );
};

export default StudentDetailView;
