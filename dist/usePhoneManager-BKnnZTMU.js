import { jsx as t, jsxs as o, Fragment as W } from "react/jsx-runtime";
import { useState as p, useRef as j, useEffect as I, useCallback as k, createContext as q, useContext as G } from "react";
import { J as F, d as Q, c as _, f as $, P as X } from "./index-C6FtpsEs.js";
let z = null, B = null;
function Y(e) {
  return `${e.websocketUrl}|${e.sipUri}|${e.authorizationUser}`;
}
function Z(e) {
  const m = Y(e);
  if (z && B === m)
    return z;
  if (z && B !== m) {
    try {
      z.ua.stop();
    } catch {
    }
    z = null;
  }
  B = m;
  const i = {
    sockets: [new F.WebSocketInterface(e.websocketUrl)],
    uri: e.sipUri,
    password: e.password,
    registrar_server: e.registrarServer,
    display_name: e.displayName,
    authorization_user: e.authorizationUser,
    connection_recovery_min_interval: 2,
    connection_recovery_max_interval: 30
  }, a = new F.UA(i), g = document.createElement("audio");
  g.autoplay = !0;
  const h = {
    ua: a,
    audio: g,
    isStarted: !1,
    listeners: /* @__PURE__ */ new Set()
  };
  return a.on("connecting", () => {
    h.listeners.forEach((r) => r.onConnecting?.());
  }), a.on("connected", () => {
    h.listeners.forEach((r) => r.onConnected?.());
  }), a.on("disconnected", () => {
    h.listeners.forEach((r) => r.onDisconnected?.());
  }), a.on("registered", () => {
    h.listeners.forEach((r) => r.onRegistered?.());
  }), a.on("unregistered", () => {
    h.listeners.forEach((r) => r.onUnregistered?.());
  }), a.on("registrationFailed", (r) => {
    h.listeners.forEach((l) => l.onRegistrationFailed?.(r?.cause));
  }), a.on("newRTCSession", (r) => {
    const l = r.session;
    l.direction === "outgoing" && (h.listeners.forEach((d) => d.onNewSession?.(l)), l.connection && (l.connection.addEventListener("addstream", (d) => {
      var x = document.createElement("audio");
      d.streams !== void 0 && d.streams.length !== 0 && (x.srcObject = d.streams[0], x.play());
    }), l.connection.addEventListener("track", (d) => {
      var x = document.createElement("audio");
      x.srcObject = d.streams[0], x.play();
    })));
  }), z = h, h;
}
function ee(e) {
  e.isStarted || (e.ua.start(), e.isStarted = !0);
}
function te(e, m) {
  e.listeners.add(m);
}
function ne(e, m) {
  e.listeners.delete(m);
}
function re(e) {
  return {
    isReady: e.ua.isRegistered(),
    isConnected: e.ua.isConnected()
  };
}
const K = q(null);
function se({
  config: e,
  children: m,
  onCallStart: u,
  onCallEnd: i,
  onStatusChange: a
}) {
  const [g, h] = p(""), [r, l] = p("disconnected"), [d, x] = p(null), [P, N] = p(0), [s, M] = p([]), [b, f] = p(!1), [H, S] = p("connecting"), y = j(null), v = j(null), D = j(null);
  I(() => {
    v.current = d;
  }, [d]), I(() => {
    const n = Z(e);
    D.current = n;
    const C = re(n);
    C.isReady ? (f(!0), S("connected")) : C.isConnected && S("connected");
    const R = {
      onConnecting: () => S("connecting"),
      onConnected: () => S("connected"),
      onDisconnected: () => {
        S("disconnected"), f(!1);
      },
      onRegistered: () => {
        f(!0), S("connected");
      },
      onUnregistered: () => f(!1),
      onRegistrationFailed: (E) => {
        console.error("Registration failed:", E), f(!1), S("failed");
      },
      onNewSession: (E) => {
        y.current = E;
      }
    };
    return te(n, R), ee(n), () => {
      ne(n, R);
    };
  }, [e.websocketUrl, e.sipUri, e.password, e.registrarServer, e.displayName, e.authorizationUser]), I(() => {
    a?.(r);
  }, [r, a]), I(() => {
    const n = localStorage.getItem("tbi-phone-call-history");
    if (n)
      try {
        M(JSON.parse(n));
      } catch (C) {
        console.error("Error loading call history", C);
      }
  }, []), I(() => {
    s.length > 0 && localStorage.setItem("tbi-phone-call-history", JSON.stringify(s));
  }, [s]), I(() => {
    if (r === "confirmed" && d) {
      const n = setInterval(() => {
        N(Math.floor((Date.now() - d) / 1e3));
      }, 1e3);
      return () => clearInterval(n);
    } else
      N(0);
  }, [r, d]), I(() => {
    const n = (C) => {
      const R = C.detail.number;
      r === "disconnected" && L(R);
    };
    return window.addEventListener("StartCallEvent", n), () => {
      window.removeEventListener("StartCallEvent", n);
    };
  }, [r]);
  const U = k((n, C, R) => {
    const E = {
      id: Date.now().toString(),
      number: n,
      timestamp: Date.now(),
      duration: C,
      status: R
    };
    M((w) => [E, ...w].slice(0, 50));
  }, []), A = k(() => {
    y.current && (y.current.terminate(), y.current = null);
  }, []), L = k((n) => {
    const C = D.current;
    if (!n.trim() || !C) return;
    if (!b) {
      console.warn("Phone is not ready yet. Please wait for registration.");
      return;
    }
    h(n), u?.(n);
    const E = {
      eventHandlers: {
        progress: () => {
          l("progress");
        },
        failed: (w) => {
          console.error("Call failed:", w?.cause), l("failed"), U(n, 0, "failed"), i?.(n, 0, "failed"), y.current = null, setTimeout(() => l("disconnected"), 3e3);
        },
        ended: () => {
          l("ended");
          const w = v.current, V = w ? Math.floor((Date.now() - w) / 1e3) : 0;
          U(n, V, "completed"), i?.(n, V, "completed"), y.current = null, setTimeout(() => {
            l("disconnected"), x(null);
          }, 2e3);
        },
        confirmed: () => {
          l("confirmed"), x(Date.now());
        }
      },
      mediaConstraints: { audio: !0, video: !1 }
    };
    l("progress");
    try {
      const w = C.ua.call(n, E);
      y.current = w;
    } catch (w) {
      console.error("Failed to start call:", w), l("failed"), U(n, 0, "failed"), setTimeout(() => l("disconnected"), 3e3);
    }
  }, [U, u, i, b]), c = {
    status: r,
    callNumber: g,
    setCallNumber: h,
    callHistory: s,
    currentCallDuration: P,
    startCall: L,
    endCall: A,
    isReady: b,
    connectionStatus: H
  };
  return /* @__PURE__ */ t(K.Provider, { value: c, children: m });
}
function oe() {
  const e = G(K);
  if (!e)
    throw new Error("usePhone must be used within a PhoneProvider");
  return e;
}
const O = ({ className: e }) => /* @__PURE__ */ t("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ t("path", { d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" }) }), ae = ({ className: e }) => /* @__PURE__ */ t("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ t("path", { d: "M15.05 5A7 7 0 0 1 19 8.95M15.05 1A11 11 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }) }), le = ({ className: e }) => /* @__PURE__ */ t("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ t("path", { d: "M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.12-.74-.03-1.02.24l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" }) }), T = ({ className: e }) => /* @__PURE__ */ t("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ t("path", { d: "M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" }) }), J = ({ className: e }) => /* @__PURE__ */ t("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ t("path", { d: "M6.5 5.5 12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z" }) }), ce = ({ className: e }) => /* @__PURE__ */ o("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: [
  /* @__PURE__ */ t("path", { d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" }),
  /* @__PURE__ */ t("path", { d: "M16 3l-5 5-2-2-1.5 1.5L11 11l6.5-6.5z" })
] }), ie = ({ className: e }) => /* @__PURE__ */ o("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: [
  /* @__PURE__ */ t("path", { d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" }),
  /* @__PURE__ */ t("path", { d: "M19 6.41L17.59 5 15 7.59 12.41 5 11 6.41 13.59 9 11 11.59 12.41 13 15 10.41 17.59 13 19 11.59 16.41 9z" })
] }), de = ({ className: e }) => /* @__PURE__ */ t("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ t("path", { d: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" }) }), ue = ({ className: e }) => /* @__PURE__ */ t("svg", { className: e, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ t("path", { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" }) });
function he({ className: e, labels: m }) {
  const {
    status: u,
    callNumber: i,
    setCallNumber: a,
    callHistory: g,
    currentCallDuration: h,
    startCall: r,
    endCall: l,
    isReady: d,
    connectionStatus: x
  } = oe(), [P, N] = p(!1), s = { ...Q, ...m }, b = (() => {
    switch (u) {
      case "progress":
        return { text: `${s.calling}...`, color: "text-yellow-500", Icon: ae };
      case "confirmed":
        return { text: `${s.inCall} - ${$(h)}`, color: "text-green-500", Icon: le };
      case "failed":
        return { text: s.callEnded, color: "text-red-500", Icon: J };
      case "ended":
        return { text: s.callEnded, color: "text-gray-500", Icon: T };
      default:
        return { text: s.inactive, color: "text-gray-300", Icon: O };
    }
  })();
  return /* @__PURE__ */ o("div", { className: _(
    "tbi-phone w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-2",
    e
  ), children: [
    u === "disconnected" && /* @__PURE__ */ o("div", { className: "flex gap-2 items-center", children: [
      /* @__PURE__ */ t(
        "button",
        {
          onClick: () => N(!0),
          className: "h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors",
          type: "button",
          children: /* @__PURE__ */ t(de, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ t(
        "input",
        {
          type: "text",
          value: i,
          onChange: (f) => a(f.target.value),
          onKeyDown: (f) => {
            f.key === "Enter" && r(i);
          },
          placeholder: s.placeholder,
          className: "flex-1 w-full h-8 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        }
      ),
      /* @__PURE__ */ t(
        "button",
        {
          onClick: () => r(i),
          disabled: i.length < 9 || !d,
          className: "h-8 w-8 flex items-center justify-center rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors",
          type: "button",
          title: d ? "Call" : "Connecting...",
          children: x === "connecting" ? /* @__PURE__ */ t("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ t(O, { className: "w-4 h-4" })
        }
      )
    ] }),
    u === "progress" && /* @__PURE__ */ o("div", { className: "flex flex-col items-center gap-3 py-6", children: [
      /* @__PURE__ */ o("div", { className: "relative", children: [
        /* @__PURE__ */ t(b.Icon, { className: "w-12 h-12 text-yellow-500 animate-pulse" }),
        /* @__PURE__ */ t("div", { className: "absolute inset-0 rounded-full border-4 border-yellow-500/30 animate-ping" })
      ] }),
      /* @__PURE__ */ o("div", { className: "text-center", children: [
        /* @__PURE__ */ o("p", { className: "text-base font-semibold", children: [
          s.calling,
          " ",
          i
        ] }),
        /* @__PURE__ */ t("p", { className: "text-sm text-gray-500", children: s.waitingResponse })
      ] }),
      /* @__PURE__ */ o(
        "button",
        {
          onClick: l,
          className: "flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors",
          type: "button",
          children: [
            /* @__PURE__ */ t(T, { className: "w-4 h-4" }),
            s.cancel
          ]
        }
      )
    ] }),
    u === "confirmed" && /* @__PURE__ */ o("div", { className: "flex flex-col items-center gap-4 py-6", children: [
      /* @__PURE__ */ o("div", { className: "relative", children: [
        /* @__PURE__ */ t(b.Icon, { className: "w-12 h-12 text-green-500" }),
        /* @__PURE__ */ t("div", { className: "absolute inset-0 rounded-full bg-green-500/20 animate-pulse" })
      ] }),
      /* @__PURE__ */ o("div", { className: "text-center space-y-1", children: [
        /* @__PURE__ */ t("p", { className: "text-xl font-bold", children: i }),
        /* @__PURE__ */ t("p", { className: "text-2xl font-mono text-green-600 tabular-nums", children: $(h) })
      ] }),
      /* @__PURE__ */ o(
        "button",
        {
          onClick: l,
          className: "flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors",
          type: "button",
          children: [
            /* @__PURE__ */ t(T, { className: "w-4 h-4" }),
            s.hangUp
          ]
        }
      )
    ] }),
    (u === "failed" || u === "ended") && /* @__PURE__ */ o("div", { className: "flex flex-col items-center gap-3 py-6", children: [
      /* @__PURE__ */ t(
        b.Icon,
        {
          className: _(
            "w-12 h-12",
            u === "failed" ? "text-red-500" : "text-gray-500"
          )
        }
      ),
      /* @__PURE__ */ t("div", { className: "text-center", children: /* @__PURE__ */ t("p", { className: "text-base font-semibold", children: b.text }) })
    ] }),
    P && /* @__PURE__ */ o("div", { className: "fixed inset-0 z-50 flex", children: [
      /* @__PURE__ */ t(
        "div",
        {
          className: "fixed inset-0 bg-black/50",
          onClick: () => N(!1)
        }
      ),
      /* @__PURE__ */ t("div", { className: "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl", style: { backgroundColor: "white" }, children: /* @__PURE__ */ o("div", { className: "flex flex-col h-full", children: [
        /* @__PURE__ */ o("div", { className: "flex items-center justify-between p-4 border-b", children: [
          /* @__PURE__ */ o("div", { children: [
            /* @__PURE__ */ t("h2", { className: "text-lg font-semibold", children: s.callHistory }),
            /* @__PURE__ */ t("p", { className: "text-sm text-gray-500", children: g.length === 0 ? s.noCallsRegistered : `${g.length} ${s.callsRegistered}` })
          ] }),
          /* @__PURE__ */ t(
            "button",
            {
              onClick: () => N(!1),
              className: "h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors",
              type: "button",
              children: /* @__PURE__ */ t(ue, { className: "w-5 h-5" })
            }
          )
        ] }),
        /* @__PURE__ */ t("div", { className: "flex-1 overflow-y-auto p-4", children: g.length === 0 ? /* @__PURE__ */ o("div", { className: "text-center py-12 text-gray-500", children: [
          /* @__PURE__ */ t(T, { className: "w-12 h-12 mx-auto mb-2 opacity-50" }),
          /* @__PURE__ */ t("p", { children: s.noCalls })
        ] }) : /* @__PURE__ */ t("div", { className: "space-y-2", children: g.map((f, H) => /* @__PURE__ */ t(
          me,
          {
            entry: f,
            index: H,
            onCall: () => {
              a(f.number), N(!1), r(f.number);
            }
          },
          f.id
        )) }) })
      ] }) })
    ] })
  ] });
}
function me({
  entry: e,
  index: m,
  onCall: u
}) {
  const i = () => {
    switch (e.status) {
      case "completed":
        return /* @__PURE__ */ t(ce, { className: "w-4 h-4 text-green-600" });
      case "failed":
        return /* @__PURE__ */ t(ie, { className: "w-4 h-4 text-red-600" });
      case "missed":
        return /* @__PURE__ */ t(J, { className: "w-4 h-4 text-yellow-600" });
    }
  }, a = () => {
    switch (e.status) {
      case "completed":
        return "bg-green-100";
      case "failed":
        return "bg-red-100";
      case "missed":
        return "bg-yellow-100";
    }
  };
  return /* @__PURE__ */ o(
    "div",
    {
      className: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200",
      style: { animationDelay: `${m * 30}ms` },
      children: [
        /* @__PURE__ */ t("div", { className: _(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          a()
        ), children: i() }),
        /* @__PURE__ */ o("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ t("p", { className: "font-medium text-sm truncate", children: e.number }),
          /* @__PURE__ */ o("div", { className: "flex items-center gap-2 text-xs text-gray-500", children: [
            /* @__PURE__ */ t("span", { children: new Date(e.timestamp).toLocaleString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            }) }),
            e.duration > 0 && /* @__PURE__ */ o(W, { children: [
              /* @__PURE__ */ t("span", { children: "•" }),
              /* @__PURE__ */ t("span", { className: "font-mono tabular-nums", children: $(e.duration) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ t(
          "button",
          {
            onClick: u,
            className: "h-8 w-8 flex items-center justify-center shrink-0 rounded-lg hover:bg-gray-100 transition-colors",
            type: "button",
            children: /* @__PURE__ */ t(O, { className: "w-4 h-4" })
          }
        )
      ]
    }
  );
}
function xe({ config: e, className: m, onCallStart: u, onCallEnd: i, onStatusChange: a, labels: g }) {
  return /* @__PURE__ */ t(
    se,
    {
      config: e,
      onCallStart: u,
      onCallEnd: i,
      onStatusChange: a,
      children: /* @__PURE__ */ t(he, { className: m, labels: g })
    }
  );
}
function ve(e, m = {}) {
  const {
    onCallStart: u,
    onCallEnd: i,
    onStatusChange: a,
    onConnectionChange: g,
    persistHistory: h = !0,
    historyKey: r = "tbi-phone-call-history"
  } = m, [l, d] = p("disconnected"), [x, P] = p(""), [N, s] = p([]), [M, b] = p(0), [f, H] = p(!1), [S, y] = p("connecting"), v = j(null);
  I(() => {
    const c = new X(
      e,
      {
        onStatusChange: (n) => {
          d(n), a?.(n);
        },
        onConnectionChange: (n) => {
          y(n), (n === "connected" || n === "disconnected" || n === "failed") && H(c.state.isReady), g?.(n);
        },
        onCallStart: u,
        onCallEnd: i,
        onDurationUpdate: b,
        onHistoryUpdate: s,
        onRegistered: () => H(!0),
        onUnregistered: () => H(!1)
      },
      {
        persistHistory: h,
        historyKey: r
      }
    );
    return c.initialize(), v.current = c, d(c.state.status), P(c.state.callNumber), s(c.state.callHistory), H(c.state.isReady), y(c.state.connectionStatus), () => {
      c.destroy(), v.current = null;
    };
  }, [
    e.websocketUrl,
    e.sipUri,
    e.password,
    e.registrarServer,
    e.displayName,
    e.authorizationUser,
    h,
    r
  ]), I(() => {
    v.current && v.current.setEvents({
      onCallStart: u,
      onCallEnd: i,
      onStatusChange: (c) => {
        d(c), a?.(c);
      },
      onConnectionChange: (c) => {
        y(c), g?.(c);
      }
    });
  }, [u, i, a, g]);
  const D = k((c) => {
    P(c), v.current?.setCallNumber(c);
  }, []), U = k((c) => {
    v.current?.startCall(c);
  }, []), A = k(() => {
    v.current?.endCall();
  }, []), L = k(() => {
    v.current?.clearHistory(), s([]);
  }, []);
  return {
    status: l,
    callNumber: x,
    setCallNumber: D,
    callHistory: N,
    clearCallHistory: L,
    currentCallDuration: M,
    startCall: U,
    endCall: A,
    isReady: f,
    connectionStatus: S,
    ua: v.current?.ua ?? null
  };
}
export {
  xe as P,
  se as a,
  ve as b,
  oe as u
};
