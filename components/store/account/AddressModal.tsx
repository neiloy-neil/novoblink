"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { BD_GEO } from "@/lib/bd-geo"

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  addressToEdit?: any | null
}

export default function AddressModal({ isOpen, onClose, onSaved, addressToEdit }: AddressModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    division: "",
    district: "",
    area: "",
    address: "",
    isDefault: false,
  })

  useEffect(() => {
    if (isOpen) {
      if (addressToEdit) {
        setFormData({
          label: addressToEdit.label || "Home",
          fullName: addressToEdit.fullName || "",
          phone: addressToEdit.phone || "",
          division: addressToEdit.division || "",
          district: addressToEdit.district || "",
          area: addressToEdit.area || "",
          address: addressToEdit.address || "",
          isDefault: addressToEdit.isDefault || false,
        })
      } else {
        setFormData({
          label: "Home",
          fullName: "",
          phone: "",
          division: "",
          district: "",
          area: "",
          address: "",
          isDefault: false,
        })
      }
    }
  }, [isOpen, addressToEdit])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === "division") {
      setFormData(prev => ({ ...prev, division: value, district: "", area: "" }))
    } else if (name === "district") {
      setFormData(prev => ({ ...prev, district: value, area: "" }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const selCls = "w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"
  const currentDistricts = BD_GEO.find(d => d.name === formData.division)?.districts ?? []
  const currentUpazilas = currentDistricts.find(d => d.name === formData.district)?.upazilas ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const url = addressToEdit ? `/api/user/addresses/${addressToEdit.id}` : "/api/user/addresses"
      const method = addressToEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        onSaved()
      } else {
        console.error("Failed to save address")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-novo-border">
          <h2 className="text-xl font-heading font-bold text-novo-black">
            {addressToEdit ? "Edit Address" : "Add New Address"}
          </h2>
          <button onClick={onClose} className="p-2 text-novo-text hover:text-novo-error transition-colors rounded-full hover:bg-novo-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Label (e.g. Home, Office)</label>
              <input required name="label" value={formData.label} onChange={handleChange} placeholder="Home" className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Full Name</label>
              <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Phone Number</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Division</label>
              <select required name="division" value={formData.division} onChange={handleChange} className={selCls}>
                <option value="">Select Division</option>
                {BD_GEO.map(div => <option key={div.name} value={div.name}>{div.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">District</label>
              <select required name="district" value={formData.district} onChange={handleChange} className={selCls} disabled={!formData.division}>
                <option value="">Select District</option>
                {currentDistricts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Upazila / Thana</label>
              <select required name="area" value={formData.area} onChange={handleChange} className={selCls} disabled={!formData.district}>
                <option value="">Select Upazila / Thana</option>
                {currentUpazilas.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Street Address</label>
              <textarea required name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all resize-none" />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 py-2">
              <input 
                type="checkbox" 
                id="isDefault" 
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-4 h-4 text-novo-black focus:ring-novo-blue rounded border-novo-border"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-novo-black cursor-pointer">
                Set as default address
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-novo-muted text-novo-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-novo-border transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-novo-black text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-novo-blue transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {addressToEdit ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
