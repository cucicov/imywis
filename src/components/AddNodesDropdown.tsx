import AddPageNodeButton from './nodes/buttons/AddPageNodeButton.tsx';
import AddImageNodeButton from "./nodes/buttons/AddImageNodeButton.tsx";
import AddBackgroundNodeButton from './nodes/buttons/AddBackgroundNodeButton.tsx';
import AddTextNodeButton from './nodes/buttons/AddTextNodeButton.tsx';
import AddEventNodeButton from './nodes/buttons/AddEventNodeButton.tsx';
import AddExternalLinkNodeButton from './nodes/buttons/AddExternalLinkNodeButton.tsx';

type AddNodesDropdownProps = {
  isOpen: boolean;
};

const AddNodesDropdown = ({ isOpen }: AddNodesDropdownProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="add-nodes-dropdown"
      style={{
        position: 'fixed',
        top: '36px',
        left: '12px',
        backgroundColor: 'rgb(26, 25, 43)',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '160px',
        zIndex: 10000,
        padding: '4px 0'
      }}>
      <style>{`
        .add-nodes-dropdown button {
          position: static !important;
          padding: 8px 12px !important;
          background: transparent !important;
          color: #0FF0FF !important;
          border: none !important;
          border-radius: 0 !important;
          text-align: left !important;
          font-size: 12px !important;
          cursor: pointer !important;
          z-index: auto !important;
        }
        .add-nodes-dropdown button:hover {
          background: #f5f5f5 !important;
        }
      `}</style>
      <AddPageNodeButton />
      <AddImageNodeButton />
      <AddBackgroundNodeButton />
      <AddTextNodeButton />
      <AddEventNodeButton />
      <AddExternalLinkNodeButton />
    </div>
  );
};

export default AddNodesDropdown;
