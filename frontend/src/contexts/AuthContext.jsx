import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { api, API_URL } from "../data/Api";
import { profileClient } from "../data/UserService";

const AuthContext = createContext(null);

async function lireSession() {
  try {
    const token = localStorage.getItem("access_token");
    const dataUser = JSON.parse(localStorage.getItem("user") ?? "null");
    if (token && dataUser) {
      const user = await profileClient(dataUser.idUser);
      return {
        token,
        user: { ...user, notifications: user.notifications ?? [] },
      };
    }
    return { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

const decoderJwt = (token) => {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ token: null, user: null });
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // 1. Chargement initial
  useEffect(() => {
    const initialiserAuth = async () => {
      const sessionActive = await lireSession();
      setSession(sessionActive);
      setLoading(false);
    };
    initialiserAuth();
  }, []);

  // 2. WebSocket — temps réel des notifications
  useEffect(() => {
    if (!session.token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

  const url = "http://localhost:3000/notifications"
    const socket = io( url, {
      auth: { token: session.token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("WS connecté"));
    socket.on("connect_error", (e) => console.warn("WS error:", e.message));

    socket.on("notification", (newNotif) => {
      console.log("Nouvelle notif :", newNotif);
      setSession((prev) =>
        prev.user
          ? {
              ...prev,
              user: {
                ...prev.user,
                notifications: [
                  newNotif,
                  ...(prev.user.notifications ?? []),
                ],
              },
            }
          : prev,
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session.token]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    socketRef.current?.disconnect();
    setSession({ token: null, user: null });
  }, []);

  useEffect(() => {
    window.addEventListener("auth:expired", logout);
    return () => window.removeEventListener("auth:expired", logout);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const token = data.access_token;
      const payload = decoderJwt(token);
      const dataUser = {
        idUser: payload.sub,
        email: payload.username,
        role: payload.role,
      };
      const user = await profileClient(payload.sub);

      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(dataUser));
      setSession({
        token,
        user: { ...user, notifications: user.notifications ?? [] },
      });

      return { success: true, role: user.role };
    } catch (error) {
      const brut = error.response?.data?.message;
      const message = Array.isArray(brut) ? brut.join(" · ") : brut;
      return {
        success: false,
        message:
          message ||
          (error.response
            ? "Identifiants incorrects"
            : "Le serveur ne répond pas"),
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        token: session.token,
        role: session.user?.role ?? null,
        isAuthenticated: !!session.token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  return context;
}

export const redirectionRouteParRole = (role) => {
  switch (role) {
    case "LOCATAIRE":
      return "/";
    case "ADMIN":
      return "/admin/";
    case "GESTIONNAIRE":
      return "/admin/";
    default:
      return "/auth/login";
  }
};

// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useState,
// } from "react";
// import { api } from "../data/Api";
// import { profileClient } from "../data/UserService";

// const AuthContext = createContext(null);

// async function lireSession() {
//   try {
//     const token = localStorage.getItem("access_token");
//     const dataUser = JSON.parse(localStorage.getItem("user") ?? "null");
//     if (token && dataUser) {
//       const data = {
//         token,
//         user: await profileClient(dataUser.idUser),
//       };
//       return data;
//     }
//     return { token: null, user: null };
//   } catch {
//     return { token: null, user: null };
//   }
// }

// const decoderJwt = (token) => {
//   const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
//   return JSON.parse(atob(base64));
// };

// export function AuthProvider({ children }) {
//   const [session, setSession] = useState({ token: null, user: null });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const initialiserAuth = async () => {
//       const sessionActive = await lireSession();
//       setSession(sessionActive);
//       setLoading(false);
//     };
//     initialiserAuth();
//   }, []);

//   console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxx")

//   const logout = useCallback(() => {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("user");
//     setSession({ token: null, user: null });
//   }, []);

//   useEffect(() => {
//     window.addEventListener("auth:expired", logout);
//     return () => window.removeEventListener("auth:expired", logout);
//   }, [logout]);

//   const login = async (email, password) => {
//     try {
//       const { data } = await api.post("/auth/login", { email, password });
//       const token = data.access_token;
//       const payload = decoderJwt(token);
//       const dataUser = {
//         idUser: payload.sub,
//         email: payload.username,
//         role: payload.role,
//       };
//       const user = await profileClient(payload.sub);

//       localStorage.setItem("access_token", token);
//       localStorage.setItem("user", JSON.stringify(dataUser));
//       setSession({ token, user });

//       return { success: true, role: user.role };
//     } catch (error) {
//       const brut = error.response?.data?.message;
//       const message = Array.isArray(brut) ? brut.join(" · ") : brut;
//       return {
//         success: false,
//         message:
//           message ||
//           (error.response
//             ? "Identifiants incorrects"
//             : "Le serveur ne répond pas"),
//       };
//     }
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user: session.user,
//         token: session.token,
//         role: session.user?.role ?? null,
//         isAuthenticated: !!session.token,
//         loading,
//         login,
//         logout,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context)
//     throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
//   return context;
// }

// export const redirectionRouteParRole = (role) => {
//   switch (role) {
//     case "LOCATAIRE":
//       return "/";
//     case "ADMIN":
//       return "/admin/";
//     case "GESTIONNAIRE":
//       return "/admin/";
//     default:
//       return "/auth/login";
//   }
// };
