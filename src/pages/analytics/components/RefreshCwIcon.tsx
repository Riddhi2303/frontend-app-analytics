type RefreshCwIconProps = {
  size?: number;
};

const RefreshCwIcon = ({ size = 15 }: RefreshCwIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 4v6h6M20 20v-6h-6M5.64 9A9 9 0 0 1 20 7.5M18.36 15A9 9 0 0 1 4 16.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default RefreshCwIcon;
