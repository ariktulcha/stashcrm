
import React, { useState, useEffect } from 'react';
import { Phone, MoreHorizontal, Plus, Loader2, Edit, UserPlus, ShoppingCart, X, MessageSquare, Calendar, Clock, LayoutGrid, List } from 'lucide-react';
import { Lead, LeadStatus, LeadSource, Customer, CustomerType } from '../types';
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '../constants';
import Modal from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { leadsService } from '../services/leadsService';
import { customersService } from '../services/customersService';

interface LeadsProps {
  onCreateOrder?: (leadId: string) => void;
}

interface LeadActivity {
  id: string;
  type: 'call' | 'meeting' | 'note' | 'status_change';
  text: string;
  author: string;
  created_at: string;
  oldStatus?: LeadStatus;
  newStatus?: LeadStatus;
}

interface SortableLeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onCreateOrder: (lead: Lead) => void;
  onViewDetails: (lead: Lead) => void;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ lead, onEdit, onConvert, onCreateOrder, onViewDetails }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow group"
    >
      {/* Drag Handle Area */}
      <div {...listeners} className="cursor-move">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-slate-800">{lead.contact_name}</h4>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="ערוך"
            >
              <Edit size={14} />
            </button>
            <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
        
        {lead.company_name && (
          <div className="text-sm text-slate-600 mb-2">{lead.company_name}</div>
        )}

        <div className="text-xs text-slate-500 mb-3 space-y-1">
          <div>{LEAD_SOURCE_LABELS[lead.source]} • {lead.phone}</div>
          {lead.estimated_quantity && (
            <div className="font-medium text-blue-600">כמות: {lead.estimated_quantity}</div>
          )}
          {lead.event_type && (
            <div>אירוע: {lead.event_type}</div>
          )}
        </div>
      </div>

      {/* Action Buttons - Not draggable */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50">
        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="text-xs py-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center gap-1 transition-colors"
        >
          <Phone size={12} />
          חייג
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onCreateOrder(lead); }}
          className="text-xs py-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors"
        >
          <ShoppingCart size={12} />
          הזמנה
        </button>
        {lead.status !== 'converted' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onConvert(lead); }}
            className="text-xs py-1.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center gap-1 transition-colors"
          >
            <UserPlus size={12} />
            המר
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails(lead); }}
          className="text-xs py-1.5 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          פרטים
        </button>
      </div>
    </div>
  );
};

// Group leads by status
const groupLeadsByStatus = (leads: Lead[]) => {
  const groups: Record<string, Lead[]> = {
    new: [],
    contacted: [],
    in_negotiation: [],
    quoted: [],
    converted: [],
    lost: []
  };

  leads.forEach(lead => {
    if (groups[lead.status]) {
      groups[lead.status].push(lead);
    }
  });

  return groups;
};

const Leads: React.FC<LeadsProps> = ({ onCreateOrder }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const { showToast } = useToast();
  
  // Activity history state
  const [leadActivities, setLeadActivities] = useState<Record<string, LeadActivity[]>>({});
  const [newActivityText, setNewActivityText] = useState('');
  const [newActivityType, setNewActivityType] = useState<'call' | 'meeting' | 'note'>('note');
  
  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: '',
    company_name: '',
    phone: '',
    email: '',
    source: 'instagram' as LeadSource,
    event_type: '',
    estimated_quantity: '',
    notes: ''
  });
  
  // Convert to customer form
  const [customerFormData, setCustomerFormData] = useState({
    customer_type: 'private' as CustomerType,
    company_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address_city: ''
  });

  // Load leads from Supabase
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const data = await leadsService.getAll();
      setLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
      showToast('שגיאה בטעינת הלידים', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedLeads = groupLeadsByStatus(leads);
  const statusKeys: LeadStatus[] = ['new', 'contacted', 'in_negotiation', 'quoted', 'converted', 'lost'];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    // Find the lead
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const oldStatus = lead.status;

    try {
      // Update lead status in Supabase
      await leadsService.update(leadId, { status: newStatus });
      
      // Update local state
      const updatedLeads = leads.map(l => 
        l.id === leadId ? { ...l, status: newStatus } : l
      );
      setLeads(updatedLeads);
      
      // Add activity
      if (oldStatus !== newStatus) {
        const activity: LeadActivity = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'status_change',
          text: `שינוי סטטוס מ-${LEAD_STATUS_LABELS[oldStatus]} ל-${LEAD_STATUS_LABELS[newStatus]}`,
          author: 'דני מנהל',
          created_at: new Date().toISOString(),
          oldStatus,
          newStatus
        };
        
        setLeadActivities(prev => ({
          ...prev,
          [leadId]: [...(prev[leadId] || []), activity]
        }));
      }
      
      showToast(`הליד הועבר ל-${LEAD_STATUS_LABELS[newStatus]}`);
    } catch (error) {
      console.error('Error updating lead status:', error);
      showToast('שגיאה בעדכון סטטוס הליד', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contact_name || !formData.phone) {
      showToast('נא למלא שדות חובה (שם וטלפון)', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingLead) {
        // Update existing lead
        await leadsService.update(editingLead.id, {
          contact_name: formData.contact_name,
          company_name: formData.company_name || undefined,
          phone: formData.phone,
          email: formData.email || undefined,
          source: formData.source,
          event_type: formData.event_type || undefined,
          estimated_quantity: formData.estimated_quantity ? parseInt(formData.estimated_quantity) : undefined,
          notes: formData.notes || undefined
        });
        showToast('הליד עודכן בהצלחה');
        setIsEditModalOpen(false);
      } else {
        // Create new lead
        await leadsService.create({
          contact_name: formData.contact_name,
          company_name: formData.company_name || undefined,
          phone: formData.phone,
          email: formData.email || undefined,
          source: formData.source,
          status: 'new',
          event_type: formData.event_type || undefined,
          estimated_quantity: formData.estimated_quantity ? parseInt(formData.estimated_quantity) : undefined,
          notes: formData.notes || undefined
        });
        showToast('הליד נוצר בהצלחה');
        setIsAddModalOpen(false);
      }
      
      // Reload leads
      await loadLeads();
      
      setEditingLead(null);
      setFormData({
        contact_name: '',
        company_name: '',
        phone: '',
        email: '',
        source: 'instagram',
        event_type: '',
        estimated_quantity: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving lead:', error);
      showToast('שגיאה בשמירת הליד', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      contact_name: lead.contact_name,
      company_name: lead.company_name || '',
      phone: lead.phone,
      email: lead.email || '',
      source: lead.source,
      event_type: lead.event_type || '',
      estimated_quantity: lead.estimated_quantity?.toString() || '',
      notes: lead.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleConvertToCustomer = (lead: Lead) => {
    setConvertingLead(lead);
    const nameParts = lead.contact_name.split(' ');
    setCustomerFormData({
      customer_type: lead.company_name ? 'business' : 'private',
      company_name: lead.company_name || '',
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      phone: lead.phone,
      email: lead.email || '',
      address_city: ''
    });
    setIsConvertModalOpen(true);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerFormData.first_name || !customerFormData.phone) {
      showToast('נא למלא שדות חובה', 'error');
      return;
    }

    if (customerFormData.customer_type === 'business' && !customerFormData.company_name) {
      showToast('נא למלא שם חברה ללקוח עסקי', 'error');
      return;
    }

    try {
      // Create customer in Supabase
      await customersService.create({
        customer_type: customerFormData.customer_type,
        company_name: customerFormData.company_name || undefined,
        first_name: customerFormData.first_name,
        last_name: customerFormData.last_name || undefined,
        phone: customerFormData.phone,
        email: customerFormData.email || undefined,
        address_city: customerFormData.address_city || undefined,
        is_active: true
      });
      
      // Update lead status to converted
      if (convertingLead) {
        await leadsService.update(convertingLead.id, { status: 'converted' });
        
        // Update local state
        setLeads(prev => prev.map(lead => 
          lead.id === convertingLead.id ? { ...lead, status: 'converted' } : lead
        ));
      
        // Add activity
        const activity: LeadActivity = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'status_change',
          text: 'הליד הומר ללקוח',
          author: 'דני מנהל',
          created_at: new Date().toISOString(),
          oldStatus: convertingLead.status,
          newStatus: 'converted'
        };
        
        setLeadActivities(prev => ({
          ...prev,
          [convertingLead.id]: [...(prev[convertingLead.id] || []), activity]
        }));
      }
      
      showToast('הליד הומר ללקוח בהצלחה');
      setIsConvertModalOpen(false);
      setConvertingLead(null);
      setCustomerFormData({
        customer_type: 'private',
        company_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address_city: ''
      });
    } catch (error) {
      console.error('Error converting lead to customer:', error);
      showToast('שגיאה בהמרת הליד ללקוח', 'error');
    }
  };

  const handleCreateOrderFromLead = (lead: Lead) => {
    if (onCreateOrder) {
      onCreateOrder(lead.id);
    } else {
      showToast('פונקציונליות יצירת הזמנה תתווסף בקרוב', 'info');
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setViewingLead(lead);
    setIsDetailsModalOpen(true);
  };

  const handleAddActivity = () => {
    if (!newActivityText.trim() || !viewingLead) return;
    
    const activity: LeadActivity = {
      id: Math.random().toString(36).substr(2, 9),
      type: newActivityType,
      text: newActivityText,
      author: 'דני מנהל',
      created_at: new Date().toISOString()
    };
    
    setLeadActivities(prev => ({
      ...prev,
      [viewingLead.id]: [...(prev[viewingLead.id] || []), activity]
    }));
    
    setNewActivityText('');
    showToast('הפעילות נוספה בהצלחה');
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // Droppable Column Component
  const DroppableColumn: React.FC<{ status: LeadStatus; children: React.ReactNode }> = ({ status, children }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    });

    return (
      <div
        ref={setNodeRef}
        className={`w-80 flex-shrink-0 flex flex-col bg-slate-100 rounded-xl max-h-full ${isOver ? 'ring-2 ring-blue-500' : ''}`}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">לידים</h2>
          <p className="text-slate-500 text-sm">ניהול תהליך המכירה</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="תצוגת Kanban"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="תצוגת רשימה"
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>ליד חדש</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'kanban' ? (
        /* Kanban Container */
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-4 h-full min-w-[1200px]">
              {statusKeys.map((status) => {
                const leadsInCol = groupedLeads[status];
                return (
                  <DroppableColumn key={status} status={status}>
                    {/* Column Header */}
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-slate-100 rounded-t-xl z-10">
                      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full 
                          ${status === 'new' ? 'bg-blue-500' : 
                            status === 'contacted' ? 'bg-yellow-500' :
                            status === 'converted' ? 'bg-green-500' :
                            status === 'lost' ? 'bg-red-500' : 'bg-slate-400'
                          }`} 
                        />
                        {LEAD_STATUS_LABELS[status]}
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                          {leadsInCol.length}
                        </span>
                      </h3>
                    </div>

                    {/* Cards Container */}
                    <SortableContext
                      items={leadsInCol.map(l => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar min-h-[200px]">
                        {leadsInCol.map((lead) => (
                          <SortableLeadCard
                            key={lead.id}
                            lead={lead}
                            onEdit={handleEditLead}
                            onConvert={handleConvertToCustomer}
                            onCreateOrder={handleCreateOrderFromLead}
                            onViewDetails={handleViewDetails}
                          />
                        ))}
                        
                        {leadsInCol.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                            גרור לידים לכאן
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
          <DragOverlay>
            {activeLead ? (
              <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500 opacity-90">
                <div className="font-semibold text-slate-800">{activeLead.contact_name}</div>
                <div className="text-sm text-slate-600">{activeLead.phone}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-4">שם איש קשר</th>
                  <th className="px-6 py-4">חברה</th>
                  <th className="px-6 py-4">טלפון</th>
                  <th className="px-6 py-4">מקור</th>
                  <th className="px-6 py-4">סטטוס</th>
                  <th className="px-6 py-4">אירוע</th>
                  <th className="px-6 py-4">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{lead.contact_name}</td>
                      <td className="px-6 py-4 text-slate-600">{lead.company_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{lead.phone}</td>
                      <td className="px-6 py-4 text-slate-600">{LEAD_SOURCE_LABELS[lead.source]}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                          lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{lead.event_type || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="ערוך"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleViewDetails(lead)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="פרטים"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      אין לידים
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Lead Modal */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingLead(null);
          setFormData({
            contact_name: '',
            company_name: '',
            phone: '',
            email: '',
            source: 'instagram',
            event_type: '',
            estimated_quantity: '',
            notes: ''
          });
        }} 
        title={editingLead ? 'ערוך ליד' : 'ליד חדש'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">שם איש קשר *</label>
               <input 
                 name="contact_name"
                 value={formData.contact_name}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">שם חברה</label>
               <input 
                 name="company_name"
                 value={formData.company_name}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">טלפון *</label>
               <input 
                 name="phone"
                 value={formData.phone}
                 onChange={handleInputChange}
                 type="tel" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">מקור הגעה</label>
               <select 
                 name="source"
                 value={formData.source}
                 onChange={handleInputChange}
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
               >
                 <option value="instagram">אינסטגרם</option>
                 <option value="facebook">פייסבוק</option>
                 <option value="website">אתר</option>
                 <option value="referral">הפניה</option>
                 <option value="whatsapp">וואטסאפ</option>
                 <option value="other">אחר</option>
               </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">סוג אירוע</label>
               <input 
                 name="event_type"
                 value={formData.event_type}
                 onChange={handleInputChange}
                 type="text" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">כמות משוערת</label>
               <input 
                 name="estimated_quantity"
                 value={formData.estimated_quantity}
                 onChange={handleInputChange}
                 type="number" 
                 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
               />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">הערות</label>
             <textarea 
               name="notes"
               value={formData.notes}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20" 
             />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
             <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">ביטול</button>
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
             >
               {isSubmitting && <Loader2 size={16} className="animate-spin" />}
               {editingLead ? 'שמור שינויים' : 'צור ליד'}
             </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal with Activity History */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setViewingLead(null);
          setNewActivityText('');
        }}
        title={viewingLead ? `פרטי ליד - ${viewingLead.contact_name}` : 'פרטי ליד'}
      >
        {viewingLead && (
          <div className="space-y-6">
            {/* Lead Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">טלפון:</span>
                  <div className="font-medium">{viewingLead.phone}</div>
                </div>
                {viewingLead.email && (
                  <div>
                    <span className="text-slate-500">אימייל:</span>
                    <div className="font-medium">{viewingLead.email}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">מקור:</span>
                  <div className="font-medium">{LEAD_SOURCE_LABELS[viewingLead.source]}</div>
                </div>
                <div>
                  <span className="text-slate-500">סטטוס:</span>
                  <div className="font-medium">{LEAD_STATUS_LABELS[viewingLead.status]}</div>
                </div>
              </div>
            </div>

            {/* Add Activity */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-800 mb-3">הוסף פעילות</h3>
              <div className="space-y-3">
                <select
                  value={newActivityType}
                  onChange={(e) => setNewActivityType(e.target.value as 'call' | 'meeting' | 'note')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="note">הערה</option>
                  <option value="call">שיחה</option>
                  <option value="meeting">פגישה</option>
                </select>
                <textarea
                  value={newActivityText}
                  onChange={(e) => setNewActivityText(e.target.value)}
                  placeholder="הוסף הערה, פרטי שיחה או פגישה..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={!newActivityText.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הוסף פעילות
                </button>
              </div>
            </div>

            {/* Activity History */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-800 mb-3">היסטוריית פעילות</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {leadActivities[viewingLead.id] && leadActivities[viewingLead.id].length > 0 ? (
                  leadActivities[viewingLead.id]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(activity => (
                      <div key={activity.id} className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {activity.type === 'call' && <Phone size={16} className="text-green-600" />}
                            {activity.type === 'meeting' && <Calendar size={16} className="text-blue-600" />}
                            {activity.type === 'note' && <MessageSquare size={16} className="text-slate-600" />}
                            {activity.type === 'status_change' && <Clock size={16} className="text-purple-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800">{activity.text}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {activity.author} • {new Date(activity.created_at).toLocaleString('he-IL')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    אין פעילות עדיין
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Convert to Customer Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setConvertingLead(null);
        }}
        title="המר ליד ללקוח"
      >
        <form onSubmit={handleConvertSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${customerFormData.customer_type === 'private' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input 
                type="radio" 
                name="customer_type" 
                value="private" 
                checked={customerFormData.customer_type === 'private'}
                onChange={(e) => setCustomerFormData({...customerFormData, customer_type: e.target.value as CustomerType})}
                className="w-4 h-4 text-blue-600" 
              />
              <span className="text-sm font-medium">לקוח פרטי</span>
            </label>
            <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${customerFormData.customer_type === 'business' ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input 
                type="radio" 
                name="customer_type" 
                value="business" 
                checked={customerFormData.customer_type === 'business'}
                onChange={(e) => setCustomerFormData({...customerFormData, customer_type: e.target.value as CustomerType})}
                className="w-4 h-4 text-blue-600" 
              />
              <span className="text-sm font-medium">לקוח עסקי</span>
            </label>
          </div>
          
          {customerFormData.customer_type === 'business' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שם חברה *</label>
              <input 
                name="company_name" 
                value={customerFormData.company_name}
                onChange={(e) => setCustomerFormData({...customerFormData, company_name: e.target.value})}
                type="text" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שם פרטי *</label>
              <input 
                name="first_name" 
                value={customerFormData.first_name}
                onChange={(e) => setCustomerFormData({...customerFormData, first_name: e.target.value})}
                type="text" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">שם משפחה</label>
              <input 
                name="last_name" 
                value={customerFormData.last_name}
                onChange={(e) => setCustomerFormData({...customerFormData, last_name: e.target.value})}
                type="text" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">טלפון *</label>
              <input 
                name="phone" 
                value={customerFormData.phone}
                onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                type="tel" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">אימייל</label>
              <input 
                name="email" 
                value={customerFormData.email}
                onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})}
                type="email" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">עיר / כתובת</label>
            <input 
              name="address_city" 
              value={customerFormData.address_city}
              onChange={(e) => setCustomerFormData({...customerFormData, address_city: e.target.value})}
              type="text" 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => {
                setIsConvertModalOpen(false);
                setConvertingLead(null);
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              ביטול
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              המר ללקוח
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;
