type MakersAsylumLogoIconProps = {
  className?: string;
};

const MakersAsylumLogoIcon = ({ className }: MakersAsylumLogoIconProps) => (
  <svg
    className={className}
    viewBox="0 0 220 86"
    role="img"
    aria-label="Maker's Asylum"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="16,4 82,4 108,70 4,70" fill="#f2c533" />
    <line x1="36" y1="44" x2="62" y2="44" stroke="#121212" strokeWidth="4" />
    <line x1="49" y1="31" x2="49" y2="57" stroke="#121212" strokeWidth="4" />
    <line x1="58" y1="31" x2="64" y2="57" stroke="#121212" strokeWidth="3.5" />
    <line x1="70" y1="31" x2="64" y2="57" stroke="#121212" strokeWidth="3.5" />
    <text
      x="124"
      y="31"
      fill="#111111"
      fontFamily="Inter, Arial, sans-serif"
      fontSize="20"
      fontWeight="700"
      letterSpacing="1.6"
    >
      MAKER&apos;S
    </text>
    <text
      x="124"
      y="54"
      fill="#111111"
      fontFamily="Inter, Arial, sans-serif"
      fontSize="20"
      fontWeight="700"
      letterSpacing="1.6"
    >
      ASYLUM
    </text>
  </svg>
);

export default MakersAsylumLogoIcon;
