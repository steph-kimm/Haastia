import React, { useEffect, useState } from "react";

const formatTimestamp = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return "";
  }
};

const CustomerNotes = ({
  notes,
  canEdit,
  onCreateNote,
  onUpdateNote,
  isProcessing,
  error,
}) => {
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const resetEditingState = () => {
    setEditingId(null);
    setEditingValue("");
  };

  useEffect(() => {
    if (!editingId) return;
    const exists = notes.some((note) => note._id === editingId);
    if (!exists) {
      resetEditingState();
    }
  }, [notes, editingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newNote.trim() || isProcessing || !canEdit) return;
    const success = await onCreateNote(newNote.trim());
    if (success) {
      setNewNote("");
    }
  };

  const beginEdit = (note) => {
    setEditingId(note._id);
    setEditingValue(note.content);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingId || !editingValue.trim() || isProcessing) return;
    const success = await onUpdateNote(editingId, editingValue.trim());
    if (success) {
      resetEditingState();
    }
  };

  return (
    <section className="customer-notes">
      <div className="customer-notes__header">
        <h2>Customer notes</h2>
        {!canEdit ? (
          <span className="customer-notes__badge">Guests cannot be noted</span>
        ) : null}
      </div>

      {error ? <p className="customer-notes__error">{error}</p> : null}

      {canEdit ? (
        <form className="customer-notes__form" onSubmit={handleSubmit}>
          <label htmlFor="customer-note" className="customer-notes__label">
            Add a quick reminder before your next appointment
          </label>
          <textarea
            id="customer-note"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="How was the last visit? Any follow-up needed?"
            disabled={isProcessing}
          />
          <div className="customer-notes__actions">
            <button type="submit" disabled={!newNote.trim() || isProcessing}>
              Save note
            </button>
          </div>
        </form>
      ) : null}

      {!notes.length ? (
        <div className="customer-notes__empty">
          <h3>No notes yet</h3>
          <p>
            {canEdit
              ? "Capture personal preferences, reminders, or follow-up tasks to deliver memorable service."
              : "Notes will unlock once this guest signs up and becomes a customer."}
          </p>
        </div>
      ) : (
        <ul className="customer-notes__list">
          {notes.map((note) => {
            const isEditing = editingId === note._id;
            return (
              <li key={note._id} className="customer-notes__item">
                <div className="customer-notes__meta">
                  <span>{formatTimestamp(note.updatedAt || note.createdAt)}</span>
                  {note.isPending ? (
                    <span className="customer-notes__status">Saving...</span>
                  ) : null}
                </div>
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="customer-notes__edit-form">
                    <textarea
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      disabled={isProcessing}
                    />
                    <div className="customer-notes__edit-actions">
                      <button type="submit" disabled={!editingValue.trim() || isProcessing}>
                        Update
                      </button>
                      <button
                        type="button"
                        className="customer-notes__cancel"
                        onClick={resetEditingState}
                        disabled={isProcessing}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="customer-notes__content">{note.content}</p>
                )}
                {!isEditing && canEdit ? (
                  <button
                    type="button"
                    className="customer-notes__edit"
                    onClick={() => beginEdit(note)}
                    disabled={isProcessing}
                  >
                    Edit
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CustomerNotes;
