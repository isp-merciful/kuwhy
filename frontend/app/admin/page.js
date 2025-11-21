"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API = "http://localhost:8000/api";

const flattenComments = (comments, level = 0) => {
  let arr = [];
  comments.forEach((c) => {
    arr.push({ ...c, level });
    if (Array.isArray(c.children) && c.children.length > 0) {
      arr = arr.concat(flattenComments(c.children, level + 1));
    }
  });
  return arr;
};

function isImageUrl(val) {
  if (typeof val !== "string") return false;
  return val.match(/\.(jpeg|jpg|gif|png|webp)$/i);
}

function formatDateTime(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && !!session?.apiToken;
  const authHeaders = authed
    ? { Authorization: `Bearer ${session.apiToken}` }
    : {};

  // --- top-level tab ---
  const [tab, setTab] = useState("reports"); 

  // --- reports state ---
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStatus, setReportStatus] = useState("pending"); 

  // --- punishments state ---
  const [punishList, setPunishList] = useState([]);
  const [punishLoading, setPunishLoading] = useState(false);
  const [showExpiredPunish, setShowExpiredPunish] = useState(false);

  // --- raw data state ---
  const dataCategories = ["user", "note", "blog", "comment"];
  const [dataCategory, setDataCategory] = useState("note");
  const [dataSort, setDataSort] = useState("DESC");
  const [dataRows, setDataRows] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  /* ===================== Reports ===================== */

  async function fetchReports() {
    setReportsLoading(true);
    try {
      const qs = reportStatus === "pending" ? "?status=pending" : "";
      const res = await fetch(`${API}/report${qs}`, {
        cache: "no-store",
        headers: {
          ...authHeaders,
        },
      });
      const json = await res.json().catch(() => ({}));

      const items = Array.isArray(json)
        ? json
        : Array.isArray(json?.reports)
        ? json.reports
        : [];

      items.sort((a, b) => {
        const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bT - aT;
      });

      setReports(items);
    } catch (e) {
      console.error("[Admin] fetchReports failed:", e);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }

  function getReportId(r) {
    return r.id ?? r.report_id;
  }

  function getTargetInfo(r) {
    const type = r.target_type || r.type || "";
    let id =
      r.target_id ??
      r.note_id ??
      r.blog_id ??
      r.comment_id ??
      r.party_message_id;
    return { type, id };
  }

  async function handleReportAction(report, action) {
    const reportId = getReportId(report);
    const { type, id: targetId } = getTargetInfo(report);
    const targetUserId = report.target_user_id || report.user_id || null;
    const ipAddress = report.ip_address || report.ip || null;

    try {
      if (action === "delete_target") {
        if (!type || !targetId) {
          alert("Cannot detect target to delete.");
          return;
        }

        let path = null;
        if (type === "note") path = `note/${targetId}`;
        else if (type === "blog") path = `blog/${targetId}`;
        else if (type === "comment") path = `comment/${targetId}`;
        else if (type === "party_chat" || type === "party_message") {
          path = `chat/party-message/${targetId}`;
        }

        if (!path) {
          alert(`Unknown target type: ${type}`);
          return;
        }

        const ok = window.confirm(
          `Delete this ${type} (id=${targetId})? This cannot be undone.`
        );
        if (!ok) return;

        const res = await fetch(`${API}/${path}`, {
          method: "DELETE",
          headers: {
            ...authHeaders,
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err?.error || "Delete failed");
          return;
        }

        if (reportId) {
          await fetch(`${API}/report/${reportId}/resolve`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({ status: "resolved" }),
          }).catch(() => {});
        }

        await fetchReports();
        return;
      }

      if (action === "timeout_24h" || action === "ban_user" || action === "ban_ip") {
        if (!targetUserId && action !== "ban_ip") {
          alert("No target_user_id on this report.");
          return;
        }

        if (action === "ban_ip" && !ipAddress) {
          alert("No IP address on this report to ban.");
          return;
        }

        const kind =
          action === "timeout_24h"
            ? "timeout"
            : action === "ban_user"
            ? "ban_user"
            : "ban_ip";

        const minutes = action === "timeout_24h" ? 24 * 60 : null;

        const reason =
          report.detail ||
          report.reason ||
          `Auto from report ${reportId || ""} (${type || "unknown"})`;

        const payload = {
          user_id: targetUserId || undefined,
          kind,
          minutes,
          reason,
          report_id: reportId || undefined,
          ip_address: action === "ban_ip" ? ipAddress : undefined,
        };

        const confirmMsg =
          action === "timeout_24h"
            ? `Timeout user ${targetUserId} for 24h?`
            : action === "ban_user"
            ? `BAN user ${targetUserId} permanently?`
            : `BAN IP ${ipAddress} ?`;

        if (!window.confirm(confirmMsg)) return;

        const res = await fetch(`${API}/punish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err?.error || "Punish failed");
          return;
        }

        if (reportId) {
          await fetch(`${API}/report/${reportId}/resolve`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              status: "resolved",
              resolution_action: kind,
            }),
          }).catch(() => {});
        }

        await Promise.all([fetchReports(), fetchPunish()]);
        return;
      }

      if (action === "mark_resolved") {
        if (!reportId) return;
        const res = await fetch(`${API}/report/${reportId}/resolve`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ status: "resolved" }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err?.error || "Update failed");
          return;
        }
        await fetchReports();
        return;
      }
    } catch (e) {
      console.error("[Admin] handleReportAction error:", e);
      alert("Action failed, check console / network tab.");
    }
  }


  async function fetchPunish() {
    setPunishLoading(true);
    try {
      const qs = showExpiredPunish ? "?includeExpired=1" : "";
      const res = await fetch(`${API}/punish${qs}`, {
        cache: "no-store",
        headers: {
          ...authHeaders,
        },
      });
      const json = await res.json().catch(() => ({}));

      const items = Array.isArray(json)
        ? json
        : Array.isArray(json?.items)
        ? json.items
        : [];

      items.sort((a, b) => {
        const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bT - aT;
      });

      setPunishList(items);
    } catch (e) {
      console.error("[Admin] fetchPunish failed:", e);
      setPunishList([]);
    } finally {
      setPunishLoading(false);
    }
  }

  function getPunishId(p) {
    return p.id ?? p.punish_id;
  }

  function isPunishActive(p) {
    const until = p.until || p.expires_at;
    if (!until) return true;
    try {
      return new Date(until).getTime() > Date.now();
    } catch {
      return true;
    }
  }

  async function handleUnban(p) {
    const id = getPunishId(p);
    if (!id) return;
    const ok = window.confirm("Lift this punishment? (unban / end timeout)");
    if (!ok) return;

    try {
      const res = await fetch(`${API}/punish/${id}/unban`, {
        method: "PATCH",
        headers: {
          ...authHeaders,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || "Unban failed");
        return;
      }
      await fetchPunish();
    } catch (e) {
      console.error("[Admin] unban failed:", e);
      alert("Unban failed, see console.");
    }
  }


  async function fetchRawData() {
    setDataLoading(true);
    try {
      const apiUrl = `${API}/${dataCategory}`;
      const res = await fetch(apiUrl, {
        cache: "no-store",
        headers: {
          ...authHeaders,
        },
      });
      const json = await res.json().catch(() => ({}));

      let items = [];
      if (dataCategory === "comment" && json.comment) {
        items = flattenComments(json.comment);
      } else {
        items = Array.isArray(json) ? json : [];
      }

      items.sort((a, b) => {
        let keyA =
          a.created_at ?? a.id ?? a.user_id ?? a.note_id ?? a.blog_id;
        let keyB =
          b.created_at ?? b.id ?? b.user_id ?? b.note_id ?? b.blog_id;
        let valA = a.created_at ? new Date(keyA) : keyA;
        let valB = b.created_at ? new Date(keyB) : keyB;
        return dataSort === "ASC" ? valA - valB : valB - valA;
      });

      setDataRows(items);
    } catch (err) {
      console.error("[Admin] fetchRawData:", err);
      setDataRows([]);
    } finally {
      setDataLoading(false);
    }
  }

  const handleRawDelete = async (item) => {
    let idToDelete;
    let cat = dataCategory;

    switch (cat) {
      case "comment":
        idToDelete = item.comment_id;
        break;
      case "note":
        idToDelete = item.note_id;
        break;
      case "blog":
        idToDelete = item.blog_id;
        break;
      case "user":
        idToDelete = item.user_id;
        break;
      default:
        console.error("Unknown category");
        return;
    }

    if (!idToDelete) return;

    if (
      !window.confirm(
        `Are you sure you want to delete this ${cat} (id=${idToDelete})?`
      )
    )
      return;

    try {
      const res = await fetch(`${API}/${cat}/${idToDelete}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || "Delete failed");
        return;
      }
      fetchRawData();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToComment = (id) => {
    const el = document.getElementById(`comment-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };


  useEffect(() => {
    if (tab === "reports") {
      fetchReports();
    }
  }, [tab, reportStatus, authed]);

  useEffect(() => {
    if (tab === "punishments") {
      fetchPunish();
    }
  }, [tab, showExpiredPunish, authed]);

  useEffect(() => {
    if (tab === "data") {
      fetchRawData();
    }
  }, [tab, dataCategory, dataSort, authed]);

  /* ===================== Render ===================== */

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading session…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Admin only
        </h1>
        <p className="text-sm text-slate-500">
          Please sign in as an admin to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold mb-4 text-center text-slate-900">
        Admin Panel
      </h1>
      <p className="text-center text-sm text-slate-500 mb-6">
        Moderate reports, manage punishments, and inspect raw data.
      </p>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { key: "reports", label: "Reports" },
          { key: "punishments", label: "Punishments" },
          { key: "data", label: "Raw data" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              tab === t.key
                ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- Tab: Reports ---------- */}
      {tab === "reports" && (
        <div className="max-w-5xl mx-auto">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                Show:
              </span>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm bg-white"
              >
                <option value="pending">Pending only</option>
                <option value="all">All reports</option>
              </select>
            </div>
            <p className="text-xs text-slate-400">
              Tip: Use quick actions to moderate and auto-resolve reports.
            </p>
          </div>

          {reportsLoading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No reports found.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const id = getReportId(r);
                const status = r.status || "pending";
                const { type, id: targetId } = getTargetInfo(r);
                const reporterLogin =
                  r.reporter_login || r.reporter_handle || r.reporter_name;
                const targetLogin =
                  r.target_login || r.target_handle || r.target_name;
                const targetUserId = r.target_user_id || r.user_id;
                const isPending = status === "pending";

                const detailText =
                  r.detail || r.details || r.reason || r.message || "";

                return (
                  <div
                    key={id || `report-${Math.random()}`}
                    className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-3"
                  >
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-slate-500">
                          #{id || "?"}
                        </span>
                        <span className="text-slate-700 font-medium">
                          {type || "Unknown"}
                        </span>
                        {targetId && (
                          <span className="text-xs text-slate-400">
                            • targetId: {targetId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            isPending
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(r.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Reporter / Target */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-slate-500 font-semibold">
                          Reporter
                        </div>
                        <div className="text-slate-700">
                          id:{" "}
                          <span className="font-mono text-[11px]">
                            {r.reporter_id || "-"}
                          </span>
                        </div>
                        <div className="text-slate-700">
                          login:{" "}
                          <span className="font-mono text-[11px]">
                            {reporterLogin || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-500 font-semibold">
                          Target user
                        </div>
                        <div className="text-slate-700">
                          id:{" "}
                          <span className="font-mono text-[11px]">
                            {targetUserId || "-"}
                          </span>
                        </div>
                        <div className="text-slate-700">
                          login:{" "}
                          <span className="font-mono text-[11px]">
                            {targetLogin || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detail */}
                    {detailText && (
                      <div className="text-sm text-slate-800 bg-slate-50 rounded-lg px-3 py-2">
                        <span className="font-semibold text-slate-600 text-xs uppercase">
                          Detail:
                        </span>{" "}
                        {detailText}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 justify-between items-center pt-1 border-t border-slate-100 mt-1">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAction(r, "delete_target")
                          }
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        >
                          Delete content
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAction(r, "timeout_24h")
                          }
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                        >
                          Timeout 24h
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReportAction(r, "ban_user")}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        >
                          Ban user
                        </button>
                        <button
                          type="button"
                          disabled={!r.ip_address && !r.ip}
                          onClick={() => handleReportAction(r, "ban_ip")}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            r.ip_address || r.ip
                              ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          }`}
                        >
                          Ban IP
                        </button>
                      </div>

                      {isPending && (
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAction(r, "mark_resolved")
                          }
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        >
                          Mark resolved
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------- Tab: Punishments ---------- */}
      {tab === "punishments" && (
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300"
                  checked={showExpiredPunish}
                  onChange={(e) => setShowExpiredPunish(e.target.checked)}
                />
                <span>Show expired / past punishments</span>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Active punishments are highlighted.
            </p>
          </div>

          {punishLoading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : punishList.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No punishments found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Kind</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Until</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {punishList.map((p) => {
                    const id = getPunishId(p);
                    const active = isPunishActive(p);
                    const kind = p.kind || p.type || "-";
                    const userId = p.user_id || "-";
                    const login =
                      p.login_name || p.user_login || p.user_handle || "";

                    return (
                      <tr
                        key={id || `punish-${Math.random()}`}
                        className="border-t border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-3 py-2 text-xs font-mono text-slate-500">
                          {id}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-800">
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px]">
                              {userId}
                            </span>
                            {login && (
                              <span className="text-[11px] text-slate-500">
                                @{login}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-800">
                          {kind}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-700 max-w-xs truncate">
                          {p.reason || "-"}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-500">
                          {formatDateTime(p.created_at)}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-500">
                          {formatDateTime(p.until || p.expires_at)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                              active
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}
                          >
                            {active ? "active" : "expired"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {active ? (
                            <button
                              type="button"
                              onClick={() => handleUnban(p)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            >
                              Lift punishment
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- Tab: Raw data ---------- */}
      {tab === "data" && (
        <div className="max-w-6xl mx-auto">
          {/* Controls */}
          <div className="flex flex-wrap justify-between gap-4 mb-4 items-center">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="mr-2 font-semibold text-sm text-slate-700">
                  Category:
                </label>
                <select
                  className="border rounded px-2 py-1 text-sm bg-white"
                  value={dataCategory}
                  onChange={(e) => setDataCategory(e.target.value)}
                >
                  {dataCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mr-2 font-semibold text-sm text-slate-700">
                  Sort:
                </label>
                <select
                  className="border rounded px-2 py-1 text-sm bg-white"
                  value={dataSort}
                  onChange={(e) => setDataSort(e.target.value)}
                >
                  <option value="DESC">Newest First</option>
                  <option value="ASC">Oldest First</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Low-level view of raw tables. Use with care.
            </p>
          </div>

          {/* Table */}
          {dataLoading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    {dataRows[0] &&
                      Object.keys(dataRows[0])
                        .filter((k) => k !== "children")
                        .map((key) => (
                          <th
                            key={key}
                            className="text-center px-4 py-2 border-b border-gray-300 text-xs font-semibold"
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </th>
                        ))}
                    {dataCategory === "comment" && (
                      <th className="px-4 py-2 border-b border-gray-300 text-center text-xs font-semibold">
                        Children
                      </th>
                    )}
                    <th className="px-4 py-2 border-b border-gray-300 text-center text-xs font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dataRows.length > 0 ? (
                    dataRows.map((item, rowIndex) => {
                      const uniqueKey =
                        (item.comment_id ||
                          item.id ||
                          item.user_id ||
                          item.note_id ||
                          item.blog_id ||
                          "row") + "-" + rowIndex;

                      return (
                        <tr
                          key={uniqueKey}
                          id={
                            dataCategory === "comment"
                              ? `comment-${item.comment_id}`
                              : undefined
                          }
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          {Object.entries(item)
                            .filter(([k]) => k !== "children")
                            .map(([key, val], colIndex) => (
                              <td
                                key={colIndex}
                                className="px-4 py-2 text-center text-xs text-slate-800"
                              >
                                {val === null || val === undefined
                                  ? "null"
                                  : isImageUrl(val)
                                  ? (
                                    <img
                                      src={val}
                                      alt={key}
                                      className="w-12 h-12 object-cover rounded-full mx-auto"
                                    />
                                    )
                                  : typeof val === "string" &&
                                    val.length > 50
                                  ? `${val.slice(0, 48)}…`
                                  : val.toString()}
                              </td>
                            ))}

                          {/* Children column for comments */}
                          {dataCategory === "comment" && (
                            <td className="px-4 py-2 text-center text-xs">
                              {Array.isArray(item.children) &&
                              item.children.length > 0 ? (
                                <button
                                  className="text-blue-500 underline hover:text-blue-700"
                                  onClick={() =>
                                    scrollToComment(
                                      item.children[0].comment_id
                                    )
                                  }
                                >
                                  {item.children.length}
                                </button>
                              ) : (
                                "0"
                              )}
                            </td>
                          )}

                          {/* Delete column */}
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleRawDelete(item)}
                              className="bg-red-500 text-white px-3 py-1 rounded-full text-xs hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          (dataRows[0]
                            ? Object.keys(dataRows[0]).length
                            : 0) + 2
                        }
                        className="text-center px-4 py-4 text-gray-500 text-sm"
                      >
                        No data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
