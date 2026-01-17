interface AddNodeButtonProps {
    onClick: () => void;
}

const AddNodeButton = ({ onClick }: AddNodeButtonProps) => {
    return (
        <button
            onClick={onClick}
            style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 10,
                padding: '10px 20px',
                backgroundColor: '#1a192b',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
            }}
        >
            Add Node
        </button>
    );
};

export default AddNodeButton;