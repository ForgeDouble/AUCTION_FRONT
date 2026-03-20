import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    // 팝업(채팅창)에서는 듣지 않고, 메인 창만 수신
    if (window.opener) return;

    const CH = "auction:navigate";

    // BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(CH);
      bc.onmessage = (ev) => {
        const path = ev?.data?.path;
        if (typeof path === "string" && path.startsWith("/")) {
          navigate(path);
        }
      };
    } catch {}

    // localStorage fallback
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CH || !e.newValue) return;
      try {
        const data = JSON.parse(e.newValue);
        const path = data?.path;
        if (typeof path === "string" && path.startsWith("/")) {
          navigate(path);
        }
      } catch {}
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        bc?.close();
      } catch {}
    };
  }, [navigate]);

  return null;
}
