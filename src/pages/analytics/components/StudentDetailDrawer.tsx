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

type StudentDetailDrawerProps = {
  student: ApiStudent;
  onClose: () => void;
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

const StudentDetailDrawer = ({ student, onClose }: StudentDetailDrawerProps) => {
  const courses = useMemo(() => pickPrimaryCoursesForDrawer(student.courses), [student.courses]);
  const [activeCourseCode, setActiveCourseCode] = useState(() => courses[0]?.course_code.toUpperCase() ?? '');
  const [detailByCourseId, setDetailByCourseId] = useState<Record<string, CourseDetailState>>({});

  const activeCourse = useMemo(
    () => courses.find((course) => course.course_code.toUpperCase() === activeCourseCode) ?? courses[0] ?? null,
    [activeCourseCode, courses],
  );

  useEffect(() => {
    setActiveCourseCode(courses[0]?.course_code.toUpperCase() ?? '');
    setDetailByCourseId({});
  }, [student.id, courses]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadCourseDetail = useCallback(async (course: ApiCourse) => {
    const courseKey = course.course_id ?? course.course_code;
    if (!courseKey) {
      return;
    }

    setDetailByCourseId((prev) => ({
      ...prev,
      [courseKey]: {
        assignments: prev[courseKey]?.assignments ?? course.assignments ?? [],
        gateCalls: prev[courseKey]?.gateCalls ?? course.gate_calls ?? [],
        loading: true,
        fetched: false,
      },
    }));

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

  useEffect(() => {
    if (!activeCourse) {
      return;
    }
    const courseKey = activeCourse.course_id ?? activeCourse.course_code;
    const cached = detailByCourseId[courseKey];
    if (!cached?.fetched && !cached?.loading) {
      loadCourseDetail(activeCourse);
    }
  }, [activeCourse, detailByCourseId, loadCourseDetail]);

  const activeDetail = activeCourse
    ? detailByCourseId[activeCourse.course_id ?? activeCourse.course_code]
    : undefined;

  const assignments = activeDetail?.assignments ?? activeCourse?.assignments ?? [];
  const gateCalls = (() => {
    const fromDetail = activeDetail?.gateCalls ?? activeCourse?.gate_calls ?? [];
    if (fromDetail.length > 0) {
      return fromDetail;
    }
    return activeCourse ? buildFallbackGateCalls(activeCourse) : [];
  })();

  const ora = activeCourse?.ora;
  const assignmentScore = assignments.length > 0
    ? sumPracticeAssignmentScores(assignments)
    : null;
  const practiceScore = assignmentScore && assignmentScore.possible > 0
    ? `${assignmentScore.earned}/${assignmentScore.possible}`
    : (ora && ora.points_total > 0 ? `${ora.points_obtained}/${ora.points_total}` : null);

  const residencyRange = formatResidencyRange(
    student.residency.start_date,
    student.residency.end_date,
  );

  return (
    <aside className="student-detail-drawer" aria-label={`Details for ${studentDisplayName(student)}`}>
      <div className="student-detail-drawer-header">
        <button
          type="button"
          className="student-detail-drawer-close"
          onClick={onClose}
          aria-label="Close student details"
        >
          <CloseIcon />
        </button>
        <h2>{studentDisplayName(student)}</h2>
        {student.residency.name && <p className="drawer-cohort">{student.residency.name}</p>}
        {residencyRange && <p className="drawer-cohort-dates">{residencyRange}</p>}
      </div>

      {courses.length === 0 ? (
        <div className="student-detail-drawer-empty">No course enrollments found for this student.</div>
      ) : (
        <>
          <div className="student-detail-drawer-tabs" role="tablist" aria-label="Courses">
            {courses.map((course) => {
              const code = course.course_code.toUpperCase();
              const isActive = code === activeCourseCode;
              const tabStatus = getCourseDrawerTabStatus(course);
              return (
                <button
                  key={course.course_id ?? code}
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
              <div className="drawer-course-heading">
                <h3>{activeCourse.course_name ?? activeCourse.course_code}</h3>
                <p>{activeCourse.mentor ? `Mentor: ${activeCourse.mentor}` : 'No mentor assigned'}</p>
              </div>

              {activeDetail?.loading && (
                <div className="drawer-loading" aria-live="polite">
                  <Spinner animation="border" screenReaderText="Loading course details" />
                </div>
              )}

              <section className="drawer-section">
                <div className="drawer-section-header">
                  <h4>Practice Questions</h4>
                  {practiceScore && <span className="drawer-section-score">{practiceScore}</span>}
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
                    <div className="drawer-summary-row">
                      {ora && ora.total > 0 ? (
                        <>
                          <span>{`${ora.submitted} submitted · ${ora.graded} reviewed · ${ora.total} total`}</span>
                          {practiceScore && <span className="drawer-score">{practiceScore}</span>}
                        </>
                      ) : (
                        <span className="drawer-empty-copy">No practice questions for this course yet.</span>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className="drawer-section">
                <div className="drawer-section-header">
                  <h4>Calls</h4>
                  {activeCourse.gate.total > 0 && (
                    <span className="drawer-section-meta">
                      {`${activeCourse.gate.completed}/${activeCourse.gate.total} completed`}
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
            </div>
          )}
        </>
      )}
    </aside>
  );
};

export default StudentDetailDrawer;
