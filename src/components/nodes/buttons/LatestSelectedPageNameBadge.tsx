type LatestSelectedPageNameBadgeProps = {
  pageName: string;
};

const LatestSelectedPageNameBadge = ({ pageName }: LatestSelectedPageNameBadgeProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '180px',
        zIndex: 10,
        padding: '8px 12px',
        backgroundColor: '#f5f2e9',
        color: '#1b1b1b',
        border: '1px solid #1b1b1b',
        borderRadius: '5px',
        fontSize: '12px',
        maxWidth: '280px',
        wordBreak: 'break-word',
      }}
    >
      Displaying preview: <b>{pageName}</b>
    </div>
  );
};

export default LatestSelectedPageNameBadge;
