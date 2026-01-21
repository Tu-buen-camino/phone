import { defineComponent as re, ref as p, computed as ee, onMounted as X, onUnmounted as Y, createElementBlock as m, openBlock as f, normalizeClass as K, unref as B, createCommentVNode as V, createBlock as ie, createElementVNode as e, withDirectives as ce, vModelText as de, toDisplayString as k, createTextVNode as te, Teleport as ue, Fragment as F, renderList as ve, normalizeStyle as fe, readonly as D, provide as ge, inject as he } from "vue";
import { d as me, f as G, c as J, J as W, P as pe } from "../index-C6FtpsEs.js";
const ye = {
  key: 0,
  class: "flex gap-2 items-center"
}, Ce = ["placeholder"], xe = ["disabled", "title"], we = {
  key: 0,
  class: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
}, be = {
  key: 1,
  class: "w-4 h-4",
  viewBox: "0 0 24 24",
  fill: "currentColor"
}, Se = {
  key: 1,
  class: "flex flex-col items-center gap-3 py-6"
}, Ee = { class: "text-center" }, _e = { class: "text-base font-semibold" }, ke = { class: "text-sm text-gray-500" }, ze = {
  key: 2,
  class: "flex flex-col items-center gap-4 py-6"
}, He = { class: "text-center space-y-1" }, Ue = { class: "text-xl font-bold" }, Me = { class: "text-2xl font-mono text-green-600 tabular-nums" }, De = {
  key: 3,
  class: "flex flex-col items-center gap-3 py-6"
}, Re = {
  key: 0,
  d: "M6.5 5.5 12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z"
}, Ne = {
  key: 1,
  d: "M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
}, Ie = { class: "text-center" }, Te = { class: "text-base font-semibold" }, Le = {
  key: 0,
  class: "fixed inset-0 z-50 flex"
}, Pe = {
  class: "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl",
  style: { "background-color": "white" }
}, $e = { class: "flex flex-col h-full" }, Be = { class: "flex items-center justify-between p-4 border-b" }, Ve = { class: "text-lg font-semibold" }, je = { class: "text-sm text-gray-500" }, Ae = { class: "flex-1 overflow-y-auto p-4" }, Oe = {
  key: 0,
  class: "text-center py-12 text-gray-500"
}, Ke = {
  key: 1,
  class: "space-y-2"
}, Fe = {
  key: 2,
  d: "M6.5 5.5 12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z"
}, Je = { class: "flex-1 min-w-0" }, We = { class: "font-medium text-sm truncate" }, qe = { class: "flex items-center gap-2 text-xs text-gray-500" }, Ge = { class: "font-mono tabular-nums" }, Qe = ["onClick"], tt = /* @__PURE__ */ re({
  __name: "Phone",
  props: {
    config: {},
    className: { default: "" },
    labels: { default: () => ({}) },
    onCallStart: {},
    onCallEnd: {},
    onStatusChange: {}
  },
  emits: ["callStart", "callEnd", "statusChange"],
  setup(v, { emit: R }) {
    const y = v, C = R;
    let c = null, g = null;
    function w(s) {
      return `${s.websocketUrl}|${s.sipUri}|${s.authorizationUser}`;
    }
    function d(s) {
      const t = w(s);
      if (c && g === t)
        return c;
      if (c && g !== t) {
        try {
          c.ua.stop();
        } catch {
        }
        c = null;
      }
      g = t;
      const E = {
        sockets: [new W.WebSocketInterface(s.websocketUrl)],
        uri: s.sipUri,
        password: s.password,
        registrar_server: s.registrarServer,
        display_name: s.displayName,
        authorization_user: s.authorizationUser,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30
      }, U = new W.UA(E), Z = document.createElement("audio");
      Z.autoplay = !0;
      const T = {
        ua: U,
        audio: Z,
        isStarted: !1,
        listeners: /* @__PURE__ */ new Set()
      };
      return U.on("connecting", () => {
        T.listeners.forEach((_) => _.onConnecting?.());
      }), U.on("connected", () => {
        T.listeners.forEach((_) => _.onConnected?.());
      }), U.on("disconnected", () => {
        T.listeners.forEach((_) => _.onDisconnected?.());
      }), U.on("registered", () => {
        T.listeners.forEach((_) => _.onRegistered?.());
      }), U.on("unregistered", () => {
        T.listeners.forEach((_) => _.onUnregistered?.());
      }), U.on("registrationFailed", (_) => {
        T.listeners.forEach((P) => P.onRegistrationFailed?.(_?.cause));
      }), U.on("newRTCSession", (_) => {
        const P = _.session;
        P.direction === "outgoing" && (T.listeners.forEach(($) => $.onNewSession?.(P)), P.connection && (P.connection.addEventListener("addstream", ($) => {
          if (!$.streams?.length) return;
          const O = document.createElement("audio");
          O.srcObject = $.streams[0], O.play();
        }), P.connection.addEventListener("track", ($) => {
          const O = document.createElement("audio");
          O.srcObject = $.streams[0], O.play();
        })));
      }), c = T, T;
    }
    const o = p("disconnected"), r = p(""), i = p([]), b = p(0), u = p(!1), x = p("connecting"), S = p(!1);
    let l = null, z = null, M = null, H = null, N = null;
    const n = ee(() => ({ ...me, ...y.labels })), L = ee(() => {
      switch (o.value) {
        case "progress":
          return { text: `${n.value.calling}...`, color: "text-yellow-500", icon: "ring" };
        case "confirmed":
          return { text: `${n.value.inCall} - ${G(b.value)}`, color: "text-green-500", icon: "inTalk" };
        case "failed":
          return { text: n.value.callEnded, color: "text-red-500", icon: "missed" };
        case "ended":
          return { text: n.value.callEnded, color: "text-gray-500", icon: "hangup" };
        default:
          return { text: n.value.inactive, color: "text-gray-300", icon: "phone" };
      }
    });
    function I(s, t, a) {
      const E = {
        id: Date.now().toString(),
        number: s,
        timestamp: Date.now(),
        duration: t,
        status: a
      };
      i.value = [E, ...i.value].slice(0, 50), localStorage.setItem("tbi-phone-call-history", JSON.stringify(i.value));
    }
    function h() {
      z && (z.terminate(), z = null);
    }
    function A(s) {
      if (!s.trim() || !l) return;
      if (!u.value) {
        console.warn("Phone is not ready yet. Please wait for registration.");
        return;
      }
      r.value = s, y.onCallStart?.(s), C("callStart", s);
      const a = {
        eventHandlers: {
          progress: () => {
            o.value = "progress", y.onStatusChange?.("progress"), C("statusChange", "progress");
          },
          failed: (E) => {
            console.error("Call failed:", E?.cause), o.value = "failed", y.onStatusChange?.("failed"), C("statusChange", "failed"), I(s, 0, "failed"), y.onCallEnd?.(s, 0, "failed"), C("callEnd", s, 0, "failed"), z = null, setTimeout(() => {
              o.value = "disconnected", y.onStatusChange?.("disconnected"), C("statusChange", "disconnected");
            }, 3e3);
          },
          ended: () => {
            o.value = "ended", y.onStatusChange?.("ended"), C("statusChange", "ended");
            const E = M ? Math.floor((Date.now() - M) / 1e3) : 0;
            I(s, E, "completed"), y.onCallEnd?.(s, E, "completed"), C("callEnd", s, E, "completed"), z = null, H && (clearInterval(H), H = null), setTimeout(() => {
              o.value = "disconnected", y.onStatusChange?.("disconnected"), C("statusChange", "disconnected"), M = null, b.value = 0;
            }, 2e3);
          },
          confirmed: () => {
            o.value = "confirmed", y.onStatusChange?.("confirmed"), C("statusChange", "confirmed"), M = Date.now(), H = setInterval(() => {
              M && (b.value = Math.floor((Date.now() - M) / 1e3));
            }, 1e3);
          }
        },
        mediaConstraints: { audio: !0, video: !1 }
      };
      o.value = "progress", y.onStatusChange?.("progress"), C("statusChange", "progress");
      try {
        z = l.ua.call(s, a);
      } catch (E) {
        console.error("Failed to start call:", E), o.value = "failed", y.onStatusChange?.("failed"), C("statusChange", "failed"), I(s, 0, "failed"), setTimeout(() => {
          o.value = "disconnected", y.onStatusChange?.("disconnected"), C("statusChange", "disconnected");
        }, 3e3);
      }
    }
    function q(s) {
      s.key === "Enter" && A(r.value);
    }
    function se(s) {
      r.value = s.number, S.value = !1, A(s.number);
    }
    function oe(s) {
      switch (s) {
        case "completed":
          return "bg-green-100";
        case "failed":
          return "bg-red-100";
        case "missed":
          return "bg-yellow-100";
      }
    }
    function le(s) {
      switch (s) {
        case "completed":
          return "text-green-600";
        case "failed":
          return "text-red-600";
        case "missed":
          return "text-yellow-600";
      }
    }
    function ae(s) {
      return new Date(s).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return X(() => {
      l = d(y.config), l.ua.isRegistered() ? (u.value = !0, x.value = "connected") : l.ua.isConnected() && (x.value = "connected"), N = {
        onConnecting: () => {
          x.value = "connecting";
        },
        onConnected: () => {
          x.value = "connected";
        },
        onDisconnected: () => {
          x.value = "disconnected", u.value = !1;
        },
        onRegistered: () => {
          u.value = !0, x.value = "connected";
        },
        onUnregistered: () => {
          u.value = !1;
        },
        onRegistrationFailed: (a) => {
          console.error("Registration failed:", a), u.value = !1, x.value = "failed";
        },
        onNewSession: (a) => {
          z = a;
        }
      }, l.listeners.add(N), l.isStarted || (l.ua.start(), l.isStarted = !0);
      const s = localStorage.getItem("tbi-phone-call-history");
      if (s)
        try {
          i.value = JSON.parse(s);
        } catch (a) {
          console.error("Error loading call history", a);
        }
      const t = (a) => {
        const U = a.detail.number;
        o.value === "disconnected" && A(U);
      };
      window.addEventListener("StartCallEvent", t);
    }), Y(() => {
      H && clearInterval(H), l && N && l.listeners.delete(N);
    }), (s, t) => (f(), m("div", {
      class: K(B(J)("tbi-phone w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-2", v.className))
    }, [
      o.value === "disconnected" ? (f(), m("div", ye, [
        e("button", {
          onClick: t[0] || (t[0] = (a) => S.value = !0),
          class: "h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors",
          type: "button"
        }, [...t[5] || (t[5] = [
          e("svg", {
            class: "w-4 h-4",
            viewBox: "0 0 24 24",
            fill: "currentColor"
          }, [
            e("path", { d: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" })
          ], -1)
        ])]),
        ce(e("input", {
          type: "text",
          "onUpdate:modelValue": t[1] || (t[1] = (a) => r.value = a),
          onKeydown: q,
          placeholder: n.value.placeholder,
          class: "flex-1 w-full h-8 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        }, null, 40, Ce), [
          [de, r.value]
        ]),
        e("button", {
          onClick: t[2] || (t[2] = (a) => A(r.value)),
          disabled: r.value.length < 9 || !u.value,
          class: "h-8 w-8 flex items-center justify-center rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors",
          type: "button",
          title: u.value ? "Call" : "Connecting..."
        }, [
          x.value === "connecting" ? (f(), m("div", we)) : (f(), m("svg", be, [...t[6] || (t[6] = [
            e("path", { d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" }, null, -1)
          ])]))
        ], 8, xe)
      ])) : V("", !0),
      o.value === "progress" ? (f(), m("div", Se, [
        t[8] || (t[8] = e("div", { class: "relative" }, [
          e("svg", {
            class: "w-12 h-12 text-yellow-500 animate-pulse",
            viewBox: "0 0 24 24",
            fill: "currentColor"
          }, [
            e("path", { d: "M15.05 5A7 7 0 0 1 19 8.95M15.05 1A11 11 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" })
          ]),
          e("div", { class: "absolute inset-0 rounded-full border-4 border-yellow-500/30 animate-ping" })
        ], -1)),
        e("div", Ee, [
          e("p", _e, k(n.value.calling) + " " + k(r.value), 1),
          e("p", ke, k(n.value.waitingResponse), 1)
        ]),
        e("button", {
          onClick: h,
          class: "flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors",
          type: "button"
        }, [
          t[7] || (t[7] = e("svg", {
            class: "w-4 h-4",
            viewBox: "0 0 24 24",
            fill: "currentColor"
          }, [
            e("path", { d: "M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" })
          ], -1)),
          te(" " + k(n.value.cancel), 1)
        ])
      ])) : V("", !0),
      o.value === "confirmed" ? (f(), m("div", ze, [
        t[10] || (t[10] = e("div", { class: "relative" }, [
          e("svg", {
            class: "w-12 h-12 text-green-500",
            viewBox: "0 0 24 24",
            fill: "currentColor"
          }, [
            e("path", { d: "M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.12-.74-.03-1.02.24l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" })
          ]),
          e("div", { class: "absolute inset-0 rounded-full bg-green-500/20 animate-pulse" })
        ], -1)),
        e("div", He, [
          e("p", Ue, k(r.value), 1),
          e("p", Me, k(B(G)(b.value)), 1)
        ]),
        e("button", {
          onClick: h,
          class: "flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors",
          type: "button"
        }, [
          t[9] || (t[9] = e("svg", {
            class: "w-4 h-4",
            viewBox: "0 0 24 24",
            fill: "currentColor"
          }, [
            e("path", { d: "M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" })
          ], -1)),
          te(" " + k(n.value.hangUp), 1)
        ])
      ])) : V("", !0),
      o.value === "failed" || o.value === "ended" ? (f(), m("div", De, [
        (f(), m("svg", {
          class: K(B(J)("w-12 h-12", o.value === "failed" ? "text-red-500" : "text-gray-500")),
          viewBox: "0 0 24 24",
          fill: "currentColor"
        }, [
          o.value === "failed" ? (f(), m("path", Re)) : (f(), m("path", Ne))
        ], 2)),
        e("div", Ie, [
          e("p", Te, k(L.value.text), 1)
        ])
      ])) : V("", !0),
      (f(), ie(ue, { to: "body" }, [
        S.value ? (f(), m("div", Le, [
          e("div", {
            class: "fixed inset-0 bg-black/50",
            onClick: t[3] || (t[3] = (a) => S.value = !1)
          }),
          e("div", Pe, [
            e("div", $e, [
              e("div", Be, [
                e("div", null, [
                  e("h2", Ve, k(n.value.callHistory), 1),
                  e("p", je, k(i.value.length === 0 ? n.value.noCallsRegistered : `${i.value.length} ${n.value.callsRegistered}`), 1)
                ]),
                e("button", {
                  onClick: t[4] || (t[4] = (a) => S.value = !1),
                  class: "h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors",
                  type: "button"
                }, [...t[11] || (t[11] = [
                  e("svg", {
                    class: "w-5 h-5",
                    viewBox: "0 0 24 24",
                    fill: "currentColor"
                  }, [
                    e("path", { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" })
                  ], -1)
                ])])
              ]),
              e("div", Ae, [
                i.value.length === 0 ? (f(), m("div", Oe, [
                  t[12] || (t[12] = e("svg", {
                    class: "w-12 h-12 mx-auto mb-2 opacity-50",
                    viewBox: "0 0 24 24",
                    fill: "currentColor"
                  }, [
                    e("path", { d: "M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" })
                  ], -1)),
                  e("p", null, k(n.value.noCalls), 1)
                ])) : (f(), m("div", Ke, [
                  (f(!0), m(F, null, ve(i.value, (a, E) => (f(), m("div", {
                    key: a.id,
                    class: "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200",
                    style: fe({ animationDelay: `${E * 30}ms` })
                  }, [
                    e("div", {
                      class: K(B(J)("w-9 h-9 rounded-full flex items-center justify-center shrink-0", oe(a.status)))
                    }, [
                      (f(), m("svg", {
                        class: K(B(J)("w-4 h-4", le(a.status))),
                        viewBox: "0 0 24 24",
                        fill: "currentColor"
                      }, [
                        a.status === "completed" ? (f(), m(F, { key: 0 }, [
                          t[13] || (t[13] = e("path", { d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" }, null, -1)),
                          t[14] || (t[14] = e("path", { d: "M16 3l-5 5-2-2-1.5 1.5L11 11l6.5-6.5z" }, null, -1))
                        ], 64)) : a.status === "failed" ? (f(), m(F, { key: 1 }, [
                          t[15] || (t[15] = e("path", { d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" }, null, -1)),
                          t[16] || (t[16] = e("path", { d: "M19 6.41L17.59 5 15 7.59 12.41 5 11 6.41 13.59 9 11 11.59 12.41 13 15 10.41 17.59 13 19 11.59 16.41 9z" }, null, -1))
                        ], 64)) : (f(), m("path", Fe))
                      ], 2))
                    ], 2),
                    e("div", Je, [
                      e("p", We, k(a.number), 1),
                      e("div", qe, [
                        e("span", null, k(ae(a.timestamp)), 1),
                        a.duration > 0 ? (f(), m(F, { key: 0 }, [
                          t[17] || (t[17] = e("span", null, "•", -1)),
                          e("span", Ge, k(B(G)(a.duration)), 1)
                        ], 64)) : V("", !0)
                      ])
                    ]),
                    e("button", {
                      onClick: (U) => se(a),
                      class: "h-8 w-8 flex items-center justify-center shrink-0 rounded-lg hover:bg-gray-100 transition-colors",
                      type: "button"
                    }, [...t[18] || (t[18] = [
                      e("svg", {
                        class: "w-4 h-4",
                        viewBox: "0 0 24 24",
                        fill: "currentColor"
                      }, [
                        e("path", { d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" })
                      ], -1)
                    ])], 8, Qe)
                  ], 4))), 128))
                ]))
              ])
            ])
          ])
        ])) : V("", !0)
      ]))
    ], 2));
  }
}), ne = /* @__PURE__ */ Symbol("Phone");
let j = null, Q = null;
function Xe(v) {
  return `${v.websocketUrl}|${v.sipUri}|${v.authorizationUser}`;
}
function Ye(v) {
  const R = Xe(v);
  if (j && Q === R)
    return j;
  if (j && Q !== R) {
    try {
      j.ua.stop();
    } catch {
    }
    j = null;
  }
  Q = R;
  const C = {
    sockets: [new W.WebSocketInterface(v.websocketUrl)],
    uri: v.sipUri,
    password: v.password,
    registrar_server: v.registrarServer,
    display_name: v.displayName,
    authorization_user: v.authorizationUser,
    connection_recovery_min_interval: 2,
    connection_recovery_max_interval: 30
  }, c = new W.UA(C), g = document.createElement("audio");
  g.autoplay = !0;
  const w = {
    ua: c,
    audio: g,
    isStarted: !1,
    listeners: /* @__PURE__ */ new Set()
  };
  return c.on("connecting", () => {
    w.listeners.forEach((d) => d.onConnecting?.());
  }), c.on("connected", () => {
    w.listeners.forEach((d) => d.onConnected?.());
  }), c.on("disconnected", () => {
    w.listeners.forEach((d) => d.onDisconnected?.());
  }), c.on("registered", () => {
    w.listeners.forEach((d) => d.onRegistered?.());
  }), c.on("unregistered", () => {
    w.listeners.forEach((d) => d.onUnregistered?.());
  }), c.on("registrationFailed", (d) => {
    w.listeners.forEach((o) => o.onRegistrationFailed?.(d?.cause));
  }), c.on("newRTCSession", (d) => {
    const o = d.session;
    o.direction === "outgoing" && (w.listeners.forEach((r) => r.onNewSession?.(o)), o.connection && (o.connection.addEventListener("addstream", (r) => {
      if (!r.streams?.length) return;
      const i = document.createElement("audio");
      i.srcObject = r.streams[0], i.play();
    }), o.connection.addEventListener("track", (r) => {
      const i = document.createElement("audio");
      i.srcObject = r.streams[0], i.play();
    })));
  }), j = w, w;
}
function nt(v) {
  const { config: R, onCallStart: y, onCallEnd: C, onStatusChange: c } = v, g = p("disconnected"), w = p(""), d = p([]), o = p(0), r = p(!1), i = p("connecting");
  let b = null, u = null, x = null, S = null;
  const l = (n) => {
    w.value = n;
  }, z = (n, L, I) => {
    const h = {
      id: Date.now().toString(),
      number: n,
      timestamp: Date.now(),
      duration: L,
      status: I
    };
    d.value = [h, ...d.value].slice(0, 50), localStorage.setItem("tbi-phone-call-history", JSON.stringify(d.value));
  }, M = () => {
    u && (u.terminate(), u = null);
  }, H = (n) => {
    if (!n.trim() || !b) return;
    if (!r.value) {
      console.warn("Phone is not ready yet. Please wait for registration.");
      return;
    }
    w.value = n, y?.(n);
    const I = {
      eventHandlers: {
        progress: () => {
          g.value = "progress", c?.("progress");
        },
        failed: (h) => {
          console.error("Call failed:", h?.cause), g.value = "failed", c?.("failed"), z(n, 0, "failed"), C?.(n, 0, "failed"), u = null, setTimeout(() => {
            g.value = "disconnected", c?.("disconnected");
          }, 3e3);
        },
        ended: () => {
          g.value = "ended", c?.("ended");
          const h = x ? Math.floor((Date.now() - x) / 1e3) : 0;
          z(n, h, "completed"), C?.(n, h, "completed"), u = null, S && (clearInterval(S), S = null), setTimeout(() => {
            g.value = "disconnected", c?.("disconnected"), x = null, o.value = 0;
          }, 2e3);
        },
        confirmed: () => {
          g.value = "confirmed", c?.("confirmed"), x = Date.now(), S = setInterval(() => {
            x && (o.value = Math.floor((Date.now() - x) / 1e3));
          }, 1e3);
        }
      },
      mediaConstraints: { audio: !0, video: !1 }
    };
    g.value = "progress", c?.("progress");
    try {
      u = b.ua.call(n, I);
    } catch (h) {
      console.error("Failed to start call:", h), g.value = "failed", c?.("failed"), z(n, 0, "failed"), setTimeout(() => {
        g.value = "disconnected", c?.("disconnected");
      }, 3e3);
    }
  };
  X(() => {
    b = Ye(R), b.ua.isRegistered() ? (r.value = !0, i.value = "connected") : b.ua.isConnected() && (i.value = "connected");
    const n = {
      onConnecting: () => {
        i.value = "connecting";
      },
      onConnected: () => {
        i.value = "connected";
      },
      onDisconnected: () => {
        i.value = "disconnected", r.value = !1;
      },
      onRegistered: () => {
        r.value = !0, i.value = "connected";
      },
      onUnregistered: () => {
        r.value = !1;
      },
      onRegistrationFailed: (h) => {
        console.error("Registration failed:", h), r.value = !1, i.value = "failed";
      },
      onNewSession: (h) => {
        u = h;
      }
    };
    b.listeners.add(n), b.isStarted || (b.ua.start(), b.isStarted = !0);
    const L = localStorage.getItem("tbi-phone-call-history");
    if (L)
      try {
        d.value = JSON.parse(L);
      } catch (h) {
        console.error("Error loading call history", h);
      }
    const I = (h) => {
      const q = h.detail.number;
      g.value === "disconnected" && H(q);
    };
    window.addEventListener("StartCallEvent", I);
  }), Y(() => {
    S && clearInterval(S);
  });
  const N = {
    status: D(g),
    callNumber: w,
    setCallNumber: l,
    callHistory: D(d),
    currentCallDuration: D(o),
    startCall: H,
    endCall: M,
    isReady: D(r),
    connectionStatus: D(i)
  };
  return ge(ne, N), N;
}
function st() {
  const v = he(ne);
  if (!v)
    throw new Error("usePhone must be used within a component that has called usePhoneProvider");
  return v;
}
function ot(v, R = {}) {
  const {
    onCallStart: y,
    onCallEnd: C,
    onStatusChange: c,
    onConnectionChange: g,
    persistHistory: w = !0,
    historyKey: d = "tbi-phone-call-history"
  } = R, o = p("disconnected"), r = p(""), i = p([]), b = p(0), u = p(!1), x = p("connecting"), S = p(null);
  let l = null;
  X(() => {
    l = new pe(
      v,
      {
        onStatusChange: (n) => {
          o.value = n, c?.(n);
        },
        onConnectionChange: (n) => {
          x.value = n, l && (u.value = l.state.isReady), g?.(n);
        },
        onCallStart: y,
        onCallEnd: C,
        onDurationUpdate: (n) => {
          b.value = n;
        },
        onHistoryUpdate: (n) => {
          i.value = n;
        },
        onRegistered: () => {
          u.value = !0;
        },
        onUnregistered: () => {
          u.value = !1;
        }
      },
      {
        persistHistory: w,
        historyKey: d
      }
    ), l.initialize(), o.value = l.state.status, r.value = l.state.callNumber, i.value = l.state.callHistory, u.value = l.state.isReady, x.value = l.state.connectionStatus, S.value = l.ua;
  }), Y(() => {
    l && (l.destroy(), l = null);
  });
  const z = (n) => {
    r.value = n, l?.setCallNumber(n);
  }, M = (n) => {
    l?.startCall(n);
  }, H = () => {
    l?.endCall();
  }, N = () => {
    l?.clearHistory(), i.value = [];
  };
  return {
    status: D(o),
    callNumber: r,
    setCallNumber: z,
    callHistory: D(i),
    clearCallHistory: N,
    currentCallDuration: D(b),
    startCall: M,
    endCall: H,
    isReady: D(u),
    connectionStatus: D(x),
    ua: S
  };
}
export {
  tt as Phone,
  ne as PhoneKey,
  tt as default,
  st as usePhone,
  ot as usePhoneManager,
  nt as usePhoneProvider
};
