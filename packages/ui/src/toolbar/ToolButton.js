import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '../theme/ThemeProvider';
import { Tooltip } from '../common/Tooltip';
import { Icon } from '../common/Icon';
export const ToolButton = ({ icon, label, active = false, disabled = false, onClick, }) => {
    const { theme } = useTheme();
    return (_jsx(Tooltip, { text: label, children: _jsx("button", { onClick: onClick, disabled: disabled, style: {
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
            }, onMouseEnter: (e) => {
                if (!disabled && !active) {
                    e.currentTarget.style.backgroundColor =
                        theme.colors.surfaceHover;
                }
            }, onMouseLeave: (e) => {
                if (!disabled && !active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }
            }, children: _jsx(Icon, { name: icon, size: 16, color: active ? '#ffffff' : disabled ? theme.colors.textSecondary : theme.colors.text }) }) }));
};
export default ToolButton;
//# sourceMappingURL=ToolButton.js.map