import type { ApiStudent } from '../data/analyticsData';
import StudentDetailView from './StudentDetailView';

type StudentDetailDrawerProps = {
  student: ApiStudent;
  initialCourseCode?: string | null;
  onClose: () => void;
};

const StudentDetailDrawer = ({
  student,
  initialCourseCode = null,
  onClose,
}: StudentDetailDrawerProps) => (
  <StudentDetailView
    student={student}
    initialCourseCode={initialCourseCode}
    variant="drawer"
    onClose={onClose}
  />
);

export default StudentDetailDrawer;
