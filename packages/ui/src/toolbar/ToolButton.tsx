import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Tooltip } from '../common/Tooltip';
import { Icon, IconName } from '../common/Icon';

interface ToolButtonProps {
  icon: IconName;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
}) => {
  const { theme } = useTheme();

  return (
    <Tooltip text={label}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 28,
          border: 'none',
          borderRadius: 4,
          backgroundColor: active ? theme.colors.primary : 'transparent',
          color: active ? '#ffffff' : disabled ? theme.colors.textSecondary : theme.colors.text,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'background-color 0.12s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !active) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              theme.colors.surfaceHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !active) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }
        }}
      >
        <Icon
          name={icon}
          size={16}
          color={active ? '#ffffff' : disabled ? theme.colors.textSecondary : theme.colors.text}
        />
      </button>
    </Tooltip>
  );
};

export default ToolButton;
