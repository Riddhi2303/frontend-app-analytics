type SpinnerIconProps = {
  size?: number;
};

const SpinnerIcon = ({ size = 14 }: SpinnerIconProps) => (
  <svg
    className="spinner-icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Loading"
    role="img"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="28 56"
    />
  </svg>
);

export default SpinnerIcon;
