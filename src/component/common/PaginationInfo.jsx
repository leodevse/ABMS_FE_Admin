const PaginationInfo = ({ from = 0, to = 0, total = 0 }) => {
  return (
    <div
      style={{
        marginTop: "10px",
        padding: "8px",
        marginLeft:"1%"
      }}
    >
      Hiển thị từ {from} đến {to} trên {total} 
    </div>
  );
};

export default PaginationInfo;
