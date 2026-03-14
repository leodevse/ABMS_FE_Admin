import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Layers, Search, Box, MapPin, Info } from "lucide-react";
import { fetchApartmentsByBuilding } from "../../services/apartmentApi";
import { fetchBuildingById } from "../../services/buildingApi";

export default function ApartmentList() {
  const { buildingId } = useParams(); 
  const navigate = useNavigate();
  
  const [apartments, setApartments] = useState([]);
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    if (!buildingId) return;
    
    setLoading(true);
    console.log("--- DEBUG: Đang gọi API cho Building ID:", buildingId);
    
    try {
      // Gọi song song cả thông tin tòa nhà và danh sách căn hộ
      const [bRes, aRes] = await Promise.all([
        fetchBuildingById(buildingId),
        fetchApartmentsByBuilding(buildingId)
      ]);
      
      console.log("--- DEBUG: Kết quả API Building:", bRes);
      console.log("--- DEBUG: Kết quả API Apartments:", aRes);

      if (bRes.code === 200) setBuilding(bRes.result);

      // JSON của bạn trả về { result: [...] }
      // Kiểm tra nếu aRes.result là mảng thì mới set
      if (aRes.code === 200 && Array.isArray(aRes.result)) {
        setApartments(aRes.result);
      } else {
        console.error("--- LỖI: Dữ liệu trả về không phải mảng list!", aRes.result);
        setApartments([]);
      }
    } catch (error) {
      console.error("--- LỖI KẾT NỐI API:", error);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Lọc dữ liệu theo 'code' (Trong JSON bạn gửi là "101", "102"...)
  const filteredData = apartments.filter(item => 
    item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.floorNumber?.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/building")} className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all border border-gray-100">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
              <Box className="text-blue-600" size={24} /> Danh sách Căn hộ
            </h1>
            <p className="text-sm font-bold text-gray-400 uppercase flex items-center gap-1 mt-1">
              <MapPin size={14}/> {building?.name || "Tòa nhà"} ({building?.code || "..."})
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo số căn (101, 202...)"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center w-28">Số Căn</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Tầng</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Loại phòng</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Diện tích</th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="5" className="py-20 text-center text-blue-600 animate-pulse font-bold uppercase tracking-widest">Đang tải dữ liệu...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan="5" className="py-20 text-center text-gray-400 italic font-medium">
                {apartments.length === 0 ? "Tòa nhà này chưa có căn hộ nào." : "Không tìm thấy căn hộ phù hợp."}
              </td></tr>
            ) : filteredData.map((apt) => (
              <tr key={apt.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 font-black text-blue-600 text-center bg-blue-50/50">
                  {apt.code}
                </td>
                <td className="px-6 py-4 text-center font-bold text-gray-600">
                  Tầng {apt.floorNumber}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{apt.bedroomCount} Phòng ngủ</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">{apt.buildingName}</div>
                </td>
                <td className="px-6 py-4 text-center font-black text-gray-700">
                  {apt.areaSqm} m²
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase 
                    ${apt.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {apt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}