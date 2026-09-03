import type {CSSProperties} from 'react';

export type StatusPopupType = 'success' | 'error';

type StatusPopupProps = {
  type: StatusPopupType;
  title: string;
  message: string;
  onClose: () => void;
};

const statusWrapperStyle: CSSProperties = {
  position: 'fixed',
  top: '50px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10001,
  width: '320px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  background: 'rgba(18, 24, 31, 0.88)',
  color: '#f5f7fa',
  fontSize: '12px',
  textAlign: 'left',
  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.28)',
  backdropFilter: 'blur(4px)',
};

const StatusPopup = ({type, title, message, onClose}: StatusPopupProps) => (
  <div
    style={{
      ...statusWrapperStyle,
      borderColor: type === 'success' ? 'rgba(46, 204, 113, 0.5)' : 'rgba(255, 107, 107, 0.5)',
    }}
    role="status"
  >
    <div style={statusHeaderStyle}>
      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <span
          style={{
            ...statusChipStyle,
            background: type === 'success' ? '#1e8e5a' : '#c23b3b',
          }}
        >
          {type === 'success' ? 'OK' : 'NOK'}
        </span>
        <p style={statusTitleStyle}>{title}</p>
      </div>
      <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="Close status message">
        ×
      </button>
    </div>
    <div style={statusBodyStyle}>{message}</div>
  </div>
);

const closeButtonStyle: CSSProperties = {
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#f5f7fa',
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: 1,
  width: '22px',
  height: '22px',
  borderRadius: '999px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const statusHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '10px 12px 8px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
};

const statusBodyStyle: CSSProperties = {
  padding: '10px 12px 12px',
  lineHeight: 1.4,
  wordBreak: 'break-word',
};

const statusTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.02em',
};

const statusChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '44px',
  padding: '2px 8px',
  borderRadius: '999px',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.03em',
  color: '#fff',
};

export default StatusPopup;
