import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Search, Plus, Trash2, Edit, Filter,
  RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  MapPin, Eye, X
} from "lucide-react";
import { fetchBuildings, deleteBuilding, generateApartments } from "../../services/buildingApi"; 

export default function BuildingList() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(""); 
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); 
  const [buildings, setBuildings] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); 
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // FIX 1: Dùng getItem thay vì get
  const token = localStorage.getItem("token");

  const loadBuildings = useCallback(async () => {
    if (!token) return; // Nếu chưa có token thì không gọi
    setLoading(true);
    try {
      // FIX 2: Truyền token vào tham số thứ 5
      const data = await fetchBuildings(currentPage, pageSize, activeSearch, statusFilter);
      if (data.code === 200 && data.result) {
        setBuildings(data.result.content || []); 
        setTotalPages(data.result.totalPages || 0);
      }
    } catch (error) { 
      console.error("Lỗi fetchBuildings:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [currentPage, pageSize, activeSearch, statusFilter]);

  useEffect(() => { 
    loadBuildings(); 
  }, [loadBuildings]);

  const handleSearchTrigger = () => {
    setCurrentPage(0);
    setActiveSearch(searchInput);
  };

  const handleFilterChange = (e) => {
    setCurrentPage(0);
    setStatusFilter(e.target.value);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Xóa tòa nhà "${name}"?`)) {
      const res = await deleteBuilding(id, token); // Truyền token
      if (res.code === 200) loadBuildings();
    }
  };

  const handleGenerate = async (id) => {
    if (!window.confirm("Bắt đầu sinh căn hộ?")) return;
    const res = await generateApartments(id, token); // Truyền token
    if (res.code === 200 || res.code === 201) {
      alert("Thành công!");
      setShowModal(false);
      loadBuildings();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 font-sans text-gray-900">
      {/* 1. HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Building2 className="text-blue-600" size={28} /> Quản lý Tòa nhà
          </h1>
          <p className="text-gray-500 text-sm">Tìm kiếm và lọc trạng thái vận hành</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px] md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text" 
              placeholder="Tên hoặc mã..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
            />
          </div>

          <div className="relative min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none shadow-sm text-sm font-medium text-gray-700 cursor-pointer"
              value={statusFilter}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đã sinh căn hộ</option>
              <option value="false">Chờ khởi tạo</option>
            </select>
          </div>

          <button onClick={handleSearchTrigger} className="bg-gray-800 text-white px-5 py-2 rounded-xl hover:bg-black transition-all font-bold text-sm">
            Lọc
          </button>
          
          <button onClick={() => navigate('/add-building')} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* 2. TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tòa nhà</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quy mô</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center text-blue-600 animate-pulse font-medium">Đang tải dữ liệu...</td></tr>
              ) : buildings.length === 0 ? (
                <tr><td colSpan="4" className="py-20 text-center text-gray-400">Không tìm thấy kết quả nào.</td></tr>
              ) : (
                buildings.map((b) => (
                  <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="font-black text-blue-600 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg text-[10px] border border-blue-100 uppercase">{b.code}</div>
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{b.name}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {b.address?.split(',')[0]}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="text-sm font-bold text-gray-600">{b.numFloors} Tầng</div></td>
                    <td className="px-6 py-4">
                      {b.apartmentsGenerated ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase"><CheckCircle size={10} /> Đã xong</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase"><AlertCircle size={10} /> Chờ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {setSelectedBuilding(b); setShowModal(true);}} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-blue-100"><Eye size={18} /></button>
                        <button onClick={() => navigate(`/buildings/edit/${b.id}`)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg transition-all border border-transparent hover:border-green-100"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(b.id, b.name)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
          <span className="text-xs text-gray-400 font-medium">Trang {currentPage + 1} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-20 hover:bg-gray-50 transition-all"><ChevronLeft size={18}/></button>
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-20 hover:bg-gray-50 transition-all"><ChevronRight size={18}/></button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showModal && selectedBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
             <div className="p-6 border-b flex justify-between items-center">
                <h2 className="font-black text-gray-800">Chi tiết Tòa nhà</h2>
                <button onClick={() => setShowModal(false)}><X size={20}/></button>
             </div>
             <div className="p-6">
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tên tòa nhà</label>
                  <div className="text-lg font-black text-blue-600">{selectedBuilding.name}</div>
                </div>
                {!selectedBuilding.apartmentsGenerated && (
                  <button 
                    onClick={() => handleGenerate(selectedBuilding.id)}
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-orange-700 transition-all"
                  >
                    <RefreshCw size={16}/> SINH CĂN HỘ NGAY
                  </button>
                )}
             </div>
             <div className="p-4 bg-gray-50 text-right">
                <button onClick={() => setShowModal(false)} className="text-sm font-bold text-gray-400 px-4">Đóng</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}