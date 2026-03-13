import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, ArrowLeft, Save, MapPin, 
  Layers, Square, Info, CheckCircle2, AlertCircle
} from "lucide-react";
import { createBuilding } from "../../services/buildingApi";

export default function AddBuilding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Khởi tạo state dựa trên cấu trúc JSON của bạn
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    numFloors: 1,
    apartmentsPerFloor1br: 0,
    apartmentsPerFloor2br: 0,
    apartmentsPerFloor3br: 0,
    area1brSqm: 0,
    area2brSqm: 0,
    area3brSqm: 0
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await createBuilding(formData);
      if (res.code === 200 || res.code === 201) {
        alert("Thêm tòa nhà thành công!");
        navigate("/buildings"); // Quay lại danh sách
      } else {
        setError(res.message || "Có lỗi xảy ra khi tạo tòa nhà.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Thêm Tòa Nhà Mới</h1>
            <p className="text-sm text-gray-500">Thiết lập cấu hình vận hành cho dự án mới</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Info size={18}/></div>
            <h2 className="font-black text-gray-700 uppercase text-sm tracking-wider">Thông tin cơ bản</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase ml-1">Tên tòa nhà</label>
              <input 
                required name="name" value={formData.name} onChange={handleChange}
                placeholder="VD: Landmark 81"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase ml-1">Mã định danh (Code)</label>
              <input 
                required name="code" value={formData.code} onChange={handleChange}
                placeholder="VD: LM81"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium uppercase"
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase ml-1">Địa chỉ</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required name="address" value={formData.address} onChange={handleChange}
                  placeholder="Nhập địa chỉ chi tiết..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CẤU TRÚC & DIỆN TÍCH */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Layers size={18}/></div>
            <h2 className="font-black text-gray-700 uppercase text-sm tracking-wider">Cấu trúc & Quy mô căn hộ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tổng số tầng */}
            <div className="md:col-span-3 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-700">Tổng số tầng nổi</p>
                <p className="text-xs text-gray-400">Số tầng sẽ được dùng để sinh căn hộ</p>
              </div>
              <input 
                type="number" min="1" name="numFloors" value={formData.numFloors} onChange={handleChange}
                className="w-24 text-center py-2 bg-white rounded-xl font-black text-blue-600 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Chi tiết từng loại phòng */}
            {[
              { label: "1 Phòng Ngủ (1BR)", key: "apartmentsPerFloor1br", area: "area1brSqm", color: "blue" },
              { label: "2 Phòng Ngủ (2BR)", key: "apartmentsPerFloor2br", area: "area2brSqm", color: "purple" },
              { label: "3 Phòng Ngủ (3BR)", key: "apartmentsPerFloor3br", area: "area3brSqm", color: "emerald" },
            ].map((item) => (
              <div key={item.key} className={`p-4 rounded-3xl border border-${item.color}-50 bg-${item.color}-50/30 flex flex-col gap-4`}>
                <p className={`text-[10px] font-black text-${item.color}-600 uppercase tracking-widest text-center`}>{item.label}</p>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase italic">Số căn/Tầng</label>
                  <input 
                    type="number" name={item.key} value={formData[item.key]} onChange={handleChange}
                    className="w-full py-2 px-3 bg-white rounded-xl font-bold text-gray-700 border-none focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase italic">Diện tích (m²)</label>
                  <input 
                    type="number" step="0.1" name={item.area} value={formData[item.area]} onChange={handleChange}
                    className="w-full py-2 px-3 bg-white rounded-xl font-bold text-gray-700 border-none focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="flex items-center gap-4 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save size={20} /> LƯU TÒA NHÀ</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}