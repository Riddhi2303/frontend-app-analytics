type IconProps = {
  className?: string;
};

export const VideoIcon = ({ className }: IconProps) => (
  <span className={className}>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 12.9167 8.58333"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12.4167 1.58333L8.625 4.29167L12.4167 7V1.58333Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.54167 0.5H1.58333C0.985025 0.5 0.5 0.985025 0.5 1.58333V7C0.5 7.59831 0.985025 8.08333 1.58333 8.08333H7.54167C8.13998 8.08333 8.625 7.59831 8.625 7V1.58333C8.625 0.985025 8.13998 0.5 7.54167 0.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export const CopyIcon = ({ className }: IconProps) => (
  <span className={className}>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 10.1667 10.1667"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.875 6.45833H1.41667C1.17355 6.45833 0.940394 6.36176 0.768485 6.18985C0.596577 6.01794 0.5 5.78478 0.5 5.54167V1.41667C0.5 1.17355 0.596577 0.940394 0.768485 0.768485C0.940394 0.596577 1.17355 0.5 1.41667 0.5H5.54167C5.78478 0.5 6.01794 0.596577 6.18985 0.768485C6.36176 0.940394 6.45833 1.17355 6.45833 1.41667V1.875M4.625 3.70833H8.75C9.25626 3.70833 9.66667 4.11874 9.66667 4.625V8.75C9.66667 9.25626 9.25626 9.66667 8.75 9.66667H4.625C4.11874 9.66667 3.70833 9.25626 3.70833 8.75V4.625C3.70833 4.11874 4.11874 3.70833 4.625 3.70833Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <span className={className}>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 5.6 9.6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0.8 8.8L4.8 4.8L0.8 0.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);
