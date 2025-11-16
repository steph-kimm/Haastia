import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import CustomerList from "../../components/professional/customers/CustomerList";
import CustomerDetail from "../../components/professional/customers/CustomerDetail";
import CustomerNotes from "../../components/professional/customers/CustomerNotes";
import AppointmentHistory from "../../components/professional/customers/AppointmentHistory";
import { getValidToken } from "../../utils/auth";
import "../../components/professional/customers/CustomersLayout.css";

const createEmptySummary = () => ({
  customer: null,
  guestInfo: null,
  notes: [],
  bookings: [],
});

const ProfessionalCustomers = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const [customersState, setCustomersState] = useState({
    loading: true,
    error: null,
    items: [],
  });
  const [summary, setSummary] = useState(createEmptySummary);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [notesRequest, setNotesRequest] = useState({ busy: false, error: null });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return customersState.items;
    }

    return customersState.items.filter((entry) => {
      const values = [
        entry.customer?.name,
        entry.customer?.email,
        entry.customer?.phone,
        entry.guestInfo?.name,
        entry.guestInfo?.email,
        entry.guestInfo?.phone,
      ];

      return values.some((value) =>
        typeof value === "string" ? value.toLowerCase().includes(query) : false
      );
    });
  }, [customersState.items, searchTerm]);

  useEffect(() => {
    let isActive = true;

    const loadCustomers = async () => {
      setCustomersState((prev) => ({ ...prev, loading: true, error: null }));

      const auth = getValidToken();
      if (!auth?.token) {
        if (isActive) {
          setCustomersState({
            loading: false,
            error: "Please sign in as a professional to view your customers.",
            items: [],
          });
        }
        return;
      }

      try {
        const { data } = await axios.get("/api/professional/me/customers", {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!isActive) return;

        const items = Array.isArray(data?.customers) ? data.customers : [];
        setCustomersState({ loading: false, error: null, items });
      } catch (error) {
        if (!isActive) return;

        setCustomersState({
          loading: false,
          error:
            error.response?.data?.error ||
            error.message ||
            "Failed to load customers.",
          items: [],
        });
      }
    };

    loadCustomers();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (customersState.loading) return;

    const ids = customersState.items.map(
      (entry) => entry.customerId || entry.customerKey
    );

    if (!ids.length) {
      if (customerId) {
        navigate("/customers", { replace: true });
      }
      setSummary(createEmptySummary());
      setSummaryError(null);
      return;
    }

    if (!customerId || !ids.includes(customerId)) {
      navigate(`/customers/${ids[0]}`, { replace: true });
    }
  }, [customersState.items, customersState.loading, customerId, navigate]);

  useEffect(() => {
    if (!customerId) {
      setSummary(createEmptySummary());
      setSummaryLoading(false);
      setSummaryError(null);
      setNotesRequest({ busy: false, error: null });
      return;
    }

    const hasCustomer = customersState.items.some(
      (entry) => (entry.customerId || entry.customerKey) === customerId
    );

    if (!hasCustomer) {
      return;
    }

    let isActive = true;

    const loadSummary = async () => {
      setSummary(createEmptySummary());
      setSummaryLoading(true);
      setSummaryError(null);
      setNotesRequest({ busy: false, error: null });

      const auth = getValidToken();
      if (!auth?.token) {
        if (isActive) {
          setSummaryError("Please sign in to view customer details.");
          setSummaryLoading(false);
        }
        return;
      }

      try {
        const { data } = await axios.get(
          `/api/professional/me/customers/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );

        if (!isActive) return;

        setSummary({
          customer: data?.customer || null,
          guestInfo: data?.guestInfo || null,
          notes: Array.isArray(data?.notes) ? data.notes : [],
          bookings: Array.isArray(data?.bookings) ? data.bookings : [],
        });
        setSummaryLoading(false);
      } catch (error) {
        if (!isActive) return;

        setSummary(createEmptySummary());
        setSummaryError(
          error.response?.data?.error ||
            error.message ||
            "Failed to load customer details."
        );
        setSummaryLoading(false);
      }
    };

    loadSummary();

    return () => {
      isActive = false;
    };
  }, [customerId, customersState.items]);

  const canManageNotes = Boolean(summary.customer?._id || summary.guestInfo);

  const handleSelectCustomer = (id) => {
    if (!id || id === customerId) return;
    navigate(`/customers/${id}`);
  };

  const handleCreateNote = async (content) => {
    if (!customerId || !canManageNotes || notesRequest.busy) {
      return false;
    }

    const auth = getValidToken();
    if (!auth?.token) {
      setNotesRequest({ busy: false, error: "Authentication required." });
      return false;
    }

    const previousNotes = [...(summary.notes || [])];
    const temporaryNote = {
      _id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPending: true,
    };

    setSummary((prev) => ({
      ...prev,
      notes: [temporaryNote, ...prev.notes],
    }));
    setNotesRequest({ busy: true, error: null });

    try {
      const { data } = await axios.post(
        `/api/professional/me/customers/${customerId}/notes`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setSummary((prev) => ({
        ...prev,
        notes: Array.isArray(data?.notes) ? data.notes : previousNotes,
      }));
      setNotesRequest({ busy: false, error: null });
      return true;
    } catch (error) {
      setSummary((prev) => ({ ...prev, notes: previousNotes }));
      setNotesRequest({
        busy: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to save note.",
      });
      return false;
    }
  };

  const handleUpdateNote = async (noteId, content) => {
    if (!customerId || !canManageNotes || notesRequest.busy) {
      return false;
    }

    const auth = getValidToken();
    if (!auth?.token) {
      setNotesRequest({ busy: false, error: "Authentication required." });
      return false;
    }

    const previousNotes = [...(summary.notes || [])];
    const updatedNotes = previousNotes.map((note) =>
      note._id === noteId
        ? { ...note, content, updatedAt: new Date().toISOString(), isPending: true }
        : note
    );

    setSummary((prev) => ({ ...prev, notes: updatedNotes }));
    setNotesRequest({ busy: true, error: null });

    try {
      const { data } = await axios.put(
        `/api/professional/me/customers/${customerId}/notes/${noteId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setSummary((prev) => ({
        ...prev,
        notes: Array.isArray(data?.notes) ? data.notes : previousNotes,
      }));
      setNotesRequest({ busy: false, error: null });
      return true;
    } catch (error) {
      setSummary((prev) => ({ ...prev, notes: previousNotes }));
      setNotesRequest({
        busy: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to update note.",
      });
      return false;
    }
  };

  return (
    <div className="professional-customers-layout">
      <CustomerList
        customers={filteredCustomers}
        activeCustomerId={customerId}
        onSelect={handleSelectCustomer}
        loading={customersState.loading}
        error={customersState.error}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        hasAnyCustomers={customersState.items.length > 0}
      />
      <div className="customers-content">
        <CustomerDetail
          customer={summary.customer}
          guestInfo={summary.guestInfo}
          bookings={summary.bookings}
          loading={summaryLoading}
          error={summaryError}
        />
        <CustomerNotes
          notes={summary.notes}
          canEdit={canManageNotes}
          onCreateNote={handleCreateNote}
          onUpdateNote={handleUpdateNote}
          isProcessing={notesRequest.busy}
          error={notesRequest.error}
        />
        <AppointmentHistory
          bookings={summary.bookings}
          loading={summaryLoading}
          error={summaryError}
        />
      </div>
    </div>
  );
};

export default ProfessionalCustomers;
