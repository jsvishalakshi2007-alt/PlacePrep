import { useEffect, useState } from "react";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../api/noteApi";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} from "../api/resourceApi";
import {
  getStudyFiles,
  uploadStudyFile,
  downloadStudyFile,
  deleteStudyFile,
} from "../api/studyFileApi";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";

export default function NotesResources({ initialTab = "notes" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Resources state
  const [resources, setResources] = useState([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCategory, setResourceCategory] = useState("DSA");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceTags, setResourceTags] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [loadingResources, setLoadingResources] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [showResourceFavorites, setShowResourceFavorites] = useState(false);

  // Files state
  const [studyFiles, setStudyFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [refreshNotesKey, setRefreshNotesKey] = useState(0);
  const [refreshResourcesKey, setRefreshResourcesKey] = useState(0);
  const [refreshFilesKey, setRefreshFilesKey] = useState(0);

  // Fetch Notes effect
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "notes") {
      async function loadNotesData() {
        try {
          const data = await getNotes({
            search: search.trim() || undefined,
            favorite: showFavorites ? "true" : undefined,
          });
          if (isMounted) {
            setNotes(Array.isArray(data) ? data : data.notes || []);
            setNotesError("");
          }
        } catch (err) {
          if (isMounted) {
            setNotesError(err.message || "Unable to load notes.");
          }
        } finally {
          if (isMounted) {
            setLoadingNotes(false);
          }
        }
      }

      loadNotesData();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, search, showFavorites, refreshNotesKey]);

  // Fetch Resources effect
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "resources") {
      async function loadResourcesData() {
        try {
          const data = await getResources({
            search: resourceSearch.trim() || undefined,
            favorite: showResourceFavorites ? "true" : undefined,
          });
          if (isMounted) {
            setResources(Array.isArray(data) ? data : data.resources || []);
            setResourceError("");
          }
        } catch (err) {
          if (isMounted) {
            setResourceError(err.message || "Unable to load resources.");
          }
        } finally {
          if (isMounted) {
            setLoadingResources(false);
          }
        }
      }

      loadResourcesData();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, resourceSearch, showResourceFavorites, refreshResourcesKey]);

  // Fetch Files effect
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "files") {
      async function loadFilesData() {
        try {
          const data = await getStudyFiles();
          if (isMounted) {
            setStudyFiles(Array.isArray(data) ? data : data.files || []);
            setFileError("");
          }
        } catch (err) {
          if (isMounted) {
            setFileError(err.message || "Unable to load study files.");
          }
        } finally {
          if (isMounted) {
            setLoadingFiles(false);
          }
        }
      }

      loadFilesData();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshFilesKey]);

  // Notes handlers
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    setNotesError("");
    try {
      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        content: content.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      if (editingId) {
        await updateNote(editingId, payload);
      } else {
        await createNote(payload);
      }

      setEditingId(null);
      setTitle("");
      setSubject("");
      setContent("");
      setTags("");
      setRefreshNotesKey((k) => k + 1);
    } catch (err) {
      setNotesError(err.message || "Unable to save note.");
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteNote(id);
      if (editingId === id) setEditingId(null);
      setRefreshNotesKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  const handleToggleNoteFavorite = async (note) => {
    try {
      await updateNote(note._id, { isFavorite: !note.isFavorite });
      setRefreshNotesKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to update favorite.");
    }
  };

  // Resource handlers
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    setResourceError("");
    try {
      const payload = {
        title: resourceTitle.trim(),
        url: resourceUrl.trim(),
        category: resourceCategory,
        description: resourceDescription.trim(),
        tags: resourceTags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      if (editingResourceId) {
        await updateResource(editingResourceId, payload);
      } else {
        await createResource(payload);
      }

      setEditingResourceId(null);
      setResourceTitle("");
      setResourceUrl("");
      setResourceDescription("");
      setResourceTags("");
      setRefreshResourcesKey((k) => k + 1);
    } catch (err) {
      setResourceError(err.message || "Unable to save resource.");
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Delete this resource link?")) return;
    try {
      await deleteResource(id);
      setRefreshResourcesKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  const handleToggleResourceFavorite = async (res) => {
    try {
      await updateResource(res._id, { isFavorite: !res.isFavorite });
      setRefreshResourcesKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to update favorite.");
    }
  };

  // File handlers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setFileError("");
    try {
      await uploadStudyFile(file);
      setRefreshFilesKey((k) => k + 1);
    } catch (err) {
      setFileError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleFileDownload = async (file) => {
    try {
      await downloadStudyFile(file._id, file.originalName);
    } catch (err) {
      alert(err.message || "Download failed.");
    }
  };

  const handleFileDelete = async (id) => {
    if (!window.confirm("Delete this study file?")) return;
    try {
      await deleteStudyFile(id);
      setRefreshFilesKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  return (
    <div>
      {/* Tab Switcher */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "24px",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          style={{
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: "14px",
            color: activeTab === "notes" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "notes" ? "2px solid var(--color-primary)" : "2px solid transparent",
            borderRadius: "0",
          }}
        >
          Study Notes ({notes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("resources")}
          style={{
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: "14px",
            color: activeTab === "resources" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "resources" ? "2px solid var(--color-primary)" : "2px solid transparent",
            borderRadius: "0",
          }}
        >
          Curated Links ({resources.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("files")}
          style={{
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: "14px",
            color: activeTab === "files" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "files" ? "2px solid var(--color-primary)" : "2px solid transparent",
            borderRadius: "0",
          }}
        >
          Study Documents ({studyFiles.length})
        </button>
      </div>

      {/* 1. NOTES TAB */}
      {activeTab === "notes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Note Editor Form */}
          <div className="card">
            <div className="card-header">
              <h2>{editingId ? "Edit Note" : "Create New Note"}</h2>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setSubject("");
                    setContent("");
                    setTags("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            {notesError && (
              <div style={{ color: "var(--color-danger)", marginBottom: "12px", fontSize: "12px" }}>
                {notesError}
              </div>
            )}

            <form onSubmit={handleNoteSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Operating System Deadlock Conditions"
                />
              </div>

              <div className="form-group">
                <label>Subject / Topic *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Core CS, System Design, DSA"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. OS, semaphore, interview-prep"
                />
              </div>

              <div className="form-group">
                <label>Note Content *</label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write clear, revision-friendly bullet points..."
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                {editingId ? "Update Note" : "Save Note"}
              </button>
            </form>
          </div>

          {/* Notes List */}
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={`btn btn-sm ${showFavorites ? "btn-primary" : "btn-outline"}`}
                onClick={() => setShowFavorites(!showFavorites)}
              >
                ★ Favorites
              </button>
            </div>

            {loadingNotes ? (
              <p style={{ color: "var(--color-text-muted)" }}>Loading notes...</p>
            ) : notes.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon="✎"
                  title="No notes yet"
                  message="Capture key interview formulas, concepts, and interview summaries."
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {notes.map((note) => (
                  <div key={note._id} className="card" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{note.title}</strong>
                        <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                          Subject: {note.subject}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleNoteFavorite(note)}
                        style={{
                          fontSize: "18px",
                          color: note.isFavorite ? "#F59E0B" : "var(--color-border)",
                        }}
                      >
                        ★
                      </button>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--color-text-primary)", whiteSpace: "pre-line", margin: "8px 0" }}>
                      {note.content}
                    </p>

                    {note.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", margin: "8px 0" }}>
                        {note.tags.map((t) => (
                          <Badge key={t} variant="green">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setEditingId(note._id);
                          setTitle(note.title);
                          setSubject(note.subject);
                          setContent(note.content);
                          setTags((note.tags || []).join(", "));
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteNote(note._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. RESOURCES TAB */}
      {activeTab === "resources" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Resource Form */}
          <div className="card">
            <div className="card-header">
              <h2>{editingResourceId ? "Edit Link" : "Bookmark Web Resource"}</h2>
              {editingResourceId && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setEditingResourceId(null);
                    setResourceTitle("");
                    setResourceUrl("");
                    setResourceDescription("");
                    setResourceTags("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            {resourceError && (
              <div style={{ color: "var(--color-danger)", marginBottom: "12px", fontSize: "12px" }}>
                {resourceError}
              </div>
            )}

            <form onSubmit={handleResourceSubmit}>
              <div className="form-group">
                <label>Resource Title *</label>
                <input
                  type="text"
                  required
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. NeetCode 150 Sheet, Striver SDE Sheet"
                />
              </div>

              <div className="form-group">
                <label>URL / Link *</label>
                <input
                  type="url"
                  required
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={resourceCategory}
                  onChange={(e) => setResourceCategory(e.target.value)}
                >
                  <option value="DSA">DSA Sheets & Roadmaps</option>
                  <option value="System Design">System Design & Architecture</option>
                  <option value="CS Fundamentals">OS, DBMS & Networks</option>
                  <option value="Behavioral">HR & Behavioral Practice</option>
                  <option value="Company Guides">Company Specific Archives</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  placeholder="Key problems to review, why this guide is useful..."
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={resourceTags}
                  onChange={(e) => setResourceTags(e.target.value)}
                  placeholder="e.g. roadmap, striver, free"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                {editingResourceId ? "Update Link" : "Bookmark Link"}
              </button>
            </form>
          </div>

          {/* Resources List */}
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <input
                type="text"
                placeholder="Search web resources..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={`btn btn-sm ${showResourceFavorites ? "btn-primary" : "btn-outline"}`}
                onClick={() => setShowResourceFavorites(!showResourceFavorites)}
              >
                ★ Favorites
              </button>
            </div>

            {loadingResources ? (
              <p style={{ color: "var(--color-text-muted)" }}>Loading links...</p>
            ) : resources.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon="🔗"
                  title="No resources bookmarked"
                  message="Save valuable placement sheets, YouTube lectures, and interview cheat sheets."
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {resources.map((res) => (
                  <div key={res._id} className="card" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{res.title}</strong>
                        <Badge variant="blue" style={{ marginLeft: "8px" }}>
                          {res.category}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleResourceFavorite(res)}
                        style={{
                          fontSize: "18px",
                          color: res.isFavorite ? "#F59E0B" : "var(--color-border)",
                        }}
                      >
                        ★
                      </button>
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        fontSize: "12px",
                        color: "var(--color-accent)",
                        margin: "6px 0",
                        textDecoration: "underline",
                      }}
                    >
                      {res.url} &rarr;
                    </a>

                    {res.description && (
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                        {res.description}
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setEditingResourceId(res._id);
                          setResourceTitle(res.title);
                          setResourceUrl(res.url);
                          setResourceCategory(res.category);
                          setResourceDescription(res.description || "");
                          setResourceTags((res.tags || []).join(", "));
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteResource(res._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STUDY FILES TAB */}
      {activeTab === "files" && (
        <div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-header">
              <h2>Upload Study Documents (PDF, DOC, DOCX, TXT)</h2>
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "14px" }}>
              Upload resumes, placement manuals, and cheat sheets (up to 5 MB per file).
            </p>

            {fileError && (
              <div style={{ color: "var(--color-danger)", marginBottom: "12px", fontSize: "12px" }}>
                {fileError}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && <span>Uploading document securely...</span>}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Your Uploaded Placement Documents</h2>
            </div>

            {loadingFiles ? (
              <p style={{ color: "var(--color-text-muted)" }}>Loading documents...</p>
            ) : studyFiles.length === 0 ? (
              <EmptyState
                icon="📁"
                title="No documents uploaded yet"
                message="Keep copies of your master resume, ATS versions, and cheat sheets in one secure location."
              />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>File Size</th>
                      <th>Uploaded On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studyFiles.map((file) => (
                      <tr key={file._id}>
                        <td>
                          <strong>{file.originalName}</strong>
                        </td>
                        <td>{(file.size / 1024).toFixed(1)} KB</td>
                        <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleFileDownload(file)}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleFileDelete(file._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
